package auth

import (
	"errors"
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/antar/backend/pkg/jwt"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserNotVerified    = errors.New("user not verified")
	ErrCannotSwitchRole   = errors.New("cannot switch role while having an active booking")
)

// Service handles auth business logic
type Service struct {
	repo       *Repository
	jwtManager *jwt.Manager
}

// NewService creates a new auth service
func NewService(repo *Repository, jwtManager *jwt.Manager) *Service {
	return &Service{
		repo:       repo,
		jwtManager: jwtManager,
	}
}

// Register creates a new user account
func (s *Service) Register(req *RegisterRequest) (*AuthResponse, error) {
	// Check if user exists
	existing, _ := s.repo.GetUserByPhone(req.PhoneNumber)
	if existing != nil {
		return nil, ErrUserExists
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := &User{
		Name:        req.Name,
		PhoneNumber: req.PhoneNumber,
		Password:    string(hashedPassword),
		ActiveRole:  "passenger", // Default role
		IsVerified:  false,
		Rating:      5.0,
	}

	if err := s.repo.CreateUser(user); err != nil {
		return nil, err
	}

	// Generate OTP
	otp := s.generateOTP()
	expiresAt := time.Now().Add(10 * time.Minute)
	if _, err := s.repo.CreateOTP(req.PhoneNumber, otp, expiresAt); err != nil {
		return nil, fmt.Errorf("failed to create OTP: %w", err)
	}

	// In demo mode, print OTP to console
	log.Printf("📱 OTP for %s: %s (expires in 10 minutes)", req.PhoneNumber, otp)

	// Generate token (limited access until verified)
	token, err := s.jwtManager.Generate(user.ID, user.PhoneNumber, user.ActiveRole)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &AuthResponse{
		AccessToken: token,
		User:        user,
		Message:     "Registration successful. Please verify your phone number.",
	}, nil
}

// Login authenticates a user
func (s *Service) Login(req *LoginRequest) (*AuthResponse, error) {
	user, err := s.repo.GetUserByPhone(req.PhoneNumber)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	// Generate token
	token, err := s.jwtManager.Generate(user.ID, user.PhoneNumber, user.ActiveRole)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &AuthResponse{
		AccessToken: token,
		User:        user,
		Message:     "Login successful",
	}, nil
}

// VerifyOTP verifies phone number with OTP
func (s *Service) VerifyOTP(req *VerifyOTPRequest) (*AuthResponse, error) {
	// In demo mode, accept "123456" as valid OTP
	if req.OTPCode == "123456" {
		// Demo mode - mark user as verified
		user, err := s.repo.GetUserByPhone(req.PhoneNumber)
		if err != nil {
			return nil, err
		}
		user.IsVerified = true
		if err := s.repo.UpdateUser(user); err != nil {
			return nil, err
		}

		token, err := s.jwtManager.Generate(user.ID, user.PhoneNumber, user.ActiveRole)
		if err != nil {
			return nil, err
		}

		return &AuthResponse{
			AccessToken: token,
			User:        user,
			Message:     "Phone verified successfully",
		}, nil
	}

	// Normal OTP verification
	if err := s.repo.VerifyOTP(req.PhoneNumber, req.OTPCode); err != nil {
		return nil, err
	}

	user, err := s.repo.GetUserByPhone(req.PhoneNumber)
	if err != nil {
		return nil, err
	}

	token, err := s.jwtManager.Generate(user.ID, user.PhoneNumber, user.ActiveRole)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		AccessToken: token,
		User:        user,
		Message:     "Phone verified successfully",
	}, nil
}

// GetProfile returns user profile
func (s *Service) GetProfile(userID string) (*User, error) {
	return s.repo.GetUserByID(userID)
}

// UpdateProfile updates user profile
func (s *Service) UpdateProfile(userID string, req *UpdateProfileRequest) (*User, error) {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	if req.Name != "" {
		user.Name = req.Name
	}

	if err := s.repo.UpdateUser(user); err != nil {
		return nil, err
	}

	return user, nil
}

// SwitchRole switches user's active role (rider/passenger)
// Only allowed if user doesn't have an active booking
func (s *Service) SwitchRole(userID string, req *SwitchRoleRequest) (*User, error) {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	// Check if user is busy with an active ride/request
	if user.IsBusy {
		return nil, ErrCannotSwitchRole
	}

	// Update role
	if err := s.repo.SwitchUserRole(userID, req.Role); err != nil {
		return nil, err
	}

	// Get updated user
	return s.repo.GetUserByID(userID)
}

// SetUserBusy sets user's busy status (called by matchmaking service)
func (s *Service) SetUserBusy(userID string, isBusy bool) error {
	return s.repo.SetUserBusy(userID, isBusy)
}

// ResendOTP generates and sends a new OTP
func (s *Service) ResendOTP(phoneNumber string) error {
	user, err := s.repo.GetUserByPhone(phoneNumber)
	if err != nil {
		return err
	}

	if user.IsVerified {
		return errors.New("user already verified")
	}

	otp := s.generateOTP()
	expiresAt := time.Now().Add(10 * time.Minute)
	if _, err := s.repo.CreateOTP(phoneNumber, otp, expiresAt); err != nil {
		return err
	}

	log.Printf("📱 New OTP for %s: %s (expires in 10 minutes)", phoneNumber, otp)
	return nil
}

func (s *Service) generateOTP() string {
	return fmt.Sprintf("%06d", rand.Intn(1000000))
}
