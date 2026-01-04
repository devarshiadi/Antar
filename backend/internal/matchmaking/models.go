package matchmaking

import (
	"time"
)

// Ride represents a ride offer or request
type Ride struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	UserName      string    `json:"user_name"`
	UserRating    float64   `json:"user_rating"`
	Type          string    `json:"type"` // offer, request
	FromAddress   string    `json:"from_address"`
	FromLat       float64   `json:"from_lat"`
	FromLng       float64   `json:"from_lng"`
	ToAddress     string    `json:"to_address"`
	ToLat         float64   `json:"to_lat"`
	ToLng         float64   `json:"to_lng"`
	DepartureTime time.Time `json:"departure_time"`
	Seats         int       `json:"seats"`
	AvailSeats    int       `json:"avail_seats"` // remaining seats after bookings
	Price         float64   `json:"price"`
	Status        string    `json:"status"` // available, pending, in_progress, completed, cancelled
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// RideRequest represents a request to join a ride
type RideRequest struct {
	ID          string    `json:"id"`
	RideID      string    `json:"ride_id"`
	SeekerID    string    `json:"seeker_id"`
	SeekerName  string    `json:"seeker_name"`
	DriverID    string    `json:"driver_id"`
	DriverName  string    `json:"driver_name"`
	Status      string    `json:"status"` // pending, accepted, rejected, cancelled
	SeatsNeeded int       `json:"seats_needed"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Match represents a potential match between rides
type Match struct {
	ID            string    `json:"id"`
	OfferRideID   string    `json:"offer_ride_id"`
	RequestRideID string    `json:"request_ride_id"`
	Score         float64   `json:"score"`
	RouteOverlap  float64   `json:"route_overlap"`
	TimeDiff      float64   `json:"time_diff_minutes"`
	Status        string    `json:"status"` // suggested, accepted, rejected
	CreatedAt     time.Time `json:"created_at"`
}

// CreateRideRequest represents ride creation payload
type CreateRideRequest struct {
	Type          string    `json:"type" binding:"required,oneof=offer request"`
	FromAddress   string    `json:"from_address" binding:"required"`
	FromLat       float64   `json:"from_lat" binding:"required"`
	FromLng       float64   `json:"from_lng" binding:"required"`
	ToAddress     string    `json:"to_address" binding:"required"`
	ToLat         float64   `json:"to_lat" binding:"required"`
	ToLng         float64   `json:"to_lng" binding:"required"`
	DepartureTime time.Time `json:"departure_time" binding:"required"`
	Seats         int       `json:"seats" binding:"required,min=1,max=8"`
	Price         float64   `json:"price" binding:"min=0"`
}

// UpdateRideRequest represents ride update payload
type UpdateRideRequest struct {
	DepartureTime *time.Time `json:"departure_time,omitempty"`
	Seats         *int       `json:"seats,omitempty"`
	Price         *float64   `json:"price,omitempty"`
	Status        *string    `json:"status,omitempty"`
}

// JoinRideRequest represents a request to join a ride
type JoinRideRequest struct {
	SeatsNeeded int `json:"seats_needed" binding:"required,min=1"`
}

// RespondToRequestPayload represents accept/reject payload
type RespondToRequestPayload struct {
	Action string `json:"action" binding:"required,oneof=accept reject"`
}

// SearchRidesParams represents search query parameters
type SearchRidesParams struct {
	FromLat   float64   `form:"from_lat"`
	FromLng   float64   `form:"from_lng"`
	ToLat     float64   `form:"to_lat"`
	ToLng     float64   `form:"to_lng"`
	DateTime  time.Time `form:"datetime"`
	Seats     int       `form:"seats"`
	MaxRadius float64   `form:"max_radius"` // in km
}

// RideResponse represents ride data response
type RideResponse struct {
	Ride    *Ride  `json:"ride"`
	Message string `json:"message,omitempty"`
}

// RidesResponse represents multiple rides response
type RidesResponse struct {
	Rides   []*Ride `json:"rides"`
	Count   int     `json:"count"`
	Message string  `json:"message,omitempty"`
}

// MatchResponse represents match data response
type MatchResponse struct {
	Match   *Match  `json:"match"`
	Ride    *Ride   `json:"ride,omitempty"`
	Message string  `json:"message,omitempty"`
}

// MatchesResponse represents multiple matches response
type MatchesResponse struct {
	Matches []*Match `json:"matches"`
	Rides   []*Ride  `json:"rides,omitempty"`
	Count   int      `json:"count"`
}

// RequestResponse represents ride request response
type RequestResponse struct {
	Request *RideRequest `json:"request"`
	Message string       `json:"message,omitempty"`
}

// WebSocket message types
type WSMessage struct {
	Type    string      `json:"type"` // new_ride, ride_update, new_match, request_update
	Payload interface{} `json:"payload"`
}
