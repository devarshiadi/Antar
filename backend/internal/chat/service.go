package chat

import (
	"errors"
)

var (
	ErrUnauthorized = errors.New("unauthorized")
)

// Service handles chat business logic
type Service struct {
	repo *Repository
	hub  *ChatHub
}

// NewService creates a new chat service
func NewService(repo *Repository) *Service {
	hub := NewChatHub()
	go hub.Run()

	return &Service{
		repo: repo,
		hub:  hub,
	}
}

// GetHub returns the chat hub
func (s *Service) GetHub() *ChatHub {
	return s.hub
}

// CreateThread creates a new chat thread
func (s *Service) CreateThread(req *CreateThreadRequest) (*Thread, error) {
	thread, err := s.repo.GetOrCreateThread(req.RideID, req.Participants)
	if err != nil {
		return nil, err
	}
	return thread, nil
}

// GetThread retrieves a thread by ID
func (s *Service) GetThread(userID, threadID string) (*Thread, error) {
	thread, err := s.repo.GetThreadByID(threadID)
	if err != nil {
		return nil, err
	}

	// Check if user is participant
	if !s.repo.IsParticipant(threadID, userID) {
		return nil, ErrNotParticipant
	}

	return thread, nil
}

// GetThreadByRide retrieves a thread by ride ID
func (s *Service) GetThreadByRide(userID, rideID string) (*Thread, error) {
	thread, err := s.repo.GetThreadByRideID(rideID)
	if err != nil {
		return nil, err
	}

	// Check if user is participant
	if !s.repo.IsParticipant(thread.ID, userID) {
		return nil, ErrNotParticipant
	}

	return thread, nil
}

// GetUserThreads retrieves all threads for a user
func (s *Service) GetUserThreads(userID string) ([]*Thread, error) {
	return s.repo.GetThreadsForUser(userID)
}

// SendMessage sends a message in a thread
func (s *Service) SendMessage(userID, threadID string, req *SendMessageRequest) (*Message, error) {
	// Verify user is participant
	if !s.repo.IsParticipant(threadID, userID) {
		return nil, ErrNotParticipant
	}

	thread, err := s.repo.GetThreadByID(threadID)
	if err != nil {
		return nil, err
	}

	// Create message
	msg := &Message{
		ThreadID: threadID,
		SenderID: userID,
		Content:  req.Content,
		Type:     req.Type,
	}
	if msg.Type == "" {
		msg.Type = "text"
	}

	if err := s.repo.CreateMessage(msg); err != nil {
		return nil, err
	}

	// Update thread
	thread.LastMessage = msg.Content
	thread.LastSenderID = userID
	if err := s.repo.UpdateThread(thread); err != nil {
		return nil, err
	}

	// Broadcast to thread participants
	s.hub.SendToThread(threadID, &WSChatMessage{
		Type:     "message",
		ThreadID: threadID,
		Payload:  msg,
	})

	return msg, nil
}

// GetMessages retrieves messages for a thread
func (s *Service) GetMessages(userID, threadID string, limit, offset int) ([]*Message, error) {
	// Verify user is participant
	if !s.repo.IsParticipant(threadID, userID) {
		return nil, ErrNotParticipant
	}

	return s.repo.GetMessagesForThread(threadID, limit, offset)
}

// MarkAsRead marks messages as read
func (s *Service) MarkAsRead(userID, threadID string) error {
	// Verify user is participant
	if !s.repo.IsParticipant(threadID, userID) {
		return ErrNotParticipant
	}

	if err := s.repo.MarkMessagesAsRead(threadID, userID); err != nil {
		return err
	}

	// Notify other participants
	s.hub.SendToThread(threadID, &WSChatMessage{
		Type:     "read",
		ThreadID: threadID,
		Payload: ReadReceipt{
			ThreadID: threadID,
			UserID:   userID,
		},
	})

	return nil
}

// SendTypingIndicator sends typing indicator to thread
func (s *Service) SendTypingIndicator(userID, threadID string, isTyping bool) error {
	// Verify user is participant
	if !s.repo.IsParticipant(threadID, userID) {
		return ErrNotParticipant
	}

	s.hub.SendToThread(threadID, &WSChatMessage{
		Type:     "typing",
		ThreadID: threadID,
		Payload: TypingIndicator{
			UserID:   userID,
			ThreadID: threadID,
			IsTyping: isTyping,
		},
	})

	return nil
}

// SubscribeToThread subscribes user to thread updates
func (s *Service) SubscribeToThread(userID, threadID string) error {
	if !s.repo.IsParticipant(threadID, userID) {
		return ErrNotParticipant
	}
	s.hub.SubscribeToThread(userID, threadID)
	return nil
}

// CreateThreadForRide creates or retrieves a chat thread for a ride
func (s *Service) CreateThreadForRide(rideID string, participants []string) (*Thread, error) {
	return s.repo.GetOrCreateThread(rideID, participants)
}
