package matchmaking

import (
	"database/sql"
	"errors"
	"time"

	"github.com/antar/backend/pkg/database"
	"github.com/google/uuid"
)

var (
	ErrRideNotFound    = errors.New("ride not found")
	ErrRequestNotFound = errors.New("request not found")
	ErrNoSeatsAvailable = errors.New("no seats available")
	ErrAlreadyRequested = errors.New("you have already requested to join this ride")
)

// Repository handles database operations for matchmaking
type Repository struct {
	db *database.DB
}

// NewRepository creates a new matchmaking repository
func NewRepository(db *database.DB) *Repository {
	return &Repository{db: db}
}

// Migrate creates the rides and requests tables
func (r *Repository) Migrate() error {
	schema := `
	CREATE TABLE IF NOT EXISTS rides (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		user_name TEXT NOT NULL,
		user_rating REAL DEFAULT 5.0,
		type TEXT NOT NULL,
		from_address TEXT NOT NULL,
		from_lat REAL NOT NULL,
		from_lng REAL NOT NULL,
		to_address TEXT NOT NULL,
		to_lat REAL NOT NULL,
		to_lng REAL NOT NULL,
		departure_time DATETIME NOT NULL,
		seats INTEGER NOT NULL,
		avail_seats INTEGER NOT NULL,
		price REAL DEFAULT 0,
		status TEXT DEFAULT 'available',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS ride_requests (
		id TEXT PRIMARY KEY,
		ride_id TEXT NOT NULL,
		seeker_id TEXT NOT NULL,
		seeker_name TEXT NOT NULL,
		driver_id TEXT NOT NULL,
		driver_name TEXT NOT NULL,
		status TEXT DEFAULT 'pending',
		seats_needed INTEGER DEFAULT 1,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (ride_id) REFERENCES rides(id)
	);

	CREATE TABLE IF NOT EXISTS matches (
		id TEXT PRIMARY KEY,
		offer_ride_id TEXT NOT NULL,
		request_ride_id TEXT NOT NULL,
		score REAL NOT NULL,
		route_overlap REAL,
		time_diff REAL,
		status TEXT DEFAULT 'suggested',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (offer_ride_id) REFERENCES rides(id),
		FOREIGN KEY (request_ride_id) REFERENCES rides(id)
	);

	CREATE INDEX IF NOT EXISTS idx_rides_user ON rides(user_id);
	CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
	CREATE INDEX IF NOT EXISTS idx_rides_type ON rides(type);
	CREATE INDEX IF NOT EXISTS idx_requests_ride ON ride_requests(ride_id);
	CREATE INDEX IF NOT EXISTS idx_requests_seeker ON ride_requests(seeker_id);
	`
	return r.db.Migrate(schema)
}

