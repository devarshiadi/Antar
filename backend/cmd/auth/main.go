package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/antar/backend/internal/auth"
	"github.com/antar/backend/pkg/config"
	"github.com/antar/backend/pkg/database"
	"github.com/antar/backend/pkg/jwt"
	"github.com/antar/backend/pkg/middleware"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Set Gin mode
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize database
	db, err := database.New(cfg.DatabasePath, "auth")
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize repository and run migrations
	repo := auth.NewRepository(db)
	if err := repo.Migrate(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Initialize JWT manager
	jwtManager := jwt.NewManager(cfg.JWTSecret, cfg.JWTExpiry)

	// Initialize service and handler
	service := auth.NewService(repo, jwtManager)
	handler := auth.NewHandler(service)

	// Setup router
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.CORS())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "auth",
			"time":    time.Now().Format(time.RFC3339),
		})
	})

	// Register routes
	authMiddleware := middleware.AuthMiddleware(jwtManager)
	handler.RegisterRoutes(router, authMiddleware)

	// Create server
	port := cfg.Port
	if os.Getenv("AUTH_PORT") != "" {
		port = os.Getenv("AUTH_PORT")
	}
	
	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Printf("🔐 Auth service starting on port %s", port)
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
