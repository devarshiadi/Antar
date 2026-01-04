package auth

import (
	"time"
)

// User represents a user in the system
type User struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	PhoneNumber string    `json:"phone_number"`
	Password    string    `json:"-"` // Never serialize password
	ActiveRole  string    `json:"active_role"`  // current active mode: rider, passenger
	IsVerified  bool      `json:"is_verified"`
	Rating      float64   `json:"rating"`
	TotalRides  int       `json:"total_rides"`
	IsBusy      bool      `json:"is_busy"` // true if user has active booking
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// OTPRecord stores OTP for verification
type OTPRecord struct {
	ID          string    `json:"id"`
	PhoneNumber string    `json:"phone_number"`
	Code        string    `json:"-"`
	ExpiresAt   time.Time `json:"expires_at"`
	Used        bool      `json:"used"`
	CreatedAt   time.Time `json:"created_at"`
}

// RegisterRequest represents registration payload
type RegisterRequest struct {
	Name        string `json:"name" binding:"required,min=2,max=100"`
	PhoneNumber string `json:"phone_number" binding:"required"`
	Password    string `json:"password" binding:"required,min=6"`
}

// LoginRequest represents login payload
type LoginRequest struct {
	PhoneNumber string `json:"phone_number" binding:"required"`
	Password    string `json:"password" binding:"required"`
}

// VerifyOTPRequest represents OTP verification payload
type VerifyOTPRequest struct {
	PhoneNumber string `json:"phone_number" binding:"required"`
	OTPCode     string `json:"otp_code" binding:"required,len=6"`
}

// UpdateProfileRequest represents profile update payload
type UpdateProfileRequest struct {
	Name string `json:"name,omitempty"`
}

// SwitchRoleRequest represents role switch payload
type SwitchRoleRequest struct {
	Role string `json:"role" binding:"required,oneof=rider passenger"`
}

// AuthResponse represents authentication response
type AuthResponse struct {
	AccessToken string `json:"access_token"`
	User        *User  `json:"user"`
	Message     string `json:"message,omitempty"`
}

// UserResponse represents user data response
type UserResponse struct {
	User    *User  `json:"user"`
	Message string `json:"message,omitempty"`
}
