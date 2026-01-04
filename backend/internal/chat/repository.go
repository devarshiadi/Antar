package chat

import (
	"database/sql"
	"encoding/json"
	"errors"
	"time"

	"github.com/antar/backend/pkg/database"
	"github.com/google/uuid"
)

var (
	ErrThreadNotFound  = errors.New("thread not found")
	ErrMessageNotFound = errors.New("message not found")
	ErrNotParticipant  = errors.New("you are not a participant in this thread")
)

// Repository handles database operations for chat
type Repository struct {
	db *database.DB
}

// NewRepository creates a new chat repository
func NewRepository(db *database.DB) *Repository {
	return &Repository{db: db}
}

// Migrate creates the chat tables
func (r *Repository) Migrate() error {
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
		timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (thread_id) REFERENCES threads(id)
	);

	CREATE TABLE IF NOT EXISTS read_receipts (
		id TEXT PRIMARY KEY,
		thread_id TEXT NOT NULL,
		user_id TEXT NOT NULL,
		last_read_message_id TEXT,
		read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(thread_id, user_id)
	);

	CREATE INDEX IF NOT EXISTS idx_threads_ride ON threads(ride_id);
	CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
	CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
	`
	return r.db.Migrate(schema)
}

// CreateThread creates a new chat thread
func (r *Repository) CreateThread(thread *Thread) error {
	thread.ID = uuid.New().String()
	thread.CreatedAt = time.Now()
	thread.UpdatedAt = time.Now()

	participantsJSON, _ := json.Marshal(thread.Participants)

	_, err := r.db.Exec(`
		INSERT INTO threads (id, ride_id, participants, last_message, last_sender_id, updated_at, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, thread.ID, thread.RideID, string(participantsJSON), thread.LastMessage, thread.LastSenderID, 
		thread.UpdatedAt, thread.CreatedAt)

	return err
}

// GetThreadByID retrieves a thread by ID
func (r *Repository) GetThreadByID(id string) (*Thread, error) {
	thread := &Thread{}
	var participantsJSON string

	err := r.db.QueryRow(`
		SELECT id, ride_id, participants, last_message, last_sender_id, updated_at, created_at
		FROM threads WHERE id = ?
	`, id).Scan(&thread.ID, &thread.RideID, &participantsJSON, &thread.LastMessage, &thread.LastSenderID,
		&thread.UpdatedAt, &thread.CreatedAt)

	if err == sql.ErrNoRows {
		return nil, ErrThreadNotFound
	}
	if err != nil {
		return nil, err
	}

	json.Unmarshal([]byte(participantsJSON), &thread.Participants)
	return thread, nil
}

// GetThreadByRideID retrieves a thread by ride ID
func (r *Repository) GetThreadByRideID(rideID string) (*Thread, error) {
	thread := &Thread{}
	var participantsJSON string

	err := r.db.QueryRow(`
		SELECT id, ride_id, participants, last_message, last_sender_id, updated_at, created_at
		FROM threads WHERE ride_id = ?
	`, rideID).Scan(&thread.ID, &thread.RideID, &participantsJSON, &thread.LastMessage, &thread.LastSenderID,
		&thread.UpdatedAt, &thread.CreatedAt)

	if err == sql.ErrNoRows {
		return nil, ErrThreadNotFound
	}
	if err != nil {
		return nil, err
	}

	json.Unmarshal([]byte(participantsJSON), &thread.Participants)
	return thread, nil
}

