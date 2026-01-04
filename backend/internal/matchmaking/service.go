package matchmaking

import (
	"bytes"
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/antar/backend/pkg/websocket"
)

var (
	ErrUnauthorized    = errors.New("unauthorized")
	ErrForbidden       = errors.New("you don't have permission to perform this action")
	ErrInvalidRequest  = errors.New("invalid request")
)

// Service handles matchmaking business logic
type Service struct {
	repo      *Repository
	algorithm *MatchingAlgorithm
	hub       *websocket.Hub
	authURL   string // URL to auth service for user updates
}

// NewService creates a new matchmaking service
func NewService(repo *Repository, authURL string) *Service {
	hub := websocket.NewHub()
	go hub.Run()

	return &Service{
		repo:      repo,
		algorithm: NewMatchingAlgorithm(),
		hub:       hub,
		authURL:   authURL,
	}
}

// GetHub returns the WebSocket hub
func (s *Service) GetHub() *websocket.Hub {
	return s.hub
}

// CreateRide creates a new ride and finds matches
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

	// Mark user as busy (they now have an active ride)
	s.setUserBusy(userID, true)

	// Broadcast new ride to all connected clients
	s.broadcastRideUpdate("new_ride", ride)

	// Find matches for this ride
	var matchType string
	if req.Type == "offer" {
		matchType = "request"
	} else {
		matchType = "offer"
	}

	availableRides, _ := s.repo.GetAvailableRides(matchType)
	matches := s.algorithm.FindMatchesForRide(ride, availableRides)

	// Save matches to database
	for _, match := range matches {
		s.repo.SaveMatch(match)
		// Notify matched users
		s.notifyMatch(match, ride)
	}

	return ride, matches, nil
}

// GetRide retrieves a ride by ID
func (s *Service) GetRide(rideID string) (*Ride, error) {
	return s.repo.GetRideByID(rideID)
}

// GetUserRides retrieves all rides for a user
func (s *Service) GetUserRides(userID string) ([]*Ride, error) {
	return s.repo.GetRidesByUser(userID)
}

// GetAvailableRides retrieves all available rides
func (s *Service) GetAvailableRides(rideType string) ([]*Ride, error) {
	return s.repo.GetAvailableRides(rideType)
}

// UpdateRide updates a ride
func (s *Service) UpdateRide(userID, rideID string, req *UpdateRideRequest) (*Ride, error) {
	ride, err := s.repo.GetRideByID(rideID)
	if err != nil {
		return nil, err
	}

	// Check ownership
	if ride.UserID != userID {
		return nil, ErrForbidden
	}

	// Apply updates
	if req.DepartureTime != nil {
		ride.DepartureTime = *req.DepartureTime
	}
	if req.Seats != nil {
		ride.Seats = *req.Seats
		if ride.AvailSeats > *req.Seats {
			ride.AvailSeats = *req.Seats
		}
	}
	if req.Price != nil {
		ride.Price = *req.Price
	}
	if req.Status != nil {
		ride.Status = *req.Status
		// If completed or cancelled, mark user as not busy
		if *req.Status == "completed" || *req.Status == "cancelled" {
			s.setUserBusy(userID, false)
		}
	}

	if err := s.repo.UpdateRide(ride); err != nil {
		return nil, err
	}

	s.broadcastRideUpdate("ride_update", ride)
	return ride, nil
}

// CancelRide cancels a ride
func (s *Service) CancelRide(userID, rideID string) error {
	ride, err := s.repo.GetRideByID(rideID)
	if err != nil {
		return err
	}

	if ride.UserID != userID {
		return ErrForbidden
	}

	ride.Status = "cancelled"
	if err := s.repo.UpdateRide(ride); err != nil {
		return err
	}

	// Mark user as not busy
	s.setUserBusy(userID, false)

	s.broadcastRideUpdate("ride_cancelled", ride)
	return nil
}

// RequestToJoin creates a request to join a ride
func (s *Service) RequestToJoin(seekerID, seekerName, rideID string, req *JoinRideRequest) (*RideRequest, error) {
	ride, err := s.repo.GetRideByID(rideID)
	if err != nil {
		return nil, err
	}

	// Check if ride is available
	if ride.Status != "available" {
		return nil, errors.New("ride is not available")
	}

	// Check if seats are available
	if ride.AvailSeats < req.SeatsNeeded {
		return nil, ErrNoSeatsAvailable
	}

	// Can't request your own ride
	if ride.UserID == seekerID {
		return nil, errors.New("cannot request your own ride")
	}

	request := &RideRequest{
		RideID:      rideID,
		SeekerID:    seekerID,
		SeekerName:  seekerName,
		DriverID:    ride.UserID,
		DriverName:  ride.UserName,
		SeatsNeeded: req.SeatsNeeded,
	}

	if err := s.repo.CreateRideRequest(request); err != nil {
		return nil, err
	}

	// Notify driver about the request
	s.hub.SendToUser(ride.UserID, &websocket.Message{
		Type: "new_request",
		Payload: map[string]interface{}{
			"request": request,
			"ride":    ride,
		},
	})

	return request, nil
}

