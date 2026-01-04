package chat

import (
	"time"
)

// Thread represents a chat thread between users
type Thread struct {
	ID           string    `json:"id"`
	RideID       string    `json:"ride_id"`
	Participants []string  `json:"participants"` // User IDs
	LastMessage  string    `json:"last_message"`
	LastSenderID string    `json:"last_sender_id"`
	UnreadCount  int       `json:"unread_count"`
	UpdatedAt    time.Time `json:"updated_at"`
	CreatedAt    time.Time `json:"created_at"`
}

// Message represents a chat message
type Message struct {
	ID        string    `json:"id"`
	ThreadID  string    `json:"thread_id"`
	SenderID  string    `json:"sender_id"`
	Content   string    `json:"content"`
	Type      string    `json:"type"` // text, location, image
	IsRead    bool      `json:"is_read"`
	Timestamp time.Time `json:"timestamp"`
}

// SendMessageRequest represents message send payload
type SendMessageRequest struct {
	Content string `json:"content" binding:"required,max=1000"`
	Type    string `json:"type"` // defaults to "text"
}

// CreateThreadRequest represents thread creation payload
type CreateThreadRequest struct {
	RideID       string   `json:"ride_id" binding:"required"`
	Participants []string `json:"participants" binding:"required,min=2"`
}

// ThreadResponse represents thread data response
type ThreadResponse struct {
	Thread  *Thread `json:"thread"`
	Message string  `json:"message,omitempty"`
}

// ThreadsResponse represents multiple threads response
type ThreadsResponse struct {
	Threads []*Thread `json:"threads"`
	Count   int       `json:"count"`
}

// MessageResponse represents message data response
type MessageResponse struct {
	Message    *Message `json:"message"`
	StatusText string   `json:"status_text,omitempty"`
}

// MessagesResponse represents multiple messages response
type MessagesResponse struct {
	Messages []*Message `json:"messages"`
	Count    int        `json:"count"`
}

// WSChatMessage represents a WebSocket chat message
type WSChatMessage struct {
	Type     string      `json:"type"` // message, typing, read, delivered
	ThreadID string      `json:"thread_id"`
	Payload  interface{} `json:"payload"`
}

// TypingIndicator represents typing status
type TypingIndicator struct {
	UserID   string `json:"user_id"`
	ThreadID string `json:"thread_id"`
	IsTyping bool   `json:"is_typing"`
}

// ReadReceipt represents message read receipt
type ReadReceipt struct {
	ThreadID  string    `json:"thread_id"`
	UserID    string    `json:"user_id"`
	MessageID string    `json:"message_id"`
	ReadAt    time.Time `json:"read_at"`
}
