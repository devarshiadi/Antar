package config

import (
	"os"
	"strconv"
)

// Config holds application configuration
type Config struct {
	// Server
	Port        string
	Environment string

	// JWT
	JWTSecret     string
	JWTExpiry     int // hours

	// Database
	DatabasePath string

	// Service URLs (for inter-service communication)
	AuthServiceURL        string
	MatchmakingServiceURL string
	ChatServiceURL        string
	LocationServiceURL    string

	// External APIs
	NominatimURL string
	OSRMURL      string
}

// Load returns configuration from environment variables with defaults
func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8000"),
		Environment: getEnv("ENVIRONMENT", "development"),

		JWTSecret: getEnv("JWT_SECRET", "antar-super-secret-key-change-in-production"),
		JWTExpiry: getEnvInt("JWT_EXPIRY_HOURS", 72),

		DatabasePath: getEnv("DATABASE_PATH", "./data"),

		AuthServiceURL:        getEnv("AUTH_SERVICE_URL", "http://localhost:8001"),
		MatchmakingServiceURL: getEnv("MATCHMAKING_SERVICE_URL", "http://localhost:8002"),
		ChatServiceURL:        getEnv("CHAT_SERVICE_URL", "http://localhost:8003"),
		LocationServiceURL:    getEnv("LOCATION_SERVICE_URL", "http://localhost:8004"),

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

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}
