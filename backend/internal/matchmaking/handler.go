package matchmaking

import (
	"net/http"

	"github.com/antar/backend/pkg/middleware"
	"github.com/antar/backend/pkg/websocket"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	ws "github.com/gorilla/websocket"
)

// Handler handles HTTP requests for matchmaking
type Handler struct {
	service *Service
}

// NewHandler creates a new matchmaking handler
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes registers matchmaking routes
func (h *Handler) RegisterRoutes(r *gin.Engine, authMiddleware gin.HandlerFunc) {
	rides := r.Group("/api/rides")
	rides.Use(authMiddleware)
	{
		rides.POST("", h.CreateRide)
		rides.GET("", h.GetAvailableRides)
		rides.GET("/my-rides", h.GetUserRides)
		rides.GET("/:id", h.GetRide)
		rides.PUT("/:id", h.UpdateRide)
		rides.DELETE("/:id", h.CancelRide)
		rides.POST("/:id/request", h.RequestToJoin)
		rides.PUT("/:id/request/:requestId", h.RespondToRequest)
		rides.GET("/:id/requests", h.GetRequestsForRide)
		rides.POST("/:id/complete", h.CompleteRide)
	}

	matches := r.Group("/api/matches")
	matches.Use(authMiddleware)
	{
		matches.GET("/:rideId", h.GetMatches)
		matches.GET("/find/:rideId", h.FindMatches)
	}

	requests := r.Group("/api/requests")
	requests.Use(authMiddleware)
	{
		requests.GET("/my-requests", h.GetUserRequests)
	}

	// WebSocket endpoint
	r.GET("/ws/rides", h.HandleWebSocket)
}

// CreateRide creates a new ride
// @Summary Create a new ride offer or request
// @Tags Rides
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body CreateRideRequest true "Ride data"
// @Success 201 {object} RideResponse
// @Router /api/rides [post]
func (h *Handler) CreateRide(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req CreateRideRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user info from claims (simplified - in production, fetch from auth service)
	userName := c.GetString("phone_number") // Using phone as name fallback
	userRating := 5.0                        // Default rating

	ride, matches, err := h.service.CreateRide(userID, userName, userRating, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"ride":    ride,
		"matches": matches,
		"message": "Ride created successfully",
	})
}