// GetThreadsForUser retrieves all threads for a user
func (r *Repository) GetThreadsForUser(userID string) ([]*Thread, error) {
	rows, err := r.db.Query(`
		SELECT id, ride_id, participants, last_message, last_sender_id, updated_at, created_at
		FROM threads 
		WHERE participants LIKE ?
		ORDER BY updated_at DESC
	`, "%"+userID+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var threads []*Thread
	for rows.Next() {
		thread := &Thread{}
		var participantsJSON string
		if err := rows.Scan(&thread.ID, &thread.RideID, &participantsJSON, &thread.LastMessage,
			&thread.LastSenderID, &thread.UpdatedAt, &thread.CreatedAt); err != nil {
			return nil, err
		}
		json.Unmarshal([]byte(participantsJSON), &thread.Participants)
		
		// Calculate unread count for this user
		thread.UnreadCount = r.getUnreadCount(thread.ID, userID)
		
		threads = append(threads, thread)
	}
	return threads, nil
}

// UpdateThread updates thread metadata
func (r *Repository) UpdateThread(thread *Thread) error {
	thread.UpdatedAt = time.Now()
	_, err := r.db.Exec(`
		UPDATE threads SET last_message = ?, last_sender_id = ?, updated_at = ?
		WHERE id = ?
	`, thread.LastMessage, thread.LastSenderID, thread.UpdatedAt, thread.ID)
	return err
}

// CreateMessage creates a new message
func (r *Repository) CreateMessage(msg *Message) error {
	msg.ID = uuid.New().String()
	msg.Timestamp = time.Now()
	msg.IsRead = false

	if msg.Type == "" {
		msg.Type = "text"
	}

	_, err := r.db.Exec(`
		INSERT INTO messages (id, thread_id, sender_id, content, type, is_read, timestamp)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, msg.ID, msg.ThreadID, msg.SenderID, msg.Content, msg.Type, msg.IsRead, msg.Timestamp)

	return err
}

// GetMessageByID retrieves a message by ID
func (r *Repository) GetMessageByID(id string) (*Message, error) {
	msg := &Message{}
	err := r.db.QueryRow(`
		SELECT id, thread_id, sender_id, content, type, is_read, timestamp
		FROM messages WHERE id = ?
	`, id).Scan(&msg.ID, &msg.ThreadID, &msg.SenderID, &msg.Content, &msg.Type, &msg.IsRead, &msg.Timestamp)

	if err == sql.ErrNoRows {
		return nil, ErrMessageNotFound
	}
	if err != nil {
		return nil, err
	}
	return msg, nil
}

// GetMessagesForThread retrieves all messages for a thread
func (r *Repository) GetMessagesForThread(threadID string, limit, offset int) ([]*Message, error) {
	if limit <= 0 {
		limit = 50
	}

	rows, err := r.db.Query(`
		SELECT id, thread_id, sender_id, content, type, is_read, timestamp
		FROM messages 
		WHERE thread_id = ?
		ORDER BY timestamp DESC
		LIMIT ? OFFSET ?
	`, threadID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []*Message
	for rows.Next() {
		msg := &Message{}
		if err := rows.Scan(&msg.ID, &msg.ThreadID, &msg.SenderID, &msg.Content, &msg.Type,
			&msg.IsRead, &msg.Timestamp); err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}

	// Reverse to get chronological order
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}

// MarkMessagesAsRead marks all messages in a thread as read for a user
func (r *Repository) MarkMessagesAsRead(threadID, userID string) error {
	// Mark messages not sent by this user as read
	_, err := r.db.Exec(`
		UPDATE messages SET is_read = 1 
		WHERE thread_id = ? AND sender_id != ? AND is_read = 0
	`, threadID, userID)
	if err != nil {
		return err
	}

	// Update or create read receipt
	_, err = r.db.Exec(`
		INSERT INTO read_receipts (id, thread_id, user_id, read_at)
		VALUES (?, ?, ?, ?)
		ON CONFLICT(thread_id, user_id) DO UPDATE SET read_at = ?
	`, uuid.New().String(), threadID, userID, time.Now(), time.Now())

	return err
}

// getUnreadCount returns unread message count for a user in a thread
func (r *Repository) getUnreadCount(threadID, userID string) int {
	var count int
	r.db.QueryRow(`
		SELECT COUNT(*) FROM messages 
		WHERE thread_id = ? AND sender_id != ? AND is_read = 0
	`, threadID, userID).Scan(&count)
	return count
}

// GetOrCreateThread gets existing thread or creates new one
func (r *Repository) GetOrCreateThread(rideID string, participants []string) (*Thread, error) {
	// Try to find existing thread
	thread, err := r.GetThreadByRideID(rideID)
	if err == nil {
		return thread, nil
	}

	// Create new thread
	thread = &Thread{
		RideID:       rideID,
		Participants: participants,
	}
	if err := r.CreateThread(thread); err != nil {
		return nil, err
	}

	return thread, nil
}

// IsParticipant checks if user is participant in thread
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
