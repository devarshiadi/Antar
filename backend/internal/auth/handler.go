package auth

import (
	"net/http"

	"github.com/antar/backend/pkg/middleware"
	"github.com/gin-gonic/gin"
)

// Handler handles HTTP requests for auth
type Handler struct {
	service *Service
}

// NewHandler creates a new auth handler
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes registers auth routes
func (h *Handler) RegisterRoutes(r *gin.Engine, authMiddleware gin.HandlerFunc) {
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", h.Register)
		auth.POST("/login", h.Login)
		auth.POST("/verify-otp", h.VerifyOTP)
		auth.POST("/resend-otp", h.ResendOTP)
	}

	users := r.Group("/api/users")
	users.Use(authMiddleware)
	{
		users.GET("/me", h.GetProfile)
		users.PUT("/me", h.UpdateProfile)
		users.POST("/switch-role", h.SwitchRole)
	}
}

// Register handles user registration
// @Summary Register a new user
// @Tags Auth
// @Accept json
// @Produce json
// @Param body body RegisterRequest true "Registration data"
// @Success 201 {object} AuthResponse
// @Router /api/auth/register [post]
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

// Login handles user login
// @Summary Login user
// @Tags Auth
// @Accept json
// @Produce json
// @Param body body LoginRequest true "Login credentials"
// @Success 200 {object} AuthResponse
// @Router /api/auth/login [post]
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

// VerifyOTP handles OTP verification
// @Summary Verify phone number with OTP
// @Tags Auth
// @Accept json
// @Produce json
// @Param body body VerifyOTPRequest true "OTP verification data"
// @Success 200 {object} AuthResponse
// @Router /api/auth/verify-otp [post]
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

// ResendOTP resends OTP to phone number
// @Summary Resend OTP
// @Tags Auth
// @Accept json
// @Produce json
// @Param body body object{phone_number=string} true "Phone number"
// @Success 200 {object} object{message=string}
// @Router /api/auth/resend-otp [post]
func (h *Handler) ResendOTP(c *gin.Context) {
	var req struct {
		PhoneNumber string `json:"phone_number" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.ResendOTP(req.PhoneNumber); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "OTP sent successfully"})
}

// GetProfile returns current user profile
// @Summary Get user profile
// @Tags Users
// @Security BearerAuth
// @Produce json
// @Success 200 {object} UserResponse
// @Router /api/users/me [get]
func (h *Handler) GetProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, err := h.service.GetProfile(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, UserResponse{User: user})
}

// UpdateProfile updates user profile
// @Summary Update user profile
// @Tags Users
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body UpdateProfileRequest true "Profile update data"
// @Success 200 {object} UserResponse
// @Router /api/users/me [put]
func (h *Handler) UpdateProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.service.UpdateProfile(userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, UserResponse{User: user, Message: "Profile updated successfully"})
}

// SwitchRole switches between rider and passenger roles
// @Summary Switch user role
// @Description Switch between rider and passenger roles. Only allowed when user doesn't have an active booking.
// @Tags Users
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body SwitchRoleRequest true "Role to switch to"
// @Success 200 {object} UserResponse
// @Failure 400 {object} object{error=string} "Cannot switch role while having an active booking"
// @Router /api/users/switch-role [post]
func (h *Handler) SwitchRole(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req SwitchRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.service.SwitchRole(userID, &req)
	if err != nil {
		status := http.StatusInternalServerError
		if err == ErrCannotSwitchRole {
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, UserResponse{
		User:    user,
		Message: "Role switched to " + req.Role + " successfully",
	})
}
