package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
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
	Port         string
	Environment  string
	JWTSecret    string
	DatabasePath string
}

func LoadConfig() *Config {
	return &Config{
		Port:         getEnv("PORT", "7860"),
		Environment:  getEnv("ENVIRONMENT", "development"),
		JWTSecret:    getEnv("JWT_SECRET", "antar-super-secret-key"),
		DatabasePath: getEnv("DATABASE_PATH", "./data"),
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
	os.MkdirAll(dataPath, 0755)
	dbPath := filepath.Join(dataPath, "chat.db")
	db, err := sql.Open("sqlite3", dbPath+"?_foreign_keys=on&_journal_mode=WAL")
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(25)
	return &DB{db}, nil
}

func (db *DB) Migrate() error {
	schema := `
	CREATE TABLE IF NOT EXISTS threads (
		id TEXT PRIMARY KEY,
		ride_id TEXT NOT NULL,
		participants TEXT NOT NULL,
		last_message TEXT DEFAULT '',
		last_sender_id TEXT DEFAULT '',
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS messages (
		id TEXT PRIMARY KEY,
		thread_id TEXT NOT NULL,
		sender_id TEXT NOT NULL,
		content TEXT NOT NULL,
		type TEXT DEFAULT 'text',
		is_read INTEGER DEFAULT 0,
		timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_threads_ride ON threads(ride_id);
	CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
	`
	_, err := db.Exec(schema)
	return err
}

// ==================== MODELS ====================

type Thread struct {
	ID           string    `json:"id"`
	RideID       string    `json:"ride_id"`
	Participants []string  `json:"participants"`
	LastMessage  string    `json:"last_message"`
	LastSenderID string    `json:"last_sender_id"`
	UnreadCount  int       `json:"unread_count"`
	UpdatedAt    time.Time `json:"updated_at"`
	CreatedAt    time.Time `json:"created_at"`
}

type Message struct {
	ID        string    `json:"id"`
	ThreadID  string    `json:"thread_id"`
	SenderID  string    `json:"sender_id"`
	Content   string    `json:"content"`
	Type      string    `json:"type"`
	IsRead    bool      `json:"is_read"`
	Timestamp time.Time `json:"timestamp"`
}

type SendMessageRequest struct {
	Content string `json:"content" binding:"required"`
	Type    string `json:"type"`
}

type CreateThreadRequest struct {
	RideID       string   `json:"ride_id" binding:"required"`
	Participants []string `json:"participants" binding:"required"`
}

// ==================== WEBSOCKET HUB ====================

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type WSClient struct {
	ID       string
	UserID   string
	ThreadID string
	Conn     *websocket.Conn
	Send     chan []byte
	Hub      *WSHub
}

type WSHub struct {
	clients    map[string]map[*WSClient]bool // userID -> clients
	threads    map[string]map[string]bool   // threadID -> userIDs
	register   chan *WSClient
	unregister chan *WSClient
	broadcast  chan *WSMessage
	mutex      sync.RWMutex
}

type WSMessage struct {
	Type     string      `json:"type"`
	ThreadID string      `json:"thread_id"`
	Payload  interface{} `json:"payload"`
}

func NewWSHub() *WSHub {
	return &WSHub{
		clients:    make(map[string]map[*WSClient]bool),
		threads:    make(map[string]map[string]bool),
		register:   make(chan *WSClient),
		unregister: make(chan *WSClient),
		broadcast:  make(chan *WSMessage, 256),
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
			if client.ThreadID != "" {
				if h.threads[client.ThreadID] == nil {
					h.threads[client.ThreadID] = make(map[string]bool)
				}
				h.threads[client.ThreadID][client.UserID] = true
			}
			h.mutex.Unlock()

		case client := <-h.unregister:
			h.mutex.Lock()
			if clients, ok := h.clients[client.UserID]; ok {
				delete(clients, client)
				close(client.Send)
			}
			h.mutex.Unlock()

		case msg := <-h.broadcast:
			h.mutex.RLock()
			if users, ok := h.threads[msg.ThreadID]; ok {
				data, _ := json.Marshal(msg)
				for userID := range users {
					if clients, ok := h.clients[userID]; ok {
						for client := range clients {
							select {
							case client.Send <- data:
							default:
							}
						}
					}
				}
			}
			h.mutex.RUnlock()
		}
	}
}

