# 💬 Antar Chat Service

Standalone real-time chat microservice with WebSocket support.

## 🚀 Deploy to HuggingFace Spaces

1. Create a new HuggingFace Space with **Docker** SDK
2. Upload this folder
3. Set `JWT_SECRET` (same as auth-service)

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/chat/threads` | Get user's threads |
| POST | `/api/chat/threads` | Create thread |
| GET | `/api/chat/threads/:id/messages` | Get messages |
| POST | `/api/chat/threads/:id/messages` | Send message |
| PUT | `/api/chat/threads/:id/read` | Mark as read |
| POST | `/api/chat/threads/:id/typing` | Typing indicator |
| WS | `/ws/chat?userId=X` | Real-time messaging |

## WebSocket Events

**Incoming:**
- `subscribe` - Subscribe to a thread
- `typing` - Typing indicator

**Outgoing:**
- `message` - New message
- `typing` - Someone is typing
- `read` - Messages read

## 🧪 Test Locally

```bash
docker build -t antar-chat .
docker run -p 7860:7860 antar-chat
```

## 🔧 Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 7860) |
| `JWT_SECRET` | JWT secret (same as auth) |
| `DATABASE_PATH` | SQLite path |
