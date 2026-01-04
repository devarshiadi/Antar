package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// ==================== CONFIGURATION ====================

type Config struct {
	Port         string
	Environment  string
	JWTSecret    string
	NominatimURL string
	OSRMURL      string
}

func LoadConfig() *Config {
	return &Config{
		Port:         getEnv("PORT", "7860"),
		Environment:  getEnv("ENVIRONMENT", "development"),
		JWTSecret:    getEnv("JWT_SECRET", "antar-super-secret-key"),
		NominatimURL: getEnv("NOMINATIM_URL", "https://nominatim.openstreetmap.org"),
		OSRMURL:      getEnv("OSRM_URL", "https://router.project-osrm.org"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// ==================== MODELS ====================

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

type SearchResult struct {
	PlaceID     string  `json:"place_id"`
	DisplayName string  `json:"display_name"`
	Lat         float64 `json:"lat"`
	Lng         float64 `json:"lng"`
	Type        string  `json:"type"`
	Importance  float64 `json:"importance"`
}

type Route struct {
	Distance   float64   `json:"distance"`
	Duration   float64   `json:"duration"`
	StartPoint Location  `json:"start_point"`
	EndPoint   Location  `json:"end_point"`
	Geometry   *Geometry `json:"geometry,omitempty"`
}

type Geometry struct {
	Type        string      `json:"type"`
	Coordinates [][]float64 `json:"coordinates"`
}

type UserLocation struct {
	UserID    string    `json:"user_id"`
	RideID    string    `json:"ride_id"`
	Lat       float64   `json:"lat"`
	Lng       float64   `json:"lng"`
	Heading   float64   `json:"heading"`
	Speed     float64   `json:"speed"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ==================== GEOCODER ====================

type Geocoder struct {
	nominatimURL string
	osrmURL      string
	httpClient   *http.Client
	rateLimiter  *RateLimiter
}

type RateLimiter struct {
	lastRequest time.Time
	minInterval time.Duration
	mutex       sync.Mutex
}

func NewGeocoder(nominatimURL, osrmURL string) *Geocoder {
	return &Geocoder{
		nominatimURL: nominatimURL,
		osrmURL:      osrmURL,
		httpClient:   &http.Client{Timeout: 10 * time.Second},
		rateLimiter: &RateLimiter{
			minInterval: time.Second, // Nominatim: 1 req/sec
		},
	}
}

func (r *RateLimiter) Wait() {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	elapsed := time.Since(r.lastRequest)
	if elapsed < r.minInterval {
		time.Sleep(r.minInterval - elapsed)
	}
	r.lastRequest = time.Now()
}

func (g *Geocoder) Search(query string, lat, lng float64, limit int) ([]*SearchResult, error) {
	g.rateLimiter.Wait()

	if limit <= 0 || limit > 10 {
		limit = 5
	}

	params := url.Values{}
	params.Set("q", query)
	params.Set("format", "json")
	params.Set("limit", strconv.Itoa(limit))
	params.Set("addressdetails", "1")

	if lat != 0 && lng != 0 {
		delta := 0.5
		params.Set("viewbox", fmt.Sprintf("%f,%f,%f,%f", lng-delta, lat-delta, lng+delta, lat+delta))
		params.Set("bounded", "0")
	}

	req, _ := http.NewRequest("GET", g.nominatimURL+"/search?"+params.Encode(), nil)
	req.Header.Set("User-Agent", "Antar-RideSharing/1.0")

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var nominatimResults []struct {
		PlaceID     int     `json:"place_id"`
		Lat         string  `json:"lat"`
		Lon         string  `json:"lon"`
		DisplayName string  `json:"display_name"`
		Type        string  `json:"type"`
		Importance  float64 `json:"importance"`
	}

	if err := json.Unmarshal(body, &nominatimResults); err != nil {
		return nil, err
	}

	var results []*SearchResult
	for _, r := range nominatimResults {
		lat, _ := strconv.ParseFloat(r.Lat, 64)
		lng, _ := strconv.ParseFloat(r.Lon, 64)
		results = append(results, &SearchResult{
			PlaceID:     strconv.Itoa(r.PlaceID),
			DisplayName: r.DisplayName,
			Lat:         lat,
			Lng:         lng,
			Type:        r.Type,
			Importance:  r.Importance,
		})
	}

	return results, nil
}

func (g *Geocoder) ReverseGeocode(lat, lng float64) (*Location, error) {
	g.rateLimiter.Wait()

	params := url.Values{}
	params.Set("lat", strconv.FormatFloat(lat, 'f', 6, 64))
	params.Set("lon", strconv.FormatFloat(lng, 'f', 6, 64))
	params.Set("format", "json")
	params.Set("addressdetails", "1")

	req, _ := http.NewRequest("GET", g.nominatimURL+"/reverse?"+params.Encode(), nil)
	req.Header.Set("User-Agent", "Antar-RideSharing/1.0")

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var result struct {
		DisplayName string `json:"display_name"`
		Address     struct {
			Road     string `json:"road"`
			City     string `json:"city"`
			Town     string `json:"town"`
			Village  string `json:"village"`
			State    string `json:"state"`
			Country  string `json:"country"`
			PostCode string `json:"postcode"`
		} `json:"address"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	city := result.Address.City
	if city == "" {
		city = result.Address.Town
	}
	if city == "" {
		city = result.Address.Village
	}

	return &Location{
		Lat:         lat,
		Lng:         lng,
		Address:     result.Address.Road,
		DisplayName: result.DisplayName,
		City:        city,
		State:       result.Address.State,
		Country:     result.Address.Country,
		PostalCode:  result.Address.PostCode,
	}, nil
}

func (g *Geocoder) CalculateRoute(fromLat, fromLng, toLat, toLng float64) (*Route, error) {
	reqURL := fmt.Sprintf("%s/route/v1/driving/%f,%f;%f,%f?overview=full&geometries=geojson",
		g.osrmURL, fromLng, fromLat, toLng, toLat)

	resp, err := g.httpClient.Get(reqURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var result struct {
		Code   string `json:"code"`
		Routes []struct {
			Distance float64 `json:"distance"`
			Duration float64 `json:"duration"`
			Geometry struct {
				Type        string      `json:"type"`
				Coordinates [][]float64 `json:"coordinates"`
			} `json:"geometry"`
		} `json:"routes"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	if result.Code != "Ok" || len(result.Routes) == 0 {
		return nil, fmt.Errorf("no route found")
	}

	route := result.Routes[0]
	return &Route{
		Distance:   route.Distance,
		Duration:   route.Duration,
		StartPoint: Location{Lat: fromLat, Lng: fromLng},
		EndPoint:   Location{Lat: toLat, Lng: toLng},
		Geometry:   &Geometry{Type: route.Geometry.Type, Coordinates: route.Geometry.Coordinates},
	}, nil
}

// ==================== WEBSOCKET HUB ====================

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type WSClient struct {
	ID     string
	UserID string
	RideID string
	Conn   *websocket.Conn
	Send   chan []byte
}

type WSHub struct {
	clients   map[string]map[*WSClient]bool // rideID -> clients
	register  chan *WSClient
	unregister chan *WSClient
	broadcast chan *LocationBroadcast
	mutex     sync.RWMutex
}

type LocationBroadcast struct {
	RideID   string
	Location *UserLocation
}

func NewWSHub() *WSHub {
	return &WSHub{
		clients:    make(map[string]map[*WSClient]bool),
		register:   make(chan *WSClient),
		unregister: make(chan *WSClient),
		broadcast:  make(chan *LocationBroadcast, 256),
	}
}

func (h *WSHub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			if h.clients[client.RideID] == nil {
				h.clients[client.RideID] = make(map[*WSClient]bool)
			}
			h.clients[client.RideID][client] = true
			h.mutex.Unlock()

		case client := <-h.unregister:
			h.mutex.Lock()
			if clients, ok := h.clients[client.RideID]; ok {
				delete(clients, client)
				close(client.Send)
			}
			h.mutex.Unlock()

		case msg := <-h.broadcast:
			h.mutex.RLock()
			if clients, ok := h.clients[msg.RideID]; ok {
				data, _ := json.Marshal(map[string]interface{}{
					"type":     "location_update",
					"location": msg.Location,
				})
				for client := range clients {
					select {
					case client.Send <- data:
					default:
					}
				}
			}
			h.mutex.RUnlock()
		}
	}
}

// ==================== SERVICE ====================

type Service struct {
	geocoder      *Geocoder
	hub           *WSHub
	liveLocations map[string]*UserLocation // rideID -> location
	mutex         sync.RWMutex
}

func NewService(geocoder *Geocoder, hub *WSHub) *Service {
	return &Service{
		geocoder:      geocoder,
		hub:           hub,
		liveLocations: make(map[string]*UserLocation),
	}
}

func (s *Service) UpdateLocation(userID string, rideID string, lat, lng, heading, speed float64) error {
	location := &UserLocation{
		UserID:    userID,
		RideID:    rideID,
		Lat:       lat,
		Lng:       lng,
		Heading:   heading,
		Speed:     speed,
		UpdatedAt: time.Now(),
	}

	s.mutex.Lock()
	s.liveLocations[rideID] = location
	s.mutex.Unlock()

	s.hub.broadcast <- &LocationBroadcast{RideID: rideID, Location: location}

	return nil
}

func (s *Service) GetLiveLocation(rideID string) (*UserLocation, bool) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	location, exists := s.liveLocations[rideID]
	return location, exists
}

// ==================== MIDDLEWARE ====================

type Claims struct {
	UserID string `json:"user_id"`
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
	service  *Service
	geocoder *Geocoder
	hub      *WSHub
}

func NewHandler(service *Service, geocoder *Geocoder, hub *WSHub) *Handler {
	return &Handler{service: service, geocoder: geocoder, hub: hub}
}

func (h *Handler) Search(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query required"})
		return
	}

	lat, _ := strconv.ParseFloat(c.Query("lat"), 64)
	lng, _ := strconv.ParseFloat(c.Query("lng"), 64)
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "5"))

	results, err := h.geocoder.Search(query, lat, lng, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"results": results, "count": len(results)})
}

func (h *Handler) ReverseGeocode(c *gin.Context) {
	lat, err := strconv.ParseFloat(c.Query("lat"), 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "lat required"})
		return
	}
	lng, err := strconv.ParseFloat(c.Query("lng"), 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "lng required"})
		return
	}

	location, err := h.geocoder.ReverseGeocode(lat, lng)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"location": location})
}

func (h *Handler) CalculateRoute(c *gin.Context) {
	fromLat, _ := strconv.ParseFloat(c.Query("from_lat"), 64)
	fromLng, _ := strconv.ParseFloat(c.Query("from_lng"), 64)
	toLat, _ := strconv.ParseFloat(c.Query("to_lat"), 64)
	toLng, _ := strconv.ParseFloat(c.Query("to_lng"), 64)

	if fromLat == 0 || fromLng == 0 || toLat == 0 || toLng == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "from_lat, from_lng, to_lat, to_lng required"})
		return
	}

	route, err := h.geocoder.CalculateRoute(fromLat, fromLng, toLat, toLng)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"route": route})
}

func (h *Handler) UpdateLocation(c *gin.Context) {
	userID := c.GetString("user_id")

	var req struct {
		RideID  string  `json:"ride_id" binding:"required"`
		Lat     float64 `json:"lat" binding:"required"`
		Lng     float64 `json:"lng" binding:"required"`
		Heading float64 `json:"heading"`
		Speed   float64 `json:"speed"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.service.UpdateLocation(userID, req.RideID, req.Lat, req.Lng, req.Heading, req.Speed)

	c.JSON(http.StatusOK, gin.H{"message": "Location updated"})
}

func (h *Handler) GetLiveLocation(c *gin.Context) {
	rideID := c.Param("rideId")

	location, exists := h.service.GetLiveLocation(rideID)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "No live location"})
		return
	}

	c.JSON(http.StatusOK, location)
}

func (h *Handler) HandleWebSocket(c *gin.Context) {
	rideID := c.Param("rideId")
	userID := c.Query("userId")

	if userID == "" || rideID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId and rideId required"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	client := &WSClient{
		ID:     uuid.New().String(),
		UserID: userID,
		RideID: rideID,
		Conn:   conn,
		Send:   make(chan []byte, 256),
	}

	h.hub.register <- client

	// Send current location if available
	if location, exists := h.service.GetLiveLocation(rideID); exists {
		data, _ := json.Marshal(map[string]interface{}{
			"type":     "current_location",
			"location": location,
		})
		client.Send <- data
	}

	// Read pump
	go func() {
		defer func() { h.hub.unregister <- client; conn.Close() }()
		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				break
			}
		}
	}()

	// Write pump
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

	geocoder := NewGeocoder(cfg.NominatimURL, cfg.OSRMURL)
	hub := NewWSHub()
	go hub.Run()

	service := NewService(geocoder, hub)
	handler := NewHandler(service, geocoder, hub)

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(CORSMiddleware())

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy", "service": "antar-location"})
	})

	// Public geocoding endpoints
	router.GET("/api/geocode/search", handler.Search)
	router.GET("/api/geocode/reverse", handler.ReverseGeocode)
	router.GET("/api/route", handler.CalculateRoute)

	// Protected location endpoints
	location := router.Group("/api/location")
	location.Use(AuthMiddleware(cfg.JWTSecret))
	{
		location.POST("/update", handler.UpdateLocation)
		location.GET("/live/:rideId", handler.GetLiveLocation)
	}

	router.GET("/ws/location/:rideId", handler.HandleWebSocket)

	srv := &http.Server{Addr: ":" + cfg.Port, Handler: router}

	go func() {
		log.Printf("📍 Location service starting on port %s", cfg.Port)
		srv.ListenAndServe()
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}