func (h *WSHub) SendToThread(threadID string, msg *WSMessage) {
	msg.ThreadID = threadID
	h.broadcast <- msg
}

func (h *WSHub) Subscribe(userID, threadID string) {
	h.mutex.Lock()
	if h.threads[threadID] == nil {
		h.threads[threadID] = make(map[string]bool)
	}
	h.threads[threadID][userID] = true
	h.mutex.Unlock()
}

// ==================== REPOSITORY ====================

var (
	ErrThreadNotFound = errors.New("thread not found")
	ErrNotParticipant = errors.New("not a participant")
)

type Repository struct {
	db *DB
}

func NewRepository(db *DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateThread(thread *Thread) error {
	thread.ID = uuid.New().String()
	thread.CreatedAt = time.Now()
	thread.UpdatedAt = time.Now()

	participants, _ := json.Marshal(thread.Participants)

	_, err := r.db.Exec(`
		INSERT INTO threads (id, ride_id, participants, last_message, last_sender_id, updated_at, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, thread.ID, thread.RideID, string(participants), thread.LastMessage, thread.LastSenderID, thread.UpdatedAt, thread.CreatedAt)
	return err
}

func (r *Repository) GetThreadByID(id string) (*Thread, error) {
	thread := &Thread{}
	var participants string
	err := r.db.QueryRow(`
		SELECT id, ride_id, participants, last_message, last_sender_id, updated_at, created_at
		FROM threads WHERE id = ?
	`, id).Scan(&thread.ID, &thread.RideID, &participants, &thread.LastMessage, &thread.LastSenderID, &thread.UpdatedAt, &thread.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrThreadNotFound
	}
	json.Unmarshal([]byte(participants), &thread.Participants)
	return thread, err
}

func (r *Repository) GetThreadByRideID(rideID string) (*Thread, error) {
	thread := &Thread{}
	var participants string
	err := r.db.QueryRow(`
		SELECT id, ride_id, participants, last_message, last_sender_id, updated_at, created_at
		FROM threads WHERE ride_id = ?
	`, rideID).Scan(&thread.ID, &thread.RideID, &participants, &thread.LastMessage, &thread.LastSenderID, &thread.UpdatedAt, &thread.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrThreadNotFound
	}
	json.Unmarshal([]byte(participants), &thread.Participants)
	return thread, err
}

func (r *Repository) GetThreadsForUser(userID string) ([]*Thread, error) {
	rows, err := r.db.Query(`
		SELECT id, ride_id, participants, last_message, last_sender_id, updated_at, created_at
		FROM threads WHERE participants LIKE ? ORDER BY updated_at DESC
	`, "%"+userID+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var threads []*Thread
	for rows.Next() {
		thread := &Thread{}
		var participants string
		rows.Scan(&thread.ID, &thread.RideID, &participants, &thread.LastMessage, &thread.LastSenderID, &thread.UpdatedAt, &thread.CreatedAt)
		json.Unmarshal([]byte(participants), &thread.Participants)
		thread.UnreadCount = r.getUnreadCount(thread.ID, userID)
		threads = append(threads, thread)
	}
	return threads, nil
}

func (r *Repository) UpdateThread(thread *Thread) error {
	thread.UpdatedAt = time.Now()
	_, err := r.db.Exec(`
		UPDATE threads SET last_message = ?, last_sender_id = ?, updated_at = ? WHERE id = ?
	`, thread.LastMessage, thread.LastSenderID, thread.UpdatedAt, thread.ID)
	return err
}

func (r *Repository) GetOrCreateThread(rideID string, participants []string) (*Thread, error) {
	thread, err := r.GetThreadByRideID(rideID)
	if err == nil {
		return thread, nil
	}

	thread = &Thread{RideID: rideID, Participants: participants}
	return thread, r.CreateThread(thread)
}

func (r *Repository) IsParticipant(threadID, userID string) bool {
	thread, err := r.GetThreadByID(threadID)
	if err != nil {
		return false
	}
	for _, p := range thread.Participants {
		if p == userID {
			return true
		}
	}
	return false
}

func (r *Repository) CreateMessage(msg *Message) error {
	msg.ID = uuid.New().String()
	msg.Timestamp = time.Now()
	if msg.Type == "" {
		msg.Type = "text"
	}

	_, err := r.db.Exec(`
		INSERT INTO messages (id, thread_id, sender_id, content, type, is_read, timestamp)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, msg.ID, msg.ThreadID, msg.SenderID, msg.Content, msg.Type, msg.IsRead, msg.Timestamp)
	return err
}

func (r *Repository) GetMessagesForThread(threadID string, limit, offset int) ([]*Message, error) {
	if limit <= 0 {
		limit = 50
	}

	rows, err := r.db.Query(`
		SELECT id, thread_id, sender_id, content, type, is_read, timestamp
		FROM messages WHERE thread_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?
	`, threadID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []*Message
	for rows.Next() {
		msg := &Message{}
		rows.Scan(&msg.ID, &msg.ThreadID, &msg.SenderID, &msg.Content, &msg.Type, &msg.IsRead, &msg.Timestamp)
		messages = append(messages, msg)
	}

	// Reverse order
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}
	return messages, nil
}

func (r *Repository) MarkAsRead(threadID, userID string) error {
	_, err := r.db.Exec(`
		UPDATE messages SET is_read = 1 WHERE thread_id = ? AND sender_id != ? AND is_read = 0
	`, threadID, userID)
	return err
}

func (r *Repository) getUnreadCount(threadID, userID string) int {
	var count int
	r.db.QueryRow(`
		SELECT COUNT(*) FROM messages WHERE thread_id = ? AND sender_id != ? AND is_read = 0
	`, threadID, userID).Scan(&count)
	return count
}

// ==================== SERVICE ====================

type Service struct {
	repo *Repository
	hub  *WSHub
}

func NewService(repo *Repository, hub *WSHub) *Service {
	return &Service{repo: repo, hub: hub}
}

func (s *Service) SendMessage(userID, threadID string, req *SendMessageRequest) (*Message, error) {
	if !s.repo.IsParticipant(threadID, userID) {
		return nil, ErrNotParticipant
	}

	thread, err := s.repo.GetThreadByID(threadID)
	if err != nil {
		return nil, err
	}

	msg := &Message{
		ThreadID: threadID,
		SenderID: userID,
		Content:  req.Content,
		Type:     req.Type,
	}

	if err := s.repo.CreateMessage(msg); err != nil {
		return nil, err
	}

	thread.LastMessage = msg.Content
	thread.LastSenderID = userID
	s.repo.UpdateThread(thread)

	// Broadcast via WebSocket
	s.hub.SendToThread(threadID, &WSMessage{
		Type:    "message",
		Payload: msg,
	})

	return msg, nil
}

func (s *Service) SendTyping(userID, threadID string, isTyping bool) {
	s.hub.SendToThread(threadID, &WSMessage{
		Type: "typing",
		Payload: map[string]interface{}{
			"user_id":   userID,
			"is_typing": isTyping,
		},
	})
}

// ==================== MIDDLEWARE ====================

type Claims struct {
	UserID      string `json:"user_id"`
	PhoneNumber string `json:"phone_number"`
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
	service *Service
	repo    *Repository
	hub     *WSHub
}

func NewHandler(service *Service, repo *Repository, hub *WSHub) *Handler {
	return &Handler{service: service, repo: repo, hub: hub}
}

func (h *Handler) GetThreads(c *gin.Context) {
	userID := c.GetString("user_id")
	threads, _ := h.repo.GetThreadsForUser(userID)
	c.JSON(http.StatusOK, gin.H{"threads": threads, "count": len(threads)})
}

func (h *Handler) CreateThread(c *gin.Context) {
	var req CreateThreadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	thread, err := h.repo.GetOrCreateThread(req.RideID, req.Participants)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"thread": thread})
}