// GetRide retrieves a ride by ID
// @Summary Get ride by ID
// @Tags Rides
// @Security BearerAuth
// @Produce json
// @Param id path string true "Ride ID"
// @Success 200 {object} RideResponse
// @Router /api/rides/{id} [get]
func (h *Handler) GetRide(c *gin.Context) {
	rideID := c.Param("id")

	ride, err := h.service.GetRide(rideID)
	if err != nil {
		status := http.StatusInternalServerError
		if err == ErrRideNotFound {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, RideResponse{Ride: ride})
}

// GetUserRides retrieves all rides for the current user
// @Summary Get user's rides
// @Tags Rides
// @Security BearerAuth
// @Produce json
// @Success 200 {object} RidesResponse
// @Router /api/rides/my-rides [get]
func (h *Handler) GetUserRides(c *gin.Context) {
	userID := middleware.GetUserID(c)

	rides, err := h.service.GetUserRides(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, RidesResponse{Rides: rides, Count: len(rides)})
}

// GetAvailableRides retrieves all available rides
// @Summary Get available rides
// @Tags Rides
// @Security BearerAuth
// @Produce json
// @Param type query string false "Ride type (offer or request)"
// @Success 200 {object} RidesResponse
// @Router /api/rides [get]
func (h *Handler) GetAvailableRides(c *gin.Context) {
	rideType := c.Query("type")

	rides, err := h.service.GetAvailableRides(rideType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, RidesResponse{Rides: rides, Count: len(rides)})
}

// UpdateRide updates a ride
// @Summary Update a ride
// @Tags Rides
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Ride ID"
// @Param body body UpdateRideRequest true "Update data"
// @Success 200 {object} RideResponse
// @Router /api/rides/{id} [put]
func (h *Handler) UpdateRide(c *gin.Context) {
	userID := middleware.GetUserID(c)
	rideID := c.Param("id")

	var req UpdateRideRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ride, err := h.service.UpdateRide(userID, rideID, &req)
	if err != nil {
		status := http.StatusInternalServerError
		if err == ErrForbidden {
			status = http.StatusForbidden
		} else if err == ErrRideNotFound {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, RideResponse{Ride: ride, Message: "Ride updated successfully"})
}

// CancelRide cancels a ride
// @Summary Cancel a ride
// @Tags Rides
// @Security BearerAuth
// @Param id path string true "Ride ID"
// @Success 200 {object} object{message=string}
// @Router /api/rides/{id} [delete]
func (h *Handler) CancelRide(c *gin.Context) {
	userID := middleware.GetUserID(c)
	rideID := c.Param("id")

	if err := h.service.CancelRide(userID, rideID); err != nil {
		status := http.StatusInternalServerError
		if err == ErrForbidden {
			status = http.StatusForbidden
		} else if err == ErrRideNotFound {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ride cancelled successfully"})
}

// RequestToJoin creates a request to join a ride
// @Summary Request to join a ride
// @Tags Rides
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Ride ID"
// @Param body body JoinRideRequest true "Request data"
// @Success 201 {object} RequestResponse
// @Router /api/rides/{id}/request [post]
func (h *Handler) RequestToJoin(c *gin.Context) {
	userID := middleware.GetUserID(c)
	rideID := c.Param("id")
	userName := c.GetString("phone_number") // Fallback

	var req JoinRideRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	request, err := h.service.RequestToJoin(userID, userName, rideID, &req)
	if err != nil {
		status := http.StatusInternalServerError
		if err == ErrRideNotFound {
			status = http.StatusNotFound
		} else if err == ErrNoSeatsAvailable || err == ErrAlreadyRequested {
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, RequestResponse{Request: request, Message: "Request sent successfully"})
}

// RespondToRequest accepts or rejects a ride request
// @Summary Accept or reject a ride request
// @Tags Rides
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Ride ID"
// @Param requestId path string true "Request ID"
// @Param body body RespondToRequestPayload true "Response action"
// @Success 200 {object} RequestResponse
// @Router /api/rides/{id}/request/{requestId} [put]
func (h *Handler) RespondToRequest(c *gin.Context) {
	userID := middleware.GetUserID(c)
	requestID := c.Param("requestId")

	var payload RespondToRequestPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	accept := payload.Action == "accept"
	request, err := h.service.RespondToRequest(userID, requestID, accept)
	if err != nil {
		status := http.StatusInternalServerError
		if err == ErrForbidden {
			status = http.StatusForbidden
		} else if err == ErrRequestNotFound {
			status = http.StatusNotFound
		} else if err == ErrNoSeatsAvailable {
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, RequestResponse{
		Request: request,
		Message: "Request " + payload.Action + "ed successfully",
	})
}

// GetRequestsForRide retrieves all requests for a ride
// @Summary Get requests for a ride
// @Tags Rides
// @Security BearerAuth
// @Produce json
// @Param id path string true "Ride ID"
// @Success 200 {array} RideRequest
// @Router /api/rides/{id}/requests [get]
func (h *Handler) GetRequestsForRide(c *gin.Context) {
	userID := middleware.GetUserID(c)
	rideID := c.Param("id")

	requests, err := h.service.GetRequestsForRide(userID, rideID)
	if err != nil {
		status := http.StatusInternalServerError
		if err == ErrForbidden {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"requests": requests, "count": len(requests)})
}

// GetUserRequests retrieves all requests made by the user
// @Summary Get user's ride requests
// @Tags Requests
// @Security BearerAuth
// @Produce json
// @Success 200 {array} RideRequest
// @Router /api/requests/my-requests [get]
func (h *Handler) GetUserRequests(c *gin.Context) {
	userID := middleware.GetUserID(c)

	requests, err := h.service.GetUserRequests(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"requests": requests, "count": len(requests)})
}

// CompleteRide marks a ride as completed
// @Summary Complete a ride
// @Tags Rides
// @Security BearerAuth
// @Param id path string true "Ride ID"
// @Success 200 {object} RideResponse
// @Router /api/rides/{id}/complete [post]
func (h *Handler) CompleteRide(c *gin.Context) {
	userID := middleware.GetUserID(c)
	rideID := c.Param("id")

	ride, err := h.service.CompleteRide(userID, rideID)
	if err != nil {
		status := http.StatusInternalServerError
		if err == ErrForbidden {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, RideResponse{Ride: ride, Message: "Ride completed successfully"})
}

// GetMatches retrieves matches for a ride
// @Summary Get matches for a ride
// @Tags Matches
// @Security BearerAuth
// @Produce json
// @Param rideId path string true "Ride ID"
// @Success 200 {object} MatchesResponse
// @Router /api/matches/{rideId} [get]
func (h *Handler) GetMatches(c *gin.Context) {
	rideID := c.Param("rideId")

	matches, err := h.service.GetMatchesForRide(rideID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, MatchesResponse{Matches: matches, Count: len(matches)})
}

// FindMatches finds new matches for a ride
// @Summary Find matches for a ride
// @Tags Matches
// @Security BearerAuth
// @Produce json
// @Param rideId path string true "Ride ID"
// @Success 200 {object} MatchesResponse
// @Router /api/matches/find/{rideId} [get]
func (h *Handler) FindMatches(c *gin.Context) {
	rideID := c.Param("rideId")

	matches, rides, err := h.service.FindMatches(rideID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, MatchesResponse{
		Matches: matches,
		Rides:   rides,
		Count:   len(matches),
	})
}

// HandleWebSocket handles WebSocket connections for real-time ride updates
func (h *Handler) HandleWebSocket(c *gin.Context) {
	userID := c.Query("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId required"})
		return
	}

	conn, err := websocket.UpgradeConnection(c.Writer, c.Request)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upgrade connection"})
		return
	}

	client := &websocket.Client{
		ID:     uuid.New().String(),
		UserID: userID,
		Conn:   conn,
		Send:   make(chan []byte, 256),
		Hub:    h.service.GetHub(),
	}

	h.service.GetHub().Register(client)

	go client.WritePump()
	go client.ReadPump(func(c *websocket.Client, msg []byte) {
		// Handle incoming messages if needed
	})
}
