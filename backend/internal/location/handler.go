package location

import (
	"net/http"

	"github.com/antar/backend/pkg/middleware"
	"github.com/antar/backend/pkg/websocket"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	ws "github.com/gorilla/websocket"
)

var upgrader = ws.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Handler handles HTTP requests for location
type Handler struct {
	service *Service
}

// NewHandler creates a new location handler
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes registers location routes
func (h *Handler) RegisterRoutes(r *gin.Engine, authMiddleware gin.HandlerFunc) {
	geo := r.Group("/api/geocode")
	{
		geo.GET("/search", h.Search)
		geo.GET("/reverse", h.ReverseGeocode)
	}

	route := r.Group("/api/route")
	{
		route.GET("", h.CalculateRoute)
	}

	location := r.Group("/api/location")
	location.Use(authMiddleware)
	{
		location.POST("/update", h.UpdateLocation)
		location.GET("/live/:rideId", h.GetLiveLocation)
	}

	// WebSocket endpoint
	r.GET("/ws/location/:rideId", h.HandleWebSocket)
}

// Search searches for locations by query
// @Summary Search locations
// @Tags Location
// @Produce json
// @Param q query string true "Search query"
// @Param lat query number false "Latitude for nearby search"
// @Param lng query number false "Longitude for nearby search"
// @Param limit query int false "Result limit" default(5)
// @Success 200 {object} SearchResponse
// @Router /api/geocode/search [get]
func (h *Handler) Search(c *gin.Context) {
	var req SearchRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	results, err := h.service.Search(req.Query, req.Lat, req.Lng, req.Limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, SearchResponse{Results: results, Count: len(results)})
}

// ReverseGeocode converts coordinates to address
// @Summary Reverse geocode
// @Tags Location
// @Produce json
// @Param lat query number true "Latitude"
// @Param lng query number true "Longitude"
// @Success 200 {object} LocationResponse
// @Router /api/geocode/reverse [get]
func (h *Handler) ReverseGeocode(c *gin.Context) {
	var req ReverseGeocodeRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	location, err := h.service.ReverseGeocode(req.Lat, req.Lng)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, LocationResponse{Location: location})
}

// CalculateRoute calculates route between two points
// @Summary Calculate route
// @Tags Location
// @Produce json
// @Param from_lat query number true "Start latitude"
// @Param from_lng query number true "Start longitude"
// @Param to_lat query number true "End latitude"
// @Param to_lng query number true "End longitude"
// @Success 200 {object} RouteResponse
// @Router /api/route [get]
func (h *Handler) CalculateRoute(c *gin.Context) {
	var req RouteRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	route, err := h.service.CalculateRoute(req.FromLat, req.FromLng, req.ToLat, req.ToLng)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, RouteResponse{Route: route})
}

// UpdateLocation updates user's live location
// @Summary Update live location
// @Tags Location
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body UpdateLocationRequest true "Location data"
// @Success 200 {object} object{message=string}
// @Router /api/location/update [post]
func (h *Handler) UpdateLocation(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req UpdateLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdateLocation(userID, &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Location updated"})
}

// GetLiveLocation gets current live location for a ride
// @Summary Get live location
// @Tags Location
// @Security BearerAuth
// @Produce json
// @Param rideId path string true "Ride ID"
// @Success 200 {object} UserLocation
// @Router /api/location/live/{rideId} [get]
func (h *Handler) GetLiveLocation(c *gin.Context) {
	rideID := c.Param("rideId")

	location, exists := h.service.GetLiveLocation(rideID)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "No live location found"})
		return
	}

	c.JSON(http.StatusOK, location)
}

// HandleWebSocket handles WebSocket connections for real-time location
func (h *Handler) HandleWebSocket(c *gin.Context) {
	rideID := c.Param("rideId")
	userID := c.Query("userId")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId required"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
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
		// Handle location updates via WebSocket
		// Parse and broadcast to ride participants
	})

	// Send current location if available
	if location, exists := h.service.GetLiveLocation(rideID); exists {
		h.service.GetHub().SendToUser(userID, &websocket.Message{
			Type:    "current_location",
			Payload: location,
		})
	}
}
