package chat

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/antar/backend/pkg/middleware"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Handler handles HTTP requests for chat
type Handler struct {
	service *Service
}

// NewHandler creates a new chat handler
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes registers chat routes
func (h *Handler) RegisterRoutes(r *gin.Engine, authMiddleware gin.HandlerFunc) {
	chat := r.Group("/api/chat")
	chat.Use(authMiddleware)
	{
		chat.GET("/threads", h.GetThreads)
		chat.POST("/threads", h.CreateThread)
		chat.GET("/threads/:threadId", h.GetThread)
		chat.GET("/threads/:threadId/messages", h.GetMessages)
		chat.POST("/threads/:threadId/messages", h.SendMessage)
		chat.PUT("/threads/:threadId/read", h.MarkAsRead)
		chat.POST("/threads/:threadId/typing", h.SendTypingIndicator)
		chat.GET("/ride/:rideId", h.GetThreadByRide)
	}

	// WebSocket endpoint
	r.GET("/ws/chat", h.HandleWebSocket)
}

// GetThreads retrieves all threads for the current user
// @Summary Get user's chat threads
// @Tags Chat
// @Security BearerAuth
// @Produce json
// @Success 200 {object} ThreadsResponse
// @Router /api/chat/threads [get]
func (h *Handler) GetThreads(c *gin.Context) {
	userID := middleware.GetUserID(c)

	threads, err := h.service.GetUserThreads(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, ThreadsResponse{Threads: threads, Count: len(threads)})
}

// CreateThread creates a new chat thread
// @Summary Create a chat thread
// @Tags Chat
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body CreateThreadRequest true "Thread data"
// @Success 201 {object} ThreadResponse
// @Router /api/chat/threads [post]
func (h *Handler) CreateThread(c *gin.Context) {
	var req CreateThreadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	thread, err := h.service.CreateThread(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, ThreadResponse{Thread: thread, Message: "Thread created"})
}

// GetThread retrieves a thread by ID
// @Summary Get chat thread
// @Tags Chat
// @Security BearerAuth
// @Produce json
// @Param threadId path string true "Thread ID"
// @Success 200 {object} ThreadResponse
// @Router /api/chat/threads/{threadId} [get]
func (h *Handler) GetThread(c *gin.Context) {
	userID := middleware.GetUserID(c)
	threadID := c.Param("threadId")

	thread, err := h.service.GetThread(userID, threadID)
	if err != nil {
		status := http.StatusInternalServerError
		if err == ErrThreadNotFound {
			status = http.StatusNotFound
		} else if err == ErrNotParticipant {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, ThreadResponse{Thread: thread})
}

// GetThreadByRide retrieves a thread by ride ID
// @Summary Get chat thread by ride
// @Tags Chat
// @Security BearerAuth
// @Produce json
// @Param rideId path string true "Ride ID"
// @Success 200 {object} ThreadResponse
// @Router /api/chat/ride/{rideId} [get]
func (h *Handler) GetThreadByRide(c *gin.Context) {
	userID := middleware.GetUserID(c)
	rideID := c.Param("rideId")

	thread, err := h.service.GetThreadByRide(userID, rideID)
	if err != nil {
		status := http.StatusInternalServerError
		if err == ErrThreadNotFound {
			status = http.StatusNotFound
		} else if err == ErrNotParticipant {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, ThreadResponse{Thread: thread})
}

// GetMessages retrieves messages for a thread
// @Summary Get messages for a thread
// @Tags Chat
// @Security BearerAuth
// @Produce json
// @Param threadId path string true "Thread ID"
// @Param limit query int false "Limit" default(50)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} MessagesResponse
// @Router /api/chat/threads/{threadId}/messages [get]
func (h *Handler) GetMessages(c *gin.Context) {
	userID := middleware.GetUserID(c)
	threadID := c.Param("threadId")
	
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	messages, err := h.service.GetMessages(userID, threadID, limit, offset)
	if err != nil {
		status := http.StatusInternalServerError
		if err == ErrNotParticipant {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, MessagesResponse{Messages: messages, Count: len(messages)})
}

// SendMessage sends a message in a thread
// @Summary Send a message
// @Tags Chat
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param threadId path string true "Thread ID"
// @Param body body SendMessageRequest true "Message data"
// @Success 201 {object} MessageResponse
// @Router /api/chat/threads/{threadId}/messages [post]
func (h *Handler) SendMessage(c *gin.Context) {
	userID := middleware.GetUserID(c)
	threadID := c.Param("threadId")

	var req SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	msg, err := h.service.SendMessage(userID, threadID, &req)
	if err != nil {
		status := http.StatusInternalServerError
		if err == ErrNotParticipant {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, MessageResponse{Message: msg, StatusText: "Message sent"})
}

// MarkAsRead marks messages as read
// @Summary Mark messages as read
// @Tags Chat
// @Security BearerAuth
// @Param threadId path string true "Thread ID"
// @Success 200 {object} object{message=string}
// @Router /api/chat/threads/{threadId}/read [put]
func (h *Handler) MarkAsRead(c *gin.Context) {
	userID := middleware.GetUserID(c)
	threadID := c.Param("threadId")

	if err := h.service.MarkAsRead(userID, threadID); err != nil {
		status := http.StatusInternalServerError
		if err == ErrNotParticipant {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Messages marked as read"})
}

// SendTypingIndicator sends typing indicator
// @Summary Send typing indicator
// @Tags Chat
// @Security BearerAuth
// @Accept json
// @Param threadId path string true "Thread ID"
// @Param body body object{is_typing=bool} true "Typing status"
// @Success 200 {object} object{message=string}
// @Router /api/chat/threads/{threadId}/typing [post]
func (h *Handler) SendTypingIndicator(c *gin.Context) {
	userID := middleware.GetUserID(c)
	threadID := c.Param("threadId")

	var req struct {
		IsTyping bool `json:"is_typing"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.SendTypingIndicator(userID, threadID, req.IsTyping); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Typing indicator sent"})
}

// HandleWebSocket handles WebSocket connections for real-time chat
func (h *Handler) HandleWebSocket(c *gin.Context) {
	userID := c.Query("userId")
	threadID := c.Query("threadId")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId required"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upgrade connection"})
		return
	}

	client := NewChatClient(userID, conn, h.service.GetHub())
	
	// Subscribe to thread if provided
	if threadID != "" {
		client.ThreadID = threadID
		h.service.SubscribeToThread(userID, threadID)
	}

	h.service.GetHub().Register(client)

	go client.WritePump()
	go client.ReadPump(func(c *ChatClient, msg []byte) {
		// Handle incoming WebSocket messages
		var wsMsg WSChatMessage
		if err := json.Unmarshal(msg, &wsMsg); err != nil {
			return
		}

		switch wsMsg.Type {
		case "subscribe":
			// Subscribe to a thread
			if threadID, ok := wsMsg.Payload.(string); ok {
				c.ThreadID = threadID
				h.service.SubscribeToThread(c.UserID, threadID)
			}
		case "typing":
			// Handle typing indicator
			if indicator, ok := wsMsg.Payload.(map[string]interface{}); ok {
				isTyping, _ := indicator["is_typing"].(bool)
				h.service.SendTypingIndicator(c.UserID, wsMsg.ThreadID, isTyping)
			}
		case "message":
			// Handle message via WebSocket
			if payload, ok := wsMsg.Payload.(map[string]interface{}); ok {
				content, _ := payload["content"].(string)
				if content != "" {
					h.service.SendMessage(c.UserID, wsMsg.ThreadID, &SendMessageRequest{
						Content: content,
						Type:    "text",
					})
				}
			}
		}
	})
}
