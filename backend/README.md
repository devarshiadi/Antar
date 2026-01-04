# 🚀 Antar Backend - Golang Microservices

A production-ready microservices backend for the Antar ride-sharing app, built with **Go** and designed for deployment on **HuggingFace Spaces**.

## 📋 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway (:8000)                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
    ▼                      ▼                      ▼
┌─────────┐         ┌─────────────┐         ┌─────────┐
│  Auth   │         │ Matchmaking │         │  Chat   │
│ (:8001) │         │   (:8002)   │         │ (:8003) │
└────┬────┘         └──────┬──────┘         └────┬────┘
     │                     │                     │
     ▼                     ▼                     ▼
┌─────────┐         ┌─────────────┐         ┌─────────┐
│auth.db  │         │  rides.db   │         │ chat.db │
└─────────┘         └─────────────┘         └─────────┘

                    ┌──────────────┐
                    │   Location   │
                    │   (:8004)    │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Nominatim   │
                    │    OSRM      │
                    └──────────────┘
```

## 🛠️ Tech Stack

- **Language**: Go 1.21+
- **Framework**: Gin (HTTP), Gorilla (WebSocket)
- **Database**: SQLite (demo) / PostgreSQL (production)
- **Auth**: JWT (golang-jwt/jwt/v5)
- **Maps**: Nominatim (OpenStreetMap) for geocoding
- **Routing**: OSRM (Open Source Routing Machine)

## 📁 Project Structure

```
backend/
├── cmd/                         # Service entrypoints
│   ├── auth/main.go
│   ├── matchmaking/main.go
│   ├── chat/main.go
│   ├── location/main.go
│   └── gateway/main.go
├── internal/                    # Private application code
│   ├── auth/
│   ├── matchmaking/
│   ├── chat/
│   └── location/
├── pkg/                         # Shared packages
│   ├── config/
│   ├── database/
│   ├── jwt/
│   ├── middleware/
│   └── websocket/
├── deployments/                 # Deployment configs
│   └── docker/
│       ├── Dockerfile.auth
│       ├── Dockerfile.matchmaking
│       ├── Dockerfile.chat
│       ├── Dockerfile.location
│       └── Dockerfile.gateway
├── go.mod
├── go.sum
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Go 1.21+
- Docker (optional, for containerized deployment)

### Local Development

1. **Install dependencies**:
   ```bash
   cd backend
   go mod download
   ```

2. **Run all services** (in separate terminals):
   ```bash
   # Terminal 1 - Auth Service
   AUTH_PORT=8001 go run ./cmd/auth

   # Terminal 2 - Matchmaking Service
   MATCHMAKING_PORT=8002 go run ./cmd/matchmaking

   # Terminal 3 - Chat Service
   CHAT_PORT=8003 go run ./cmd/chat

   # Terminal 4 - Location Service
   LOCATION_PORT=8004 go run ./cmd/location

   # Terminal 5 - API Gateway
   PORT=8000 go run ./cmd/gateway
   ```

3. **Or use Docker Compose**:
   ```bash
   docker-compose up
   ```

## 📡 API Endpoints

### Auth Service (`:8001`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/verify-otp` | Verify OTP |
| GET | `/api/users/me` | Get current user |
| PUT | `/api/users/me` | Update profile |
| POST | `/api/users/switch-role` | Switch rider/passenger |

### Matchmaking Service (`:8002`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rides` | Create ride |
| GET | `/api/rides` | List available rides |
| GET | `/api/rides/:id` | Get ride details |
| POST | `/api/rides/:id/request` | Request to join |
| PUT | `/api/rides/:id/request/:reqId` | Accept/reject request |
| GET | `/api/matches/:rideId` | Get matches |
| WS | `/ws/rides` | Real-time updates |

### Chat Service (`:8003`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/threads` | Get user's threads |
| POST | `/api/chat/threads` | Create thread |
| GET | `/api/chat/threads/:id/messages` | Get messages |
| POST | `/api/chat/threads/:id/messages` | Send message |
| WS | `/ws/chat` | Real-time messaging |

### Location Service (`:8004`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/geocode/search` | Search locations |
| GET | `/api/geocode/reverse` | Reverse geocode |
| GET | `/api/route` | Calculate route |
| POST | `/api/location/update` | Update live location |
| WS | `/ws/location/:rideId` | Real-time location |

## 🎯 Key Features

### Role Switching
Users can switch between **rider** and **passenger** roles anytime, as long as they don't have an active booking:

```bash
POST /api/users/switch-role
{
  "role": "rider"  // or "passenger"
}
```

### Matching Algorithm
The intelligent matching system uses:
- **Route Overlap (50%)**: Haversine distance calculation
- **Time Difference (25%)**: Within 60-minute window
- **User Ratings (25%)**: Combined average bonus

Minimum match score: **70/100**

### Real-time Features
- **WebSocket** connections for:
  - Ride updates and new matches
  - Chat messaging with typing indicators
  - Live location sharing during trips

## 🐳 HuggingFace Deployment

Each microservice has its own Dockerfile for separate HuggingFace Spaces:

1. **Create a new HuggingFace Space** (Docker SDK)
2. **Copy the appropriate Dockerfile** and source code
3. **Set environment variables** in Space settings
4. **Deploy!**

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 7860 (HF default) |
| `JWT_SECRET` | JWT signing key | (change in prod!) |
| `DATABASE_PATH` | SQLite data directory | ./data |
| `AUTH_SERVICE_URL` | Auth service URL | http://localhost:8001 |
| `NOMINATIM_URL` | Nominatim API URL | https://nominatim.openstreetmap.org |
| `OSRM_URL` | OSRM API URL | https://router.project-osrm.org |

## 🧪 Testing

```bash
# Run all tests
go test ./...

# With coverage
go test -cover ./...

# Specific package
go test ./internal/matchmaking/...
```

## 📝 Demo Credentials

```
Phone: +919876543210
Password: password123
OTP: 123456 (demo mode)
```

## 🔒 Security Notes

- Change `JWT_SECRET` in production
- Use HTTPS for all external communication
- Rate limiting is implemented for geocoding APIs
- Consider Redis for session management at scale

## 📄 License

MIT License - Use freely for learning and commercial projects.
