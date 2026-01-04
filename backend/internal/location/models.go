package location

import (
	"time"
)

// Location represents a geographic location
type Location struct {
	Lat         float64 `json:"lat"`
	Lng         float64 `json:"lng"`
	Address     string  `json:"address,omitempty"`
	DisplayName string  `json:"display_name,omitempty"`
	City        string  `json:"city,omitempty"`
	State       string  `json:"state,omitempty"`
	Country     string  `json:"country,omitempty"`
	PostalCode  string  `json:"postal_code,omitempty"`
}

// SearchResult represents a geocoding search result
type SearchResult struct {
	PlaceID     string  `json:"place_id"`
	DisplayName string  `json:"display_name"`
	Lat         float64 `json:"lat"`
	Lng         float64 `json:"lng"`
	Type        string  `json:"type"`
	Importance  float64 `json:"importance"`
}

// Route represents a route between two points
type Route struct {
	Distance    float64      `json:"distance"` // in meters
	Duration    float64      `json:"duration"` // in seconds
	StartPoint  Location     `json:"start_point"`
	EndPoint    Location     `json:"end_point"`
	Geometry    *RouteGeometry `json:"geometry,omitempty"`
}

// RouteGeometry represents route path
type RouteGeometry struct {
	Type        string      `json:"type"`
	Coordinates [][]float64 `json:"coordinates"`
}

// UserLocation represents a user's live location
type UserLocation struct {
	UserID    string    `json:"user_id"`
	RideID    string    `json:"ride_id"`
	Lat       float64   `json:"lat"`
	Lng       float64   `json:"lng"`
	Heading   float64   `json:"heading,omitempty"`
	Speed     float64   `json:"speed,omitempty"`
	Accuracy  float64   `json:"accuracy,omitempty"`
	UpdatedAt time.Time `json:"updated_at"`
}

// SearchRequest represents location search request
type SearchRequest struct {
	Query   string  `form:"q" binding:"required"`
	Lat     float64 `form:"lat"`
	Lng     float64 `form:"lng"`
	Limit   int     `form:"limit"`
}

// ReverseGeocodeRequest represents reverse geocoding request
type ReverseGeocodeRequest struct {
	Lat float64 `form:"lat" binding:"required"`
	Lng float64 `form:"lng" binding:"required"`
}

// RouteRequest represents route calculation request
type RouteRequest struct {
	FromLat float64 `form:"from_lat" binding:"required"`
	FromLng float64 `form:"from_lng" binding:"required"`
	ToLat   float64 `form:"to_lat" binding:"required"`
	ToLng   float64 `form:"to_lng" binding:"required"`
}

// UpdateLocationRequest represents location update payload
type UpdateLocationRequest struct {
	RideID   string  `json:"ride_id" binding:"required"`
	Lat      float64 `json:"lat" binding:"required"`
	Lng      float64 `json:"lng" binding:"required"`
	Heading  float64 `json:"heading"`
	Speed    float64 `json:"speed"`
	Accuracy float64 `json:"accuracy"`
}

// SearchResponse represents search results response
type SearchResponse struct {
	Results []*SearchResult `json:"results"`
	Count   int             `json:"count"`
}

// LocationResponse represents location response
type LocationResponse struct {
	Location *Location `json:"location"`
	Message  string    `json:"message,omitempty"`
}

// RouteResponse represents route response
type RouteResponse struct {
	Route   *Route `json:"route"`
	Message string `json:"message,omitempty"`
}

// WSLocationMessage represents location WebSocket message
type WSLocationMessage struct {
	Type    string        `json:"type"` // location_update, subscribe, unsubscribe
	Payload *UserLocation `json:"payload,omitempty"`
	RideID  string        `json:"ride_id,omitempty"`
}