// RespondToRequest accepts or rejects a ride request
func (s *Service) RespondToRequest(driverID, requestID string, accept bool) (*RideRequest, error) {
	request, err := s.repo.GetRideRequestByID(requestID)
	if err != nil {
		return nil, err
	}

	// Check if user is the driver
	if request.DriverID != driverID {
		return nil, ErrForbidden
	}

	// Get the ride
	ride, err := s.repo.GetRideByID(request.RideID)
	if err != nil {
		return nil, err
	}

	if accept {
		// Check seats
		if ride.AvailSeats < request.SeatsNeeded {
			return nil, ErrNoSeatsAvailable
		}

		request.Status = "accepted"
		ride.AvailSeats -= request.SeatsNeeded

		// If no more seats, mark ride as in_progress
		if ride.AvailSeats == 0 {
			ride.Status = "in_progress"
		}

		// Mark seeker as busy
		s.setUserBusy(request.SeekerID, true)
	} else {
		request.Status = "rejected"
	}

	if err := s.repo.UpdateRideRequest(request); err != nil {
		return nil, err
	}

	if err := s.repo.UpdateRide(ride); err != nil {
		return nil, err
	}

	// Notify seeker about the response
	s.hub.SendToUser(request.SeekerID, &websocket.Message{
		Type: "request_response",
		Payload: map[string]interface{}{
			"request": request,
			"ride":    ride,
			"action":  request.Status,
		},
	})

	s.broadcastRideUpdate("ride_update", ride)

	return request, nil
}

// GetRequestsForRide retrieves all requests for a ride
func (s *Service) GetRequestsForRide(userID, rideID string) ([]*RideRequest, error) {
	ride, err := s.repo.GetRideByID(rideID)
	if err != nil {
		return nil, err
	}

	// Only ride owner can see requests
	if ride.UserID != userID {
		return nil, ErrForbidden
	}

	return s.repo.GetRequestsForRide(rideID)
}

// GetUserRequests retrieves all requests made by a user
func (s *Service) GetUserRequests(userID string) ([]*RideRequest, error) {
	return s.repo.GetRequestsBySeeker(userID)
}

// FindMatches finds matches for a ride
func (s *Service) FindMatches(rideID string) ([]*Match, []*Ride, error) {
	ride, err := s.repo.GetRideByID(rideID)
	if err != nil {
		return nil, nil, err
	}

	var matchType string
	if ride.Type == "offer" {
		matchType = "request"
	} else {
		matchType = "offer"
	}

	availableRides, err := s.repo.GetAvailableRides(matchType)
	if err != nil {
		return nil, nil, err
	}

	matches := s.algorithm.FindMatchesForRide(ride, availableRides)

	// Get ride details for each match
	var matchedRides []*Ride
	for _, match := range matches {
		var targetRideID string
		if ride.Type == "offer" {
			targetRideID = match.RequestRideID
		} else {
			targetRideID = match.OfferRideID
		}

		matchedRide, _ := s.repo.GetRideByID(targetRideID)
		if matchedRide != nil {
			matchedRides = append(matchedRides, matchedRide)
		}
	}

	return matches, matchedRides, nil
}

// GetMatchesForRide retrieves saved matches for a ride
func (s *Service) GetMatchesForRide(rideID string) ([]*Match, error) {
	return s.repo.GetMatchesForRide(rideID)
}

// CompleteRide marks a ride as completed
func (s *Service) CompleteRide(userID, rideID string) (*Ride, error) {
	ride, err := s.repo.GetRideByID(rideID)
	if err != nil {
		return nil, err
	}

	if ride.UserID != userID {
		return nil, ErrForbidden
	}

	ride.Status = "completed"
	if err := s.repo.UpdateRide(ride); err != nil {
		return nil, err
	}

	// Mark driver as not busy
	s.setUserBusy(userID, false)

	// Mark all accepted seekers as not busy
	requests, _ := s.repo.GetRequestsForRide(rideID)
	for _, req := range requests {
		if req.Status == "accepted" {
			s.setUserBusy(req.SeekerID, false)
		}
	}

	s.broadcastRideUpdate("ride_completed", ride)
	return ride, nil
}

// Helper: broadcast ride updates to all clients
func (s *Service) broadcastRideUpdate(msgType string, ride *Ride) {
	s.hub.Broadcast(&websocket.Message{
		Type:    msgType,
		Payload: ride,
	})
}

// Helper: notify matched users
func (s *Service) notifyMatch(match *Match, newRide *Ride) {
	// Find the other ride in the match
	var otherRideID string
	if newRide.ID == match.OfferRideID {
		otherRideID = match.RequestRideID
	} else {
		otherRideID = match.OfferRideID
	}

	otherRide, err := s.repo.GetRideByID(otherRideID)
	if err != nil {
		return
	}

	// Notify both users
	s.hub.SendToUser(otherRide.UserID, &websocket.Message{
		Type: "new_match",
		Payload: map[string]interface{}{
			"match":      match,
			"other_ride": newRide,
		},
	})

	s.hub.SendToUser(newRide.UserID, &websocket.Message{
		Type: "new_match",
		Payload: map[string]interface{}{
			"match":      match,
			"other_ride": otherRide,
		},
	})
}

// Helper: set user busy status via auth service
func (s *Service) setUserBusy(userID string, isBusy bool) {
	if s.authURL == "" {
		return
	}

	payload, _ := json.Marshal(map[string]interface{}{
		"user_id": userID,
		"is_busy": isBusy,
	})

	// Make request to auth service (fire and forget for now)
	go func() {
		resp, err := http.Post(s.authURL+"/internal/set-busy", "application/json", 
			bytes.NewBuffer(payload))
		if err != nil {
			log.Printf("Failed to update user busy status: %v", err)
			return
		}
		defer resp.Body.Close()
	}()
}