func (h *Handler) GetThread(c *gin.Context) {
	userID := c.GetString("user_id")
	threadID := c.Param("threadId")

	if !h.repo.IsParticipant(threadID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "not a participant"})
		return
	}

	thread, err := h.repo.GetThreadByID(threadID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"thread": thread})
}

func (h *Handler) GetThreadByRide(c *gin.Context) {
	userID := c.GetString("user_id")
	rideID := c.Param("rideId")

	thread, err := h.repo.GetThreadByRideID(rideID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	if !h.repo.IsParticipant(thread.ID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "not a participant"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"thread": thread})
}

func (h *Handler) GetMessages(c *gin.Context) {
	userID := c.GetString("user_id")
	threadID := c.Param("threadId")

	if !h.repo.IsParticipant(threadID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "not a participant"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	messages, _ := h.repo.GetMessagesForThread(threadID, limit, offset)
	c.JSON(http.StatusOK, gin.H{"messages": messages, "count": len(messages)})
}

func (h *Handler) SendMessage(c *gin.Context) {
	userID := c.GetString("user_id")
	threadID := c.Param("threadId")

	var req SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	msg, err := h.service.SendMessage(userID, threadID, &req)
	if err != nil {
		status := http.StatusInternalServerError
		if err == ErrNotParticipant {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": msg})
}

func (h *Handler) MarkAsRead(c *gin.Context) {
	userID := c.GetString("user_id")
	threadID := c.Param("threadId")

	h.repo.MarkAsRead(threadID, userID)
	h.hub.SendToThread(threadID, &WSMessage{
		Type:    "read",
		Payload: map[string]string{"user_id": userID},
	})

	c.JSON(http.StatusOK, gin.H{"message": "Marked as read"})
}

func (h *Handler) SendTyping(c *gin.Context) {
	userID := c.GetString("user_id")
	threadID := c.Param("threadId")

	var req struct {
		IsTyping bool `json:"is_typing"`
	}
	c.ShouldBindJSON(&req)

	h.service.SendTyping(userID, threadID, req.IsTyping)
	c.JSON(http.StatusOK, gin.H{"message": "Typing indicator sent"})
}

func (h *Handler) HandleWebSocket(c *gin.Context) {
	userID := c.Query("userId")
	threadID := c.Query("threadId")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId required"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	client := &WSClient{
		ID:       uuid.New().String(),
		UserID:   userID,
		ThreadID: threadID,
		Conn:     conn,
		Send:     make(chan []byte, 256),
		Hub:      h.hub,
	}

	h.hub.register <- client

	if threadID != "" {
		h.hub.Subscribe(userID, threadID)
	}

	// Read pump
	go func() {
		defer func() { h.hub.unregister <- client; conn.Close() }()
		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				break
			}
			// Handle incoming messages
			var wsMsg WSMessage
			if json.Unmarshal(msg, &wsMsg) == nil {
				switch wsMsg.Type {
				case "subscribe":
					if tid, ok := wsMsg.Payload.(string); ok {
						h.hub.Subscribe(userID, tid)
					}
				case "typing":
					if payload, ok := wsMsg.Payload.(map[string]interface{}); ok {
						isTyping, _ := payload["is_typing"].(bool)
						h.service.SendTyping(userID, wsMsg.ThreadID, isTyping)
					}
				}
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

	db, err := NewDB(cfg.DatabasePath)
	if err != nil {
		log.Fatalf("Database error: %v", err)
	}
	defer db.Close()
	db.Migrate()

	hub := NewWSHub()
	go hub.Run()

	repo := NewRepository(db)
	service := NewService(repo, hub)
	handler := NewHandler(service, repo, hub)

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(CORSMiddleware())

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy", "service": "antar-chat"})
	})

	chat := router.Group("/api/chat")
	chat.Use(AuthMiddleware(cfg.JWTSecret))
	{
		chat.GET("/threads", handler.GetThreads)
		chat.POST("/threads", handler.CreateThread)
		chat.GET("/threads/:threadId", handler.GetThread)
		chat.GET("/threads/:threadId/messages", handler.GetMessages)
		chat.POST("/threads/:threadId/messages", handler.SendMessage)
		chat.PUT("/threads/:threadId/read", handler.MarkAsRead)
		chat.POST("/threads/:threadId/typing", handler.SendTyping)
		chat.GET("/ride/:rideId", handler.GetThreadByRide)
	}

	router.GET("/ws/chat", handler.HandleWebSocket)

	srv := &http.Server{Addr: ":" + cfg.Port, Handler: router}

	go func() {
		log.Printf("💬 Chat service starting on port %s", cfg.Port)
		srv.ListenAndServe()
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}
