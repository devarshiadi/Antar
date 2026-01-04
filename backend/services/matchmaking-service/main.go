package main

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	_ "github.com/mattn/go-sqlite3"
)

// ==================== CONFIGURATION ====================

type Config struct {
	Port           string
	Environment    string
	JWTSecret      string
	DatabasePath   string
	AuthServiceURL string
}

func LoadConfig() *Config {
	return &Config{
		Port:           getEnv("PORT", "7860"),
		Environment:    getEnv("ENVIRONMENT", "development"),
		JWTSecret:      getEnv("JWT_SECRET", "antar-super-secret-key-change-in-production"),
		DatabasePath:   getEnv("DATABASE_PATH", "./data"),
		AuthServiceURL: getEnv("AUTH_SERVICE_URL", "http://localhost:8001"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// ==================== DATABASE ====================

type DB struct {
	*sql.DB
}

func NewDB(dataPath string) (*DB, error) {
	if err := os.MkdirAll(dataPath, 0755); err != nil {
		return nil, err
	}

	dbPath := filepath.Join(dataPath, "matchmaking.db")
	db, err := sql.Open("sqlite3", dbPath+"?_foreign_keys=on&_journal_mode=WAL")
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	return &DB{db}, nil
}

func (db *DB) Migrate() error {
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
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_rides_user ON rides(user_id);
	CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
	CREATE INDEX IF NOT EXISTS idx_requests_ride ON ride_requests(ride_id);
	`
	_, err := db.Exec(schema)
	return err
}

// ==================== MODELS ====================

type Ride struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	UserName      string    `json:"user_name"`
	UserRating    float64   `json:"user_rating"`
	Type          string    `json:"type"`
	FromAddress   string    `json:"from_address"`
	FromLat       float64   `json:"from_lat"`
	FromLng       float64   `json:"from_lng"`
	ToAddress     string    `json:"to_address"`
	ToLat         float64   `json:"to_lat"`
	ToLng         float64   `json:"to_lng"`
	DepartureTime time.Time `json:"departure_time"`
	Seats         int       `json:"seats"`
	AvailSeats    int       `json:"avail_seats"`
	Price         float64   `json:"price"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type RideRequest struct {
	ID          string    `json:"id"`
	RideID      string    `json:"ride_id"`
	SeekerID    string    `json:"seeker_id"`
	SeekerName  string    `json:"seeker_name"`
	DriverID    string    `json:"driver_id"`
	DriverName  string    `json:"driver_name"`
	Status      string    `json:"status"`
	SeatsNeeded int       `json:"seats_needed"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Match struct {
	RideID       string  `json:"ride_id"`
	Score        float64 `json:"score"`
	RouteOverlap float64 `json:"route_overlap"`
	TimeDiff     float64 `json:"time_diff_minutes"`
}

type CreateRideRequest struct {
	Type          string    `json:"type" binding:"required,oneof=offer request"`
	FromAddress   string    `json:"from_address" binding:"required"`
	FromLat       float64   `json:"from_lat" binding:"required"`
	FromLng       float64   `json:"from_lng" binding:"required"`
	ToAddress     string    `json:"to_address" binding:"required"`
	ToLat         float64   `json:"to_lat" binding:"required"`
	ToLng         float64   `json:"to_lng" binding:"required"`
	DepartureTime time.Time `json:"departure_time" binding:"required"`
	Seats         int       `json:"seats" binding:"required,min=1"`
	Price         float64   `json:"price"`
}

// ==================== MATCHING ALGORITHM ====================

const (
	RouteOverlapWeight = 0.50
	TimeMatchWeight    = 0.25
	RatingBonusWeight  = 0.25
	MinMatchScore      = 70.0
	MaxPickupDistance  = 2.0
	MaxDropDistance    = 3.0
	MaxTimeDifference  = 60.0
)

func CalculateMatchScore(offer, request *Ride) float64 {
	if offer.UserID == request.UserID {
		return 0
	}

	routeScore := calculateRouteOverlap(offer, request)
	timeScore := calculateTimeMatch(offer, request)
	ratingScore := calculateRatingBonus(offer, request)

	return (routeScore * RouteOverlapWeight * 100) +
		(timeScore * TimeMatchWeight * 100) +
		(ratingScore * RatingBonusWeight * 100)
}

func calculateRouteOverlap(offer, request *Ride) float64 {
	pickupDistance := haversine(offer.FromLat, offer.FromLng, request.FromLat, request.FromLng)
	dropDistance := haversine(offer.ToLat, offer.ToLng, request.ToLat, request.ToLng)

	if pickupDistance > MaxPickupDistance || dropDistance > MaxDropDistance {
		return 0
	}

	pickupScore := 1.0 - (pickupDistance / MaxPickupDistance)
	dropScore := 1.0 - (dropDistance / MaxDropDistance)

	return (pickupScore * 0.6) + (dropScore * 0.4)
}

func calculateTimeMatch(offer, request *Ride) float64 {
	timeDiff := math.Abs(offer.DepartureTime.Sub(request.DepartureTime).Minutes())

	if timeDiff <= 15 {
		return 1.0
	}
	if timeDiff > MaxTimeDifference {
		return 0
	}

	return 1.0 - ((timeDiff - 15) / (MaxTimeDifference - 15))
}

func calculateRatingBonus(offer, request *Ride) float64 {
	return (offer.UserRating + request.UserRating) / 10.0
}

func haversine(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadius = 6371.0

	lat1Rad := lat1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	deltaLat := (lat2 - lat1) * math.Pi / 180
	deltaLon := (lon2 - lon1) * math.Pi / 180

	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(deltaLon/2)*math.Sin(deltaLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadius * c
}

// ==================== WEBSOCKET HUB ====================

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type WSClient struct {
	ID     string
	UserID string
	Conn   *websocket.Conn
	Send   chan []byte
}

type WSHub struct {
	clients    map[string]map[*WSClient]bool
	broadcast  chan []byte
	register   chan *WSClient
	unregister chan *WSClient
	mutex      sync.RWMutex
}

func NewWSHub() *WSHub {
	return &WSHub{
		clients:    make(map[string]map[*WSClient]bool),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *WSClient),
		unregister: make(chan *WSClient),
	}
}

func (h *WSHub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			if h.clients[client.UserID] == nil {
				h.clients[client.UserID] = make(map[*WSClient]bool)
			}
			h.clients[client.UserID][client] = true
			h.mutex.Unlock()

		case client := <-h.unregister:
			h.mutex.Lock()
			if clients, ok := h.clients[client.UserID]; ok {
				delete(clients, client)
				close(client.Send)
			}
			h.mutex.Unlock()

		case message := <-h.broadcast:
			h.mutex.RLock()
			for _, clients := range h.clients {
				for client := range clients {
					select {
					case client.Send <- message:
					default:
						close(client.Send)
						delete(h.clients[client.UserID], client)
					}
				}
			}
			h.mutex.RUnlock()
		}
	}
}

func (h *WSHub) SendToUser(userID string, data interface{}) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	msg, _ := json.Marshal(data)
	if clients, ok := h.clients[userID]; ok {
		for client := range clients {
			select {
			case client.Send <- msg:
			default:
			}
		}
	}
}

func (h *WSHub) Broadcast(data interface{}) {
	msg, _ := json.Marshal(data)
	h.broadcast <- msg
}

// ==================== REPOSITORY ====================

var (
	ErrRideNotFound     = errors.New("ride not found")
	ErrRequestNotFound  = errors.New("request not found")
	ErrNoSeats          = errors.New("no seats available")
	ErrAlreadyRequested = errors.New("already requested")
)

type Repository struct {
	db *DB
}

func NewRepository(db *DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateRide(ride *Ride) error {
	ride.ID = uuid.New().String()
	ride.Status = "available"
	ride.AvailSeats = ride.Seats
	ride.CreatedAt = time.Now()
	ride.UpdatedAt = time.Now()

	_, err := r.db.Exec(`
		INSERT INTO rides (id, user_id, user_name, user_rating, type, from_address, from_lat, from_lng,
			to_address, to_lat, to_lng, departure_time, seats, avail_seats, price, status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, ride.ID, ride.UserID, ride.UserName, ride.UserRating, ride.Type, ride.FromAddress, ride.FromLat, ride.FromLng,
		ride.ToAddress, ride.ToLat, ride.ToLng, ride.DepartureTime, ride.Seats, ride.AvailSeats, ride.Price,
		ride.Status, ride.CreatedAt, ride.UpdatedAt)

	return err
}

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
	return ride, err
}

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

func (r *Repository) GetAvailableRides(rideType string) ([]*Ride, error) {
	query := `
		SELECT id, user_id, user_name, user_rating, type, from_address, from_lat, from_lng,
			to_address, to_lat, to_lng, departure_time, seats, avail_seats, price, status, created_at, updated_at
		FROM rides WHERE status = 'available'`
	if rideType != "" {
		query += fmt.Sprintf(` AND type = '%s'`, rideType)
	}
	query += ` ORDER BY departure_time ASC`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanRides(rows)
}

func (r *Repository) UpdateRide(ride *Ride) error {
	ride.UpdatedAt = time.Now()
	_, err := r.db.Exec(`
		UPDATE rides SET departure_time = ?, seats = ?, avail_seats = ?, price = ?, status = ?, updated_at = ?
		WHERE id = ?
	`, ride.DepartureTime, ride.Seats, ride.AvailSeats, ride.Price, ride.Status, ride.UpdatedAt, ride.ID)
	return err
}

func (r *Repository) CreateRequest(req *RideRequest) error {
	var count int
	r.db.QueryRow(`SELECT COUNT(*) FROM ride_requests WHERE ride_id = ? AND seeker_id = ? AND status = 'pending'`,
		req.RideID, req.SeekerID).Scan(&count)
	if count > 0 {
		return ErrAlreadyRequested
	}

	req.ID = uuid.New().String()
	req.Status = "pending"
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()

	_, err := r.db.Exec(`
		INSERT INTO ride_requests (id, ride_id, seeker_id, seeker_name, driver_id, driver_name, status, seats_needed, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, req.ID, req.RideID, req.SeekerID, req.SeekerName, req.DriverID, req.DriverName, req.Status, req.SeatsNeeded, req.CreatedAt, req.UpdatedAt)
	return err
}

func (r *Repository) GetRequestByID(id string) (*RideRequest, error) {
	req := &RideRequest{}
	err := r.db.QueryRow(`
		SELECT id, ride_id, seeker_id, seeker_name, driver_id, driver_name, status, seats_needed, created_at, updated_at
		FROM ride_requests WHERE id = ?
	`, id).Scan(&req.ID, &req.RideID, &req.SeekerID, &req.SeekerName, &req.DriverID, &req.DriverName,
		&req.Status, &req.SeatsNeeded, &req.CreatedAt, &req.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrRequestNotFound
	}
	return req, err
}

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
		rows.Scan(&req.ID, &req.RideID, &req.SeekerID, &req.SeekerName, &req.DriverID, &req.DriverName,
			&req.Status, &req.SeatsNeeded, &req.CreatedAt, &req.UpdatedAt)
		requests = append(requests, req)
	}
	return requests, nil
}

func (r *Repository) UpdateRequest(req *RideRequest) error {
	req.UpdatedAt = time.Now()
	_, err := r.db.Exec(`UPDATE ride_requests SET status = ?, updated_at = ? WHERE id = ?`,
		req.Status, req.UpdatedAt, req.ID)
	return err
}

func scanRides(rows *sql.Rows) ([]*Ride, error) {
	var rides []*Ride
	for rows.Next() {
		ride := &Ride{}
		rows.Scan(&ride.ID, &ride.UserID, &ride.UserName, &ride.UserRating, &ride.Type,
			&ride.FromAddress, &ride.FromLat, &ride.FromLng, &ride.ToAddress, &ride.ToLat, &ride.ToLng,
			&ride.DepartureTime, &ride.Seats, &ride.AvailSeats, &ride.Price, &ride.Status,
			&ride.CreatedAt, &ride.UpdatedAt)
		rides = append(rides, ride)
	}
	return rides, nil
}

// ==================== SERVICE ====================

type Service struct {
	repo       *Repository
	hub        *WSHub
	authURL    string
	httpClient *http.Client
}

func NewService(repo *Repository, hub *WSHub, authURL string) *Service {
	return &Service{
		repo:       repo,
		hub:        hub,
		authURL:    authURL,
		httpClient: &http.Client{Timeout: 5 * time.Second},
	}
}

func (s *Service) CreateRide(userID, userName string, userRating float64, req *CreateRideRequest) (*Ride, []*Match, error) {
	ride := &Ride{
		UserID:        userID,
		UserName:      userName,
		UserRating:    userRating,
		Type:          req.Type,
		FromAddress:   req.FromAddress,
		FromLat:       req.FromLat,
		FromLng:       req.FromLng,
		ToAddress:     req.ToAddress,
		ToLat:         req.ToLat,
		ToLng:         req.ToLng,
		DepartureTime: req.DepartureTime,
		Seats:         req.Seats,
		Price:         req.Price,
	}

	if err := s.repo.CreateRide(ride); err != nil {
		return nil, nil, err
	}

	s.setUserBusy(userID, true)
	s.hub.Broadcast(map[string]interface{}{"type": "new_ride", "ride": ride})

	matches := s.findMatches(ride)

	return ride, matches, nil
}

func (s *Service) findMatches(ride *Ride) []*Match {
	var matchType string
	if ride.Type == "offer" {
		matchType = "request"
	} else {
		matchType = "offer"
	}

	availableRides, _ := s.repo.GetAvailableRides(matchType)
	var matches []*Match

	for _, other := range availableRides {
		score := CalculateMatchScore(ride, other)
		if score >= MinMatchScore {
			matches = append(matches, &Match{
				RideID:       other.ID,
				Score:        score,
				RouteOverlap: calculateRouteOverlap(ride, other) * 100,
				TimeDiff:     math.Abs(ride.DepartureTime.Sub(other.DepartureTime).Minutes()),
			})

			s.hub.SendToUser(other.UserID, map[string]interface{}{
				"type":        "new_match",
				"ride":        ride,
				"match_score": score,
			})
		}
	}

	return matches
}

func (s *Service) RequestToJoin(seekerID, seekerName, rideID string, seatsNeeded int) (*RideRequest, error) {
	ride, err := s.repo.GetRideByID(rideID)
	if err != nil {
		return nil, err
	}

	if ride.Status != "available" {
		return nil, errors.New("ride not available")
	}
	if ride.AvailSeats < seatsNeeded {
		return nil, ErrNoSeats
	}
	if ride.UserID == seekerID {
		return nil, errors.New("cannot request your own ride")
	}

	req := &RideRequest{
		RideID:      rideID,
		SeekerID:    seekerID,
		SeekerName:  seekerName,
		DriverID:    ride.UserID,
		DriverName:  ride.UserName,
		SeatsNeeded: seatsNeeded,
	}

	if err := s.repo.CreateRequest(req); err != nil {
		return nil, err
	}

	s.hub.SendToUser(ride.UserID, map[string]interface{}{
		"type":    "new_request",
		"request": req,
		"ride":    ride,
	})

	return req, nil
}

func (s *Service) RespondToRequest(driverID, requestID string, accept bool) (*RideRequest, error) {
	req, err := s.repo.GetRequestByID(requestID)
	if err != nil {
		return nil, err
	}

	if req.DriverID != driverID {
		return nil, errors.New("forbidden")
	}

	ride, _ := s.repo.GetRideByID(req.RideID)

	if accept {
		if ride.AvailSeats < req.SeatsNeeded {
			return nil, ErrNoSeats
		}
		req.Status = "accepted"
		ride.AvailSeats -= req.SeatsNeeded
		if ride.AvailSeats == 0 {
			ride.Status = "in_progress"
		}
		s.setUserBusy(req.SeekerID, true)
	} else {
		req.Status = "rejected"
	}

	s.repo.UpdateRequest(req)
	s.repo.UpdateRide(ride)

	s.hub.SendToUser(req.SeekerID, map[string]interface{}{
		"type":    "request_response",
		"request": req,
		"action":  req.Status,
	})

	return req, nil
}

func (s *Service) CompleteRide(userID, rideID string) (*Ride, error) {
	ride, err := s.repo.GetRideByID(rideID)
	if err != nil {
		return nil, err
	}
	if ride.UserID != userID {
		return nil, errors.New("forbidden")
	}

	ride.Status = "completed"
	s.repo.UpdateRide(ride)
	s.setUserBusy(userID, false)

	requests, _ := s.repo.GetRequestsForRide(rideID)
	for _, req := range requests {
		if req.Status == "accepted" {
			s.setUserBusy(req.SeekerID, false)
		}
	}

	s.hub.Broadcast(map[string]interface{}{"type": "ride_completed", "ride": ride})

	return ride, nil
}

func (s *Service) setUserBusy(userID string, isBusy bool) {
	if s.authURL == "" {
		return
	}
	payload, _ := json.Marshal(map[string]interface{}{"user_id": userID, "is_busy": isBusy})
	go s.httpClient.Post(s.authURL+"/internal/set-busy", "application/json", bytes.NewBuffer(payload))
}

// ==================== JWT MIDDLEWARE ====================

type Claims struct {
	UserID      string `json:"user_id"`
	PhoneNumber string `json:"phone_number"`
	Role        string `json:"role"`
	jwt.RegisteredClaims
}

func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid format"})
			c.Abort()
			return
		}

		token, err := jwt.ParseWithClaims(parts[1], &Claims{}, func(t *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims := token.Claims.(*Claims)
		c.Set("user_id", claims.UserID)
		c.Set("phone_number", claims.PhoneNumber)
		c.Next()
	}
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

// ==================== HANDLERS ====================

type Handler struct {
	service *Service
	repo    *Repository
	hub     *WSHub
}

func NewHandler(service *Service, repo *Repository, hub *WSHub) *Handler {
	return &Handler{service: service, repo: repo, hub: hub}
}

func (h *Handler) CreateRide(c *gin.Context) {
	userID := c.GetString("user_id")
	userName := c.GetString("phone_number")

	var req CreateRideRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ride, matches, err := h.service.CreateRide(userID, userName, 5.0, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"ride": ride, "matches": matches})
}

func (h *Handler) GetRide(c *gin.Context) {
	ride, err := h.repo.GetRideByID(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ride": ride})
}

func (h *Handler) GetMyRides(c *gin.Context) {
	rides, _ := h.repo.GetRidesByUser(c.GetString("user_id"))
	c.JSON(http.StatusOK, gin.H{"rides": rides, "count": len(rides)})
}

func (h *Handler) GetAvailableRides(c *gin.Context) {
	rides, _ := h.repo.GetAvailableRides(c.Query("type"))
	c.JSON(http.StatusOK, gin.H{"rides": rides, "count": len(rides)})
}

func (h *Handler) RequestToJoin(c *gin.Context) {
	userID := c.GetString("user_id")
	userName := c.GetString("phone_number")
	rideID := c.Param("id")

	var req struct {
		SeatsNeeded int `json:"seats_needed"`
	}
	c.ShouldBindJSON(&req)
	if req.SeatsNeeded == 0 {
		req.SeatsNeeded = 1
	}

	request, err := h.service.RequestToJoin(userID, userName, rideID, req.SeatsNeeded)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"request": request})
}

func (h *Handler) RespondToRequest(c *gin.Context) {
	userID := c.GetString("user_id")
	requestID := c.Param("requestId")

	var req struct {
		Action string `json:"action"`
	}
	c.ShouldBindJSON(&req)

	request, err := h.service.RespondToRequest(userID, requestID, req.Action == "accept")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"request": request})
}

func (h *Handler) GetRequestsForRide(c *gin.Context) {
	requests, _ := h.repo.GetRequestsForRide(c.Param("id"))
	c.JSON(http.StatusOK, gin.H{"requests": requests})
}

func (h *Handler) CompleteRide(c *gin.Context) {
	ride, err := h.service.CompleteRide(c.GetString("user_id"), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ride": ride})
}

func (h *Handler) CancelRide(c *gin.Context) {
	userID := c.GetString("user_id")
	rideID := c.Param("id")

	ride, err := h.repo.GetRideByID(rideID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	if ride.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	ride.Status = "cancelled"
	h.repo.UpdateRide(ride)
	h.service.setUserBusy(userID, false)

	c.JSON(http.StatusOK, gin.H{"message": "Ride cancelled"})
}

func (h *Handler) FindMatches(c *gin.Context) {
	ride, err := h.repo.GetRideByID(c.Param("rideId"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	matches := h.service.findMatches(ride)
	c.JSON(http.StatusOK, gin.H{"matches": matches, "count": len(matches)})
}

func (h *Handler) HandleWebSocket(c *gin.Context) {
	userID := c.Query("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId required"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	client := &WSClient{
		ID:     uuid.New().String(),
		UserID: userID,
		Conn:   conn,
		Send:   make(chan []byte, 256),
	}

	h.hub.register <- client

	go func() {
		defer func() { h.hub.unregister <- client; conn.Close() }()
		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				break
			}
		}
	}()

	go func() {
		defer conn.Close()
		for msg := range client.Send {
			conn.WriteMessage(websocket.TextMessage, msg)
		}
	}()
}

// ==================== MAIN ====================

func main() {
	cfg := LoadConfig()

	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	db, err := NewDB(cfg.DatabasePath)
	if err != nil {
		log.Fatalf("Database error: %v", err)
	}
	defer db.Close()
	db.Migrate()

	hub := NewWSHub()
	go hub.Run()

	repo := NewRepository(db)
	service := NewService(repo, hub, cfg.AuthServiceURL)
	handler := NewHandler(service, repo, hub)

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(CORSMiddleware())

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy", "service": "antar-matchmaking"})
	})

	rides := router.Group("/api/rides")
	rides.Use(AuthMiddleware(cfg.JWTSecret))
	{
		rides.POST("", handler.CreateRide)
		rides.GET("", handler.GetAvailableRides)
		rides.GET("/my-rides", handler.GetMyRides)
		rides.GET("/:id", handler.GetRide)
		rides.DELETE("/:id", handler.CancelRide)
		rides.POST("/:id/request", handler.RequestToJoin)
		rides.PUT("/:id/request/:requestId", handler.RespondToRequest)
		rides.GET("/:id/requests", handler.GetRequestsForRide)
		rides.POST("/:id/complete", handler.CompleteRide)
	}

	matches := router.Group("/api/matches")
	matches.Use(AuthMiddleware(cfg.JWTSecret))
	{
		matches.GET("/find/:rideId", handler.FindMatches)
	}

	router.GET("/ws/rides", handler.HandleWebSocket)

	srv := &http.Server{Addr: ":" + cfg.Port, Handler: router}

	go func() {
		log.Printf("🚗 Matchmaking service starting on port %s", cfg.Port)
		srv.ListenAndServe()
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}