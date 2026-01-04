package chat

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/antar/backend/pkg/websocket"
	"github.com/google/uuid"
	ws "github.com/gorilla/websocket"
)

// ChatHub manages WebSocket connections for chat
type ChatHub struct {
	// Registered clients by user ID
	clients map[string]map[*ChatClient]bool

	// Thread subscriptions (threadID -> userIDs)
	threadSubs map[string]map[string]bool

	// Channels
	register   chan *ChatClient
	unregister chan *ChatClient
	broadcast  chan *WSChatMessage

	mutex sync.RWMutex
}

// ChatClient represents a connected chat client
type ChatClient struct {
	ID       string
	UserID   string
	Conn     *ws.Conn
	Send     chan []byte
	Hub      *ChatHub
	ThreadID string // Currently subscribed thread
}

// NewChatHub creates a new chat hub
func NewChatHub() *ChatHub {
	return &ChatHub{
		clients:    make(map[string]map[*ChatClient]bool),
		threadSubs: make(map[string]map[string]bool),
		register:   make(chan *ChatClient),
		unregister: make(chan *ChatClient),
		broadcast:  make(chan *WSChatMessage, 256),
	}
}

// Run starts the chat hub's main loop
func (h *ChatHub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			if h.clients[client.UserID] == nil {
				h.clients[client.UserID] = make(map[*ChatClient]bool)
			}
			h.clients[client.UserID][client] = true
			h.mutex.Unlock()
			log.Printf("Chat client registered: %s (user: %s)", client.ID, client.UserID)

		case client := <-h.unregister:
			h.mutex.Lock()
			if clients, ok := h.clients[client.UserID]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.Send)
					if len(clients) == 0 {
						delete(h.clients, client.UserID)
					}
				}
			}
			// Remove from thread subscriptions
			if client.ThreadID != "" {
				if subs, ok := h.threadSubs[client.ThreadID]; ok {
					delete(subs, client.UserID)
				}
			}
			h.mutex.Unlock()
			log.Printf("Chat client unregistered: %s (user: %s)", client.ID, client.UserID)

		case message := <-h.broadcast:
			h.handleBroadcast(message)
		}
	}
}

func (h *ChatHub) handleBroadcast(message *WSChatMessage) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	data, _ := json.Marshal(message)

	// Send to all participants of the thread
	if subs, ok := h.threadSubs[message.ThreadID]; ok {
		for userID := range subs {
			if clients, ok := h.clients[userID]; ok {
				for client := range clients {
					select {
					case client.Send <- data:
					default:
						close(client.Send)
						delete(clients, client)
					}
				}
			}
		}
	}
}

// SendToUser sends a message to a specific user
func (h *ChatHub) SendToUser(userID string, message *WSChatMessage) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	data, _ := json.Marshal(message)

	if clients, ok := h.clients[userID]; ok {
		for client := range clients {
			select {
			case client.Send <- data:
			default:
				// Client buffer full
			}
		}
	}
}

// SendToThread sends a message to all participants of a thread
func (h *ChatHub) SendToThread(threadID string, message *WSChatMessage) {
	message.ThreadID = threadID
	h.broadcast <- message
}

// SubscribeToThread subscribes a user to a thread
func (h *ChatHub) SubscribeToThread(userID, threadID string) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	if h.threadSubs[threadID] == nil {
		h.threadSubs[threadID] = make(map[string]bool)
	}
	h.threadSubs[threadID][userID] = true
}

// UnsubscribeFromThread unsubscribes a user from a thread
func (h *ChatHub) UnsubscribeFromThread(userID, threadID string) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	if subs, ok := h.threadSubs[threadID]; ok {
		delete(subs, userID)
	}
}

// Register registers a client
func (h *ChatHub) Register(client *ChatClient) {
	h.register <- client
}

// Unregister unregisters a client
func (h *ChatHub) Unregister(client *ChatClient) {
	h.unregister <- client
}

// ReadPump pumps messages from the WebSocket connection
func (c *ChatClient) ReadPump(onMessage func(*ChatClient, []byte)) {
	defer func() {
		c.Hub.Unregister(c)
		c.Conn.Close()
	}()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if ws.IsUnexpectedCloseError(err, ws.CloseGoingAway, ws.CloseAbnormalClosure) {
				log.Printf("Chat WebSocket error: %v", err)
			}
			break
		}
		if onMessage != nil {
			onMessage(c, message)
		}
	}
}

// WritePump pumps messages to the WebSocket connection
func (c *ChatClient) WritePump() {
	defer c.Conn.Close()

	for {
		message, ok := <-c.Send
		if !ok {
			c.Conn.WriteMessage(ws.CloseMessage, []byte{})
			return
		}

		w, err := c.Conn.NextWriter(ws.TextMessage)
		if err != nil {
			return
		}
		w.Write(message)

		// Flush queued messages
		n := len(c.Send)
		for i := 0; i < n; i++ {
			w.Write([]byte{'\n'})
			w.Write(<-c.Send)
		}

		if err := w.Close(); err != nil {
			return
		}
	}
}

// NewChatClient creates a new chat client
func NewChatClient(userID string, conn *ws.Conn, hub *ChatHub) *ChatClient {
	return &ChatClient{
		ID:     uuid.New().String(),
		UserID: userID,
		Conn:   conn,
		Send:   make(chan []byte, 256),
		Hub:    hub,
	}
}
