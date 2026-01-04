package main

import (
	"context"
	"io"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/antar/backend/pkg/config"
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

	// Setup router
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.CORS())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "gateway",
			"time":    time.Now().Format(time.RFC3339),
		})
	})

	// API Documentation
	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service": "Antar API Gateway",
			"version": "1.0.0",
			"endpoints": map[string]string{
				"auth":        "/api/auth/*",
				"users":       "/api/users/*",
				"rides":       "/api/rides/*",
				"matches":     "/api/matches/*",
				"chat":        "/api/chat/*",
				"location":    "/api/location/*",
				"geocode":     "/api/geocode/*",
				"route":       "/api/route/*",
				"health":      "/health",
			},
		})
	})

	// Proxy configuration
	authURL, _ := url.Parse(cfg.AuthServiceURL)
	matchmakingURL, _ := url.Parse(cfg.MatchmakingServiceURL)
	chatURL, _ := url.Parse(cfg.ChatServiceURL)
	locationURL, _ := url.Parse(cfg.LocationServiceURL)

	// Auth service routes
	authProxy := createReverseProxy(authURL)
	router.Any("/api/auth/*path", proxyHandler(authProxy))
	router.Any("/api/users/*path", proxyHandler(authProxy))

	// Matchmaking service routes
	matchmakingProxy := createReverseProxy(matchmakingURL)
	router.Any("/api/rides/*path", proxyHandler(matchmakingProxy))
	router.Any("/api/matches/*path", proxyHandler(matchmakingProxy))
	router.Any("/api/requests/*path", proxyHandler(matchmakingProxy))

	// Chat service routes
	chatProxy := createReverseProxy(chatURL)
	router.Any("/api/chat/*path", proxyHandler(chatProxy))

	// Location service routes
	locationProxy := createReverseProxy(locationURL)
	router.Any("/api/geocode/*path", proxyHandler(locationProxy))
	router.Any("/api/route/*path", proxyHandler(locationProxy))
	router.Any("/api/location/*path", proxyHandler(locationProxy))

	// WebSocket proxies
	router.GET("/ws/rides", wsProxyHandler(matchmakingURL))
	router.GET("/ws/chat", wsProxyHandler(chatURL))
	router.GET("/ws/location/:rideId", wsProxyHandler(locationURL))

	// Create server
	port := cfg.Port
	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Printf("🚀 API Gateway starting on port %s", port)
		log.Printf("   Auth service:        %s", cfg.AuthServiceURL)
		log.Printf("   Matchmaking service: %s", cfg.MatchmakingServiceURL)
		log.Printf("   Chat service:        %s", cfg.ChatServiceURL)
		log.Printf("   Location service:    %s", cfg.LocationServiceURL)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down API gateway...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("API Gateway stopped")
}

func createReverseProxy(target *url.URL) *httputil.ReverseProxy {
	return httputil.NewSingleHostReverseProxy(target)
}

func proxyHandler(proxy *httputil.ReverseProxy) gin.HandlerFunc {
	return func(c *gin.Context) {
		proxy.ServeHTTP(c.Writer, c.Request)
	}
}

func wsProxyHandler(target *url.URL) gin.HandlerFunc {
	return func(c *gin.Context) {
		// For WebSocket, we need to upgrade and proxy
		// This is a simplified version - in production use a proper WS proxy
		wsURL := "ws" + target.String()[4:] + c.Request.URL.Path
		if c.Request.URL.RawQuery != "" {
			wsURL += "?" + c.Request.URL.RawQuery
		}

		// Redirect to the actual WebSocket endpoint
		c.Redirect(http.StatusTemporaryRedirect, wsURL)
	}
}
