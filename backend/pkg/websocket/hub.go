package websocket

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

// Client represents a WebSocket client
type Client struct {
	ID     string
	UserID string
	Conn   *websocket.Conn
	Send   chan []byte
	Hub    *Hub
}

// Hub maintains active WebSocket connections
type Hub struct {
	// Registered clients by user ID
	clients map[string]map[*Client]bool

	// Inbound messages from clients
	broadcast chan *Message

	// Register requests
	register chan *Client

	// Unregister requests
	unregister chan *Client

	mutex sync.RWMutex
}

// Message represents a WebSocket message
type Message struct {
	Type       string      `json:"type"`
	Payload    interface{} `json:"payload"`
	SenderID   string      `json:"sender_id,omitempty"`
	ReceiverID string      `json:"receiver_id,omitempty"`
	RoomID     string      `json:"room_id,omitempty"`
}

// NewHub creates a new Hub
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]map[*Client]bool),
		broadcast:  make(chan *Message, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			if h.clients[client.UserID] == nil {
				h.clients[client.UserID] = make(map[*Client]bool)
			}
			h.clients[client.UserID][client] = true
			h.mutex.Unlock()
			log.Printf("Client registered: %s (user: %s)", client.ID, client.UserID)

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
			h.mutex.Unlock()
			log.Printf("Client unregistered: %s (user: %s)", client.ID, client.UserID)

		case message := <-h.broadcast:
			h.handleBroadcast(message)
		}
	}
}

func (h *Hub) handleBroadcast(message *Message) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	// If specific receiver, send only to them
	if message.ReceiverID != "" {
		if clients, ok := h.clients[message.ReceiverID]; ok {
			for client := range clients {
				select {
				case client.Send <- serializeMessage(message):
				default:
					close(client.Send)
					delete(clients, client)
				}
			}
		}
		return
	}

	// Broadcast to all clients
	for _, clients := range h.clients {
		for client := range clients {
			select {
			case client.Send <- serializeMessage(message):
			default:
				close(client.Send)
				delete(clients, client)
			}
		}
	}
}

// SendToUser sends a message to a specific user
func (h *Hub) SendToUser(userID string, message *Message) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	if clients, ok := h.clients[userID]; ok {
		data := serializeMessage(message)
		for client := range clients {
			select {
			case client.Send <- data:
			default:
				// Client buffer full, skip
			}
		}
	}
}

// Register registers a client
func (h *Hub) Register(client *Client) {
	h.register <- client
}

// Unregister unregisters a client
func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}

// Broadcast sends a message to all clients
func (h *Hub) Broadcast(message *Message) {
	h.broadcast <- message
}

// UpgradeConnection upgrades HTTP to WebSocket
func UpgradeConnection(w http.ResponseWriter, r *http.Request) (*websocket.Conn, error) {
	return upgrader.Upgrade(w, r, nil)
}

func serializeMessage(msg *Message) []byte {
	// Simple JSON serialization
	data := []byte(`{"type":"` + msg.Type + `"}`)
	return data
}

// ReadPump pumps messages from the WebSocket connection to the hub
func (c *Client) ReadPump(onMessage func(*Client, []byte)) {
	defer func() {
		c.Hub.Unregister(c)
		c.Conn.Close()
	}()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}
		if onMessage != nil {
			onMessage(c, message)
		}
	}
}

// WritePump pumps messages from the hub to the WebSocket connection
func (c *Client) WritePump() {
	defer func() {
		c.Conn.Close()
	}()

	for {
		message, ok := <-c.Send
		if !ok {
			c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
			return
		}

		w, err := c.Conn.NextWriter(websocket.TextMessage)
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
