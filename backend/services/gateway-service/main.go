package main

import (
	"context"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
)

// ==================== CONFIGURATION ====================

type Config struct {
	Port                  string
	Environment           string
	AuthServiceURL        string
	MatchmakingServiceURL string
	ChatServiceURL        string
	LocationServiceURL    string
}

func LoadConfig() *Config {
	return &Config{
		Port:                  getEnv("PORT", "7860"),
		Environment:           getEnv("ENVIRONMENT", "development"),
		AuthServiceURL:        getEnv("AUTH_SERVICE_URL", "http://localhost:8001"),
		MatchmakingServiceURL: getEnv("MATCHMAKING_SERVICE_URL", "http://localhost:8002"),
		ChatServiceURL:        getEnv("CHAT_SERVICE_URL", "http://localhost:8003"),
		LocationServiceURL:    getEnv("LOCATION_SERVICE_URL", "http://localhost:8004"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// ==================== MIDDLEWARE ====================

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Requested-With")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// ==================== PROXY HELPERS ====================

func createReverseProxy(target *url.URL) *httputil.ReverseProxy {
	proxy := httputil.NewSingleHostReverseProxy(target)
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		req.Header.Set("X-Forwarded-Host", req.Header.Get("Host"))
		req.Header.Set("X-Forwarded-Proto", "https")
		req.Host = target.Host
	}
	proxy.ModifyResponse = func(resp *http.Response) error {
		return nil
	}
	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		log.Printf("Proxy error: %v", err)
		w.WriteHeader(http.StatusBadGateway)
		w.Write([]byte(`{"error":"Service unavailable"}`))
	}
	return proxy
}

func proxyHandler(proxy *httputil.ReverseProxy) gin.HandlerFunc {
	return func(c *gin.Context) {
		proxy.ServeHTTP(c.Writer, c.Request)
	}
}

func wsProxyHandler(target *url.URL) gin.HandlerFunc {
	return func(c *gin.Context) {
		targetScheme := "wss"
		if strings.HasPrefix(target.Scheme, "http://") || target.Scheme == "http" {
			targetScheme = "ws"
		}

		wsURL := url.URL{
			Scheme:   targetScheme,
			Host:     target.Host,
			Path:     c.Request.URL.Path,
			RawQuery: c.Request.URL.RawQuery,
		}

		log.Printf("Redirecting WS to: %s", wsURL.String())
		c.Redirect(http.StatusTemporaryRedirect, wsURL.String())
	}
}

// ==================== MAIN ====================

func main() {
	cfg := LoadConfig()

	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(CORSMiddleware())

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
				"auth":     "/api/auth/*",
				"users":    "/api/users/*",
				"rides":    "/api/rides/*",
				"matches":  "/api/matches/*",
				"chat":     "/api/chat/*",
				"location": "/api/location/*",
				"geocode":  "/api/geocode/*",
				"route":    "/api/route/*",
				"health":   "/health",
			},
		})
	})

	// Parse service URLs
	authURL, _ := url.Parse(cfg.AuthServiceURL)
	matchmakingURL, _ := url.Parse(cfg.MatchmakingServiceURL)
	chatURL, _ := url.Parse(cfg.ChatServiceURL)
	locationURL, _ := url.Parse(cfg.LocationServiceURL)

	log.Printf("🔌 Configuring proxies:")
	log.Printf("   Auth:        %s", cfg.AuthServiceURL)
	log.Printf("   Matchmaking: %s", cfg.MatchmakingServiceURL)
	log.Printf("   Chat:        %s", cfg.ChatServiceURL)
	log.Printf("   Location:    %s", cfg.LocationServiceURL)

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

	// WebSocket redirects
	router.GET("/ws/rides", wsProxyHandler(matchmakingURL))
	router.GET("/ws/chat", wsProxyHandler(chatURL))
	router.GET("/ws/location/:rideId", wsProxyHandler(locationURL))

	// Create server
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	go func() {
		log.Printf("🚀 API Gateway starting on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

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