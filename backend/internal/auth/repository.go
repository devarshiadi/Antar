package auth

import (
	"database/sql"
	"errors"
	"time"

	"github.com/antar/backend/pkg/database"
	"github.com/google/uuid"
)

var (
	ErrUserNotFound      = errors.New("user not found")
	ErrUserExists        = errors.New("user already exists")
	ErrOTPNotFound       = errors.New("OTP not found")
	ErrOTPExpired        = errors.New("OTP has expired")
	ErrOTPAlreadyUsed    = errors.New("OTP already used")
)

// Repository handles database operations for auth
type Repository struct {
	db *database.DB
}

// NewRepository creates a new auth repository
func NewRepository(db *database.DB) *Repository {
	return &Repository{db: db}
}

// Migrate creates the users and otp tables
func (r *Repository) Migrate() error {
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
	return r.db.Migrate(schema)
}

// CreateUser creates a new user
func (r *Repository) CreateUser(user *User) error {
	user.ID = uuid.New().String()
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	user.Rating = 5.0
	user.ActiveRole = "passenger" // Default role

	_, err := r.db.Exec(`
		INSERT INTO users (id, name, phone_number, password, active_role, is_verified, rating, total_rides, is_busy, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, user.ID, user.Name, user.PhoneNumber, user.Password, user.ActiveRole, user.IsVerified, user.Rating, user.TotalRides, user.IsBusy, user.CreatedAt, user.UpdatedAt)

	if err != nil {
		return ErrUserExists
	}
	return nil
}

// GetUserByPhone retrieves a user by phone number
func (r *Repository) GetUserByPhone(phoneNumber string) (*User, error) {
	user := &User{}
	err := r.db.QueryRow(`
		SELECT id, name, phone_number, password, active_role, is_verified, rating, total_rides, is_busy, created_at, updated_at
		FROM users WHERE phone_number = ?
	`, phoneNumber).Scan(&user.ID, &user.Name, &user.PhoneNumber, &user.Password, &user.ActiveRole, &user.IsVerified, &user.Rating, &user.TotalRides, &user.IsBusy, &user.CreatedAt, &user.UpdatedAt)

	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	return user, nil
}

// GetUserByID retrieves a user by ID
func (r *Repository) GetUserByID(id string) (*User, error) {
	user := &User{}
	err := r.db.QueryRow(`
		SELECT id, name, phone_number, password, active_role, is_verified, rating, total_rides, is_busy, created_at, updated_at
		FROM users WHERE id = ?
	`, id).Scan(&user.ID, &user.Name, &user.PhoneNumber, &user.Password, &user.ActiveRole, &user.IsVerified, &user.Rating, &user.TotalRides, &user.IsBusy, &user.CreatedAt, &user.UpdatedAt)

	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	return user, nil
}

// UpdateUser updates user information
func (r *Repository) UpdateUser(user *User) error {
	user.UpdatedAt = time.Now()
	_, err := r.db.Exec(`
		UPDATE users SET name = ?, active_role = ?, is_verified = ?, rating = ?, total_rides = ?, is_busy = ?, updated_at = ?
		WHERE id = ?
	`, user.Name, user.ActiveRole, user.IsVerified, user.Rating, user.TotalRides, user.IsBusy, user.UpdatedAt, user.ID)
	return err
}

// SetUserBusy sets the user's busy status
func (r *Repository) SetUserBusy(userID string, isBusy bool) error {
	_, err := r.db.Exec(`UPDATE users SET is_busy = ?, updated_at = ? WHERE id = ?`, isBusy, time.Now(), userID)
	return err
}

// SwitchUserRole switches user's active role (only if not busy)
func (r *Repository) SwitchUserRole(userID, role string) error {
	// First check if user is busy
	var isBusy bool
	err := r.db.QueryRow(`SELECT is_busy FROM users WHERE id = ?`, userID).Scan(&isBusy)
	if err != nil {
		return err
	}
	if isBusy {
		return errors.New("cannot switch role while having an active booking")
	}

	_, err = r.db.Exec(`UPDATE users SET active_role = ?, updated_at = ? WHERE id = ?`, role, time.Now(), userID)
	return err
}

// CreateOTP creates a new OTP record
func (r *Repository) CreateOTP(phoneNumber, code string, expiresAt time.Time) (*OTPRecord, error) {
	otp := &OTPRecord{
		ID:          uuid.New().String(),
		PhoneNumber: phoneNumber,
		Code:        code,
		ExpiresAt:   expiresAt,
		Used:        false,
		CreatedAt:   time.Now(),
	}

	_, err := r.db.Exec(`
		INSERT INTO otp_records (id, phone_number, code, expires_at, used, created_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`, otp.ID, otp.PhoneNumber, otp.Code, otp.ExpiresAt, otp.Used, otp.CreatedAt)

	if err != nil {
		return nil, err
	}
	return otp, nil
}

// VerifyOTP verifies and marks OTP as used
func (r *Repository) VerifyOTP(phoneNumber, code string) error {
	var otp OTPRecord
	err := r.db.QueryRow(`
		SELECT id, phone_number, code, expires_at, used FROM otp_records
		WHERE phone_number = ? AND code = ?
		ORDER BY created_at DESC LIMIT 1
	`, phoneNumber, code).Scan(&otp.ID, &otp.PhoneNumber, &otp.Code, &otp.ExpiresAt, &otp.Used)

	if err == sql.ErrNoRows {
		return ErrOTPNotFound
	}
	if err != nil {
		return err
	}

	if otp.Used {
		return ErrOTPAlreadyUsed
	}
	if time.Now().After(otp.ExpiresAt) {
		return ErrOTPExpired
	}

	// Mark as used
	_, err = r.db.Exec(`UPDATE otp_records SET used = 1 WHERE id = ?`, otp.ID)
	if err != nil {
		return err
	}

	// Mark user as verified
	_, err = r.db.Exec(`UPDATE users SET is_verified = 1, updated_at = ? WHERE phone_number = ?`, time.Now(), phoneNumber)
	return err
}
