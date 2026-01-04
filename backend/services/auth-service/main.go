package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

// ==================== CONFIGURATION ====================

type Config struct {
	Port         string
	Environment  string
	JWTSecret    string
	JWTExpiry    int
	DatabasePath string
}

func LoadConfig() *Config {
	return &Config{
		Port:         getEnv("PORT", "7860"),
		Environment:  getEnv("ENVIRONMENT", "development"),
		JWTSecret:    getEnv("JWT_SECRET", "antar-super-secret-key-change-in-production"),
		JWTExpiry:    getEnvInt("JWT_EXPIRY_HOURS", 72),
		DatabasePath: getEnv("DATABASE_PATH", "/tmp/data"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

// ==================== DATABASE ====================

type DB struct {
	*sql.DB
}

func NewDB(dataPath string) (*DB, error) {
	if err := os.MkdirAll(dataPath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data directory: %w", err)
	}

	dbPath := filepath.Join(dataPath, "auth.db")
	db, err := sql.Open("sqlite3", dbPath+"?_foreign_keys=on&_journal_mode=WAL")
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	return &DB{db}, nil
}

func (db *DB) Migrate() error {
	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		phone_number TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL,
		active_role TEXT DEFAULT 'passenger',
		is_verified INTEGER DEFAULT 0,
		rating REAL DEFAULT 5.0,
		total_rides INTEGER DEFAULT 0,
		is_busy INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS otp_records (
		id TEXT PRIMARY KEY,
		phone_number TEXT NOT NULL,
		code TEXT NOT NULL,
		expires_at DATETIME NOT NULL,
		used INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
	CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_records(phone_number);
	`
	_, err := db.Exec(schema)
	return err
}

// ==================== MODELS ====================

type User struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	PhoneNumber string    `json:"phone_number"`
	Password    string    `json:"-"`
	ActiveRole  string    `json:"active_role"`
	IsVerified  bool      `json:"is_verified"`
	Rating      float64   `json:"rating"`
	TotalRides  int       `json:"total_rides"`
	IsBusy      bool      `json:"is_busy"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type RegisterRequest struct {
	Name        string `json:"name" binding:"required,min=2,max=100"`
	PhoneNumber string `json:"phone_number" binding:"required"`
	Password    string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	PhoneNumber string `json:"phone_number" binding:"required"`
	Password    string `json:"password" binding:"required"`
}

type VerifyOTPRequest struct {
	PhoneNumber string `json:"phone_number" binding:"required"`
	OTPCode     string `json:"otp_code" binding:"required,len=6"`
}

type SwitchRoleRequest struct {
	Role string `json:"role" binding:"required,oneof=rider passenger"`
}

type AuthResponse struct {
	AccessToken string `json:"access_token"`
	User        *User  `json:"user"`
	Message     string `json:"message,omitempty"`
}

// ==================== JWT ====================

type Claims struct {
	UserID      string `json:"user_id"`
	PhoneNumber string `json:"phone_number"`
	Role        string `json:"role"`
	jwt.RegisteredClaims
}

type JWTManager struct {
	secretKey []byte
	expiry    time.Duration
}

func NewJWTManager(secretKey string, expiryHours int) *JWTManager {
	return &JWTManager{
		secretKey: []byte(secretKey),
		expiry:    time.Duration(expiryHours) * time.Hour,
	}
}

func (m *JWTManager) Generate(userID, phoneNumber, role string) (string, error) {
	claims := &Claims{
		UserID:      userID,
		PhoneNumber: phoneNumber,
		Role:        role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(m.expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "antar-auth",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.secretKey)
}

func (m *JWTManager) Validate(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid token")
		}
		return m.secretKey, nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

// ==================== REPOSITORY ====================

var (
	ErrUserNotFound   = errors.New("user not found")
	ErrUserExists     = errors.New("user already exists")
	ErrOTPNotFound    = errors.New("OTP not found")
	ErrOTPExpired     = errors.New("OTP has expired")
	ErrCannotSwitch   = errors.New("cannot switch role while having an active booking")
)

type Repository struct {
	db *DB
}

func NewRepository(db *DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateUser(user *User) error {
	user.ID = uuid.New().String()
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	user.Rating = 5.0
	user.ActiveRole = "passenger"

	_, err := r.db.Exec(`
		INSERT INTO users (id, name, phone_number, password, active_role, is_verified, rating, total_rides, is_busy, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, user.ID, user.Name, user.PhoneNumber, user.Password, user.ActiveRole, user.IsVerified, user.Rating, user.TotalRides, user.IsBusy, user.CreatedAt, user.UpdatedAt)

	if err != nil {
		return ErrUserExists
	}
	return nil
}

func (r *Repository) GetUserByPhone(phoneNumber string) (*User, error) {
	user := &User{}
	err := r.db.QueryRow(`
		SELECT id, name, phone_number, password, active_role, is_verified, rating, total_rides, is_busy, created_at, updated_at
		FROM users WHERE phone_number = ?
	`, phoneNumber).Scan(&user.ID, &user.Name, &user.PhoneNumber, &user.Password, &user.ActiveRole, &user.IsVerified, &user.Rating, &user.TotalRides, &user.IsBusy, &user.CreatedAt, &user.UpdatedAt)

	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	return user, err
}

func (r *Repository) GetUserByID(id string) (*User, error) {
	user := &User{}
	err := r.db.QueryRow(`
		SELECT id, name, phone_number, password, active_role, is_verified, rating, total_rides, is_busy, created_at, updated_at
		FROM users WHERE id = ?
	`, id).Scan(&user.ID, &user.Name, &user.PhoneNumber, &user.Password, &user.ActiveRole, &user.IsVerified, &user.Rating, &user.TotalRides, &user.IsBusy, &user.CreatedAt, &user.UpdatedAt)

	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	return user, err
}

func (r *Repository) UpdateUser(user *User) error {
	user.UpdatedAt = time.Now()
	_, err := r.db.Exec(`
		UPDATE users SET name = ?, active_role = ?, is_verified = ?, rating = ?, total_rides = ?, is_busy = ?, updated_at = ?
		WHERE id = ?
	`, user.Name, user.ActiveRole, user.IsVerified, user.Rating, user.TotalRides, user.IsBusy, user.UpdatedAt, user.ID)
	return err
}

func (r *Repository) SwitchUserRole(userID, role string) error {
	var isBusy bool
	err := r.db.QueryRow(`SELECT is_busy FROM users WHERE id = ?`, userID).Scan(&isBusy)
	if err != nil {
		return err
	}
	if isBusy {
		return ErrCannotSwitch
	}

	_, err = r.db.Exec(`UPDATE users SET active_role = ?, updated_at = ? WHERE id = ?`, role, time.Now(), userID)
	return err
}

func (r *Repository) SetUserBusy(userID string, isBusy bool) error {
	_, err := r.db.Exec(`UPDATE users SET is_busy = ?, updated_at = ? WHERE id = ?`, isBusy, time.Now(), userID)
	return err
}

func (r *Repository) CreateOTP(phoneNumber, code string, expiresAt time.Time) error {
	_, err := r.db.Exec(`
		INSERT INTO otp_records (id, phone_number, code, expires_at, used, created_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`, uuid.New().String(), phoneNumber, code, expiresAt, false, time.Now())
	return err
}

func (r *Repository) VerifyOTP(phoneNumber, code string) error {
	var id string
	var expiresAt time.Time
	var used bool

	err := r.db.QueryRow(`
		SELECT id, expires_at, used FROM otp_records
		WHERE phone_number = ? AND code = ?
		ORDER BY created_at DESC LIMIT 1
	`, phoneNumber, code).Scan(&id, &expiresAt, &used)

	if err == sql.ErrNoRows {
		return ErrOTPNotFound
	}
	if err != nil {
		return err
	}
	if used {
		return errors.New("OTP already used")
	}
	if time.Now().After(expiresAt) {
		return ErrOTPExpired
	}

	// Mark as used
	r.db.Exec(`UPDATE otp_records SET used = 1 WHERE id = ?`, id)
	// Mark user as verified
	r.db.Exec(`UPDATE users SET is_verified = 1, updated_at = ? WHERE phone_number = ?`, time.Now(), phoneNumber)

	return nil
}

// ==================== SERVICE ====================

type Service struct {
	repo       *Repository
	jwtManager *JWTManager
}

func NewService(repo *Repository, jwtManager *JWTManager) *Service {
	return &Service{repo: repo, jwtManager: jwtManager}
}

func (s *Service) Register(req *RegisterRequest) (*AuthResponse, error) {
	existing, _ := s.repo.GetUserByPhone(req.PhoneNumber)
	if existing != nil {
		return nil, ErrUserExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &User{
		Name:        req.Name,
		PhoneNumber: req.PhoneNumber,
		Password:    string(hashedPassword),
		ActiveRole:  "passenger",
		IsVerified:  false,
		Rating:      5.0,
	}

	if err := s.repo.CreateUser(user); err != nil {
		return nil, err
	}

	// Generate OTP
	otp := fmt.Sprintf("%06d", rand.Intn(1000000))
	s.repo.CreateOTP(req.PhoneNumber, otp, time.Now().Add(10*time.Minute))
	log.Printf("📱 OTP for %s: %s (expires in 10 minutes)", req.PhoneNumber, otp)

	token, _ := s.jwtManager.Generate(user.ID, user.PhoneNumber, user.ActiveRole)

	return &AuthResponse{
		AccessToken: token,
		User:        user,
		Message:     "Registration successful. Please verify your phone number.",
	}, nil
}

func (s *Service) Login(req *LoginRequest) (*AuthResponse, error) {
	user, err := s.repo.GetUserByPhone(req.PhoneNumber)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	token, _ := s.jwtManager.Generate(user.ID, user.PhoneNumber, user.ActiveRole)

	return &AuthResponse{
		AccessToken: token,
		User:        user,
		Message:     "Login successful",
	}, nil
}

func (s *Service) VerifyOTP(req *VerifyOTPRequest) (*AuthResponse, error) {
	// Demo mode: accept 123456
	if req.OTPCode == "123456" {
		user, err := s.repo.GetUserByPhone(req.PhoneNumber)
		if err != nil {
			return nil, err
		}
		user.IsVerified = true
		s.repo.UpdateUser(user)
		token, _ := s.jwtManager.Generate(user.ID, user.PhoneNumber, user.ActiveRole)
		return &AuthResponse{AccessToken: token, User: user, Message: "Phone verified"}, nil
	}

	if err := s.repo.VerifyOTP(req.PhoneNumber, req.OTPCode); err != nil {
		return nil, err
	}

	user, _ := s.repo.GetUserByPhone(req.PhoneNumber)
	token, _ := s.jwtManager.Generate(user.ID, user.PhoneNumber, user.ActiveRole)

	return &AuthResponse{AccessToken: token, User: user, Message: "Phone verified"}, nil
}

func (s *Service) SwitchRole(userID string, req *SwitchRoleRequest) (*User, error) {
	if err := s.repo.SwitchUserRole(userID, req.Role); err != nil {
		return nil, err
	}
	return s.repo.GetUserByID(userID)
}

// ==================== MIDDLEWARE ====================

func AuthMiddleware(jwtManager *JWTManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		claims, err := jwtManager.Validate(parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("phone_number", claims.PhoneNumber)
		c.Set("role", claims.Role)
		c.Next()
	}
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")

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
}

func NewHandler(service *Service, repo *Repository) *Handler {
	return &Handler{service: service, repo: repo}
}

func (h *Handler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.service.Register(&req)
	if err != nil {
		status := http.StatusInternalServerError
		if err == ErrUserExists {
			status = http.StatusConflict
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, response)
}

func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.service.Login(&req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

func (h *Handler) VerifyOTP(c *gin.Context) {
	var req VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.service.VerifyOTP(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

func (h *Handler) GetProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	user, err := h.repo.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": user})
}

func (h *Handler) UpdateProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	user, err := h.repo.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	var req struct {
		Name string `json:"name"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	h.repo.UpdateUser(user)

	c.JSON(http.StatusOK, gin.H{"user": user, "message": "Profile updated"})
}

func (h *Handler) SwitchRole(c *gin.Context) {
	userID := c.GetString("user_id")

	var req SwitchRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.service.SwitchRole(userID, &req)
	if err != nil {
		status := http.StatusInternalServerError
		if err == ErrCannotSwitch {
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user, "message": "Role switched to " + req.Role})
}

// Internal endpoint for other services to set user busy status
func (h *Handler) SetUserBusy(c *gin.Context) {
	var req struct {
		UserID string `json:"user_id"`
		IsBusy bool   `json:"is_busy"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.SetUserBusy(req.UserID, req.IsBusy); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User busy status updated"})
}

// ==================== MAIN ====================

func main() {
	cfg := LoadConfig()

	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize database
	db, err := NewDB(cfg.DatabasePath)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Migrate(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Initialize components
	jwtManager := NewJWTManager(cfg.JWTSecret, cfg.JWTExpiry)
	repo := NewRepository(db)
	service := NewService(repo, jwtManager)
	handler := NewHandler(service, repo)

	// Setup router
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(CORSMiddleware())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "antar-auth",
			"time":    time.Now().Format(time.RFC3339),
		})
	})

	// Public routes
	auth := router.Group("/api/auth")
	{
		auth.POST("/register", handler.Register)
		auth.POST("/login", handler.Login)
		auth.POST("/verify-otp", handler.VerifyOTP)
	}

	// Protected routes
	users := router.Group("/api/users")
	users.Use(AuthMiddleware(jwtManager))
	{
		users.GET("/me", handler.GetProfile)
		users.PUT("/me", handler.UpdateProfile)
		users.POST("/switch-role", handler.SwitchRole)
	}

	// Internal routes (for other services)
	internal := router.Group("/internal")
	{
		internal.POST("/set-busy", handler.SetUserBusy)
	}

	// Start server
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("🔐 Auth service starting on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down auth service...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Auth service stopped")
}