// CreateRide creates a new ride
func (r *Repository) CreateRide(ride *Ride) error {
	ride.ID = uuid.New().String()
	ride.CreatedAt = time.Now()
	ride.UpdatedAt = time.Now()
	ride.Status = "available"
	ride.AvailSeats = ride.Seats

	_, err := r.db.Exec(`
		INSERT INTO rides (id, user_id, user_name, user_rating, type, from_address, from_lat, from_lng, 
			to_address, to_lat, to_lng, departure_time, seats, avail_seats, price, status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, ride.ID, ride.UserID, ride.UserName, ride.UserRating, ride.Type, ride.FromAddress, ride.FromLat, ride.FromLng,
		ride.ToAddress, ride.ToLat, ride.ToLng, ride.DepartureTime, ride.Seats, ride.AvailSeats, ride.Price,
		ride.Status, ride.CreatedAt, ride.UpdatedAt)

	return err
}

// GetRideByID retrieves a ride by ID
func (r *Repository) GetRideByID(id string) (*Ride, error) {
	ride := &Ride{}
	err := r.db.QueryRow(`
		SELECT id, user_id, user_name, user_rating, type, from_address, from_lat, from_lng,
			to_address, to_lat, to_lng, departure_time, seats, avail_seats, price, status, created_at, updated_at
		FROM rides WHERE id = ?
	`, id).Scan(&ride.ID, &ride.UserID, &ride.UserName, &ride.UserRating, &ride.Type, &ride.FromAddress,
		&ride.FromLat, &ride.FromLng, &ride.ToAddress, &ride.ToLat, &ride.ToLng, &ride.DepartureTime,
		&ride.Seats, &ride.AvailSeats, &ride.Price, &ride.Status, &ride.CreatedAt, &ride.UpdatedAt)

	if err == sql.ErrNoRows {
		return nil, ErrRideNotFound
	}
	if err != nil {
		return nil, err
	}
	return ride, nil
}

// GetRidesByUser retrieves all rides for a user
func (r *Repository) GetRidesByUser(userID string) ([]*Ride, error) {
	rows, err := r.db.Query(`
		SELECT id, user_id, user_name, user_rating, type, from_address, from_lat, from_lng,
			to_address, to_lat, to_lng, departure_time, seats, avail_seats, price, status, created_at, updated_at
		FROM rides WHERE user_id = ? ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanRides(rows)
}

// GetAvailableRides retrieves all available rides
func (r *Repository) GetAvailableRides(rideType string) ([]*Ride, error) {
	query := `
		SELECT id, user_id, user_name, user_rating, type, from_address, from_lat, from_lng,
			to_address, to_lat, to_lng, departure_time, seats, avail_seats, price, status, created_at, updated_at
		FROM rides WHERE status = 'available'
	`
	if rideType != "" {
		query += ` AND type = ?`
	}
	query += ` ORDER BY departure_time ASC`

	var rows *sql.Rows
	var err error
	if rideType != "" {
		rows, err = r.db.Query(query, rideType)
	} else {
		rows, err = r.db.Query(query)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanRides(rows)
}

// UpdateRide updates a ride
func (r *Repository) UpdateRide(ride *Ride) error {
	ride.UpdatedAt = time.Now()
	_, err := r.db.Exec(`
		UPDATE rides SET departure_time = ?, seats = ?, avail_seats = ?, price = ?, status = ?, updated_at = ?
		WHERE id = ?
	`, ride.DepartureTime, ride.Seats, ride.AvailSeats, ride.Price, ride.Status, ride.UpdatedAt, ride.ID)
	return err
}

// DeleteRide deletes a ride
func (r *Repository) DeleteRide(id string) error {
	_, err := r.db.Exec(`DELETE FROM rides WHERE id = ?`, id)
	return err
}

// CreateRideRequest creates a new ride request
func (r *Repository) CreateRideRequest(request *RideRequest) error {
	// Check if user already requested
	var count int
	r.db.QueryRow(`SELECT COUNT(*) FROM ride_requests WHERE ride_id = ? AND seeker_id = ? AND status = 'pending'`,
		request.RideID, request.SeekerID).Scan(&count)
	if count > 0 {
		return ErrAlreadyRequested
	}

	request.ID = uuid.New().String()
	request.Status = "pending"
	request.CreatedAt = time.Now()
	request.UpdatedAt = time.Now()

	_, err := r.db.Exec(`
		INSERT INTO ride_requests (id, ride_id, seeker_id, seeker_name, driver_id, driver_name, status, seats_needed, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, request.ID, request.RideID, request.SeekerID, request.SeekerName, request.DriverID, request.DriverName,
		request.Status, request.SeatsNeeded, request.CreatedAt, request.UpdatedAt)

	return err
}

// GetRideRequestByID retrieves a ride request by ID
func (r *Repository) GetRideRequestByID(id string) (*RideRequest, error) {
	request := &RideRequest{}
	err := r.db.QueryRow(`
		SELECT id, ride_id, seeker_id, seeker_name, driver_id, driver_name, status, seats_needed, created_at, updated_at
		FROM ride_requests WHERE id = ?
	`, id).Scan(&request.ID, &request.RideID, &request.SeekerID, &request.SeekerName, &request.DriverID,
		&request.DriverName, &request.Status, &request.SeatsNeeded, &request.CreatedAt, &request.UpdatedAt)

	if err == sql.ErrNoRows {
		return nil, ErrRequestNotFound
	}
	if err != nil {
		return nil, err
	}
	return request, nil
}

// GetRequestsForRide retrieves all requests for a ride
func (r *Repository) GetRequestsForRide(rideID string) ([]*RideRequest, error) {
	rows, err := r.db.Query(`
		SELECT id, ride_id, seeker_id, seeker_name, driver_id, driver_name, status, seats_needed, created_at, updated_at
		FROM ride_requests WHERE ride_id = ? ORDER BY created_at DESC
	`, rideID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []*RideRequest
	for rows.Next() {
		req := &RideRequest{}
		if err := rows.Scan(&req.ID, &req.RideID, &req.SeekerID, &req.SeekerName, &req.DriverID,
			&req.DriverName, &req.Status, &req.SeatsNeeded, &req.CreatedAt, &req.UpdatedAt); err != nil {
			return nil, err
		}
		requests = append(requests, req)
	}
	return requests, nil
}

// GetRequestsBySeeker retrieves all requests made by a seeker
func (r *Repository) GetRequestsBySeeker(seekerID string) ([]*RideRequest, error) {
	rows, err := r.db.Query(`
		SELECT id, ride_id, seeker_id, seeker_name, driver_id, driver_name, status, seats_needed, created_at, updated_at
		FROM ride_requests WHERE seeker_id = ? ORDER BY created_at DESC
	`, seekerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []*RideRequest
	for rows.Next() {
		req := &RideRequest{}
		if err := rows.Scan(&req.ID, &req.RideID, &req.SeekerID, &req.SeekerName, &req.DriverID,
			&req.DriverName, &req.Status, &req.SeatsNeeded, &req.CreatedAt, &req.UpdatedAt); err != nil {
			return nil, err
		}
		requests = append(requests, req)
	}
	return requests, nil
}

// UpdateRideRequest updates a ride request
func (r *Repository) UpdateRideRequest(request *RideRequest) error {
	request.UpdatedAt = time.Now()
	_, err := r.db.Exec(`
		UPDATE ride_requests SET status = ?, updated_at = ? WHERE id = ?
	`, request.Status, request.UpdatedAt, request.ID)
	return err
}

// SaveMatch saves a match to database
func (r *Repository) SaveMatch(match *Match) error {
	match.ID = uuid.New().String()
	_, err := r.db.Exec(`
		INSERT INTO matches (id, offer_ride_id, request_ride_id, score, route_overlap, time_diff, status, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`, match.ID, match.OfferRideID, match.RequestRideID, match.Score, match.RouteOverlap, match.TimeDiff, match.Status, match.CreatedAt)
	return err
}

// GetMatchesForRide retrieves matches for a ride
func (r *Repository) GetMatchesForRide(rideID string) ([]*Match, error) {
	rows, err := r.db.Query(`
		SELECT id, offer_ride_id, request_ride_id, score, route_overlap, time_diff, status, created_at
		FROM matches WHERE offer_ride_id = ? OR request_ride_id = ? ORDER BY score DESC
	`, rideID, rideID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var matches []*Match
	for rows.Next() {
		m := &Match{}
		if err := rows.Scan(&m.ID, &m.OfferRideID, &m.RequestRideID, &m.Score, &m.RouteOverlap, &m.TimeDiff, &m.Status, &m.CreatedAt); err != nil {
			return nil, err
		}
		matches = append(matches, m)
	}
	return matches, nil
}

// Helper function to scan rides
func scanRides(rows *sql.Rows) ([]*Ride, error) {
	var rides []*Ride
	for rows.Next() {
		ride := &Ride{}
		if err := rows.Scan(&ride.ID, &ride.UserID, &ride.UserName, &ride.UserRating, &ride.Type,
			&ride.FromAddress, &ride.FromLat, &ride.FromLng, &ride.ToAddress, &ride.ToLat, &ride.ToLng,
			&ride.DepartureTime, &ride.Seats, &ride.AvailSeats, &ride.Price, &ride.Status,
			&ride.CreatedAt, &ride.UpdatedAt); err != nil {
			return nil, err
		}
		rides = append(rides, ride)
	}
	return rides, nil
}
