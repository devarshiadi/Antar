package location

import (
	"sync"
	"time"

	"github.com/antar/backend/pkg/websocket"
)

// Service handles location business logic
type Service struct {
	geocoder      *Geocoder
	hub           *websocket.Hub
	liveLocations map[string]*UserLocation // rideID -> location
	mutex         sync.RWMutex
}

// NewService creates a new location service
func NewService(nominatimURL, osrmURL string) *Service {
	hub := websocket.NewHub()
	go hub.Run()

	return &Service{
		geocoder:      NewGeocoder(nominatimURL, osrmURL),
		hub:           hub,
		liveLocations: make(map[string]*UserLocation),
	}
}

// GetHub returns the WebSocket hub
func (s *Service) GetHub() *websocket.Hub {
	return s.hub
}

// Search searches for locations
func (s *Service) Search(query string, lat, lng float64, limit int) ([]*SearchResult, error) {
	return s.geocoder.Search(query, lat, lng, limit)
}

// ReverseGeocode converts coordinates to address
func (s *Service) ReverseGeocode(lat, lng float64) (*Location, error) {
	return s.geocoder.ReverseGeocode(lat, lng)
}

// CalculateRoute calculates route between two points
func (s *Service) CalculateRoute(fromLat, fromLng, toLat, toLng float64) (*Route, error) {
	return s.geocoder.CalculateRoute(fromLat, fromLng, toLat, toLng)
}

// UpdateLocation updates a user's live location
func (s *Service) UpdateLocation(userID string, req *UpdateLocationRequest) error {
	location := &UserLocation{
		UserID:    userID,
		RideID:    req.RideID,
		Lat:       req.Lat,
		Lng:       req.Lng,
		Heading:   req.Heading,
		Speed:     req.Speed,
		Accuracy:  req.Accuracy,
		UpdatedAt: time.Now(),
	}

	// Store location
	s.mutex.Lock()
	s.liveLocations[req.RideID] = location
	s.mutex.Unlock()

	// Broadcast to all subscribers of this ride
	s.hub.Broadcast(&websocket.Message{
		Type:   "location_update",
		RoomID: req.RideID,
		Payload: map[string]interface{}{
			"user_id":    userID,
			"ride_id":    req.RideID,
			"lat":        req.Lat,
			"lng":        req.Lng,
			"heading":    req.Heading,
			"speed":      req.Speed,
			"updated_at": location.UpdatedAt,
		},
	})

	return nil
}

// GetLiveLocation gets the current location for a ride
func (s *Service) GetLiveLocation(rideID string) (*UserLocation, bool) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	location, exists := s.liveLocations[rideID]
	return location, exists
}

// ClearLocation clears location data for a ride (when ride completes)
func (s *Service) ClearLocation(rideID string) {
	s.mutex.Lock()
	delete(s.liveLocations, rideID)
	s.mutex.Unlock()
}
