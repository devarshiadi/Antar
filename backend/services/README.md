# 🚀 Antar Backend Services

This folder contains **standalone microservices** that can be deployed individually to **HuggingFace Spaces**.

## 📁 Folder Structure

```
services/
├── auth-service/           # 🔐 Authentication & Users
│   ├── Dockerfile          # Ready for HuggingFace
│   ├── go.mod
│   ├── main.go             # Complete service
│   └── README.md
│
├── matchmaking-service/    # 🚗 Rides & Matching
│   ├── Dockerfile
│   ├── go.mod
│   ├── main.go
│   └── README.md
│
├── chat-service/           # 💬 Real-time Chat
│   ├── Dockerfile
│   ├── go.mod
│   ├── main.go
│   └── README.md
│
└── location-service/       # 📍 Geocoding & Location
    ├── Dockerfile
    ├── go.mod
    ├── main.go
    └── README.md
```

## 🎯 Deployment Order

Deploy in this order to set up dependencies correctly:

### Step 1: Auth Service (No Dependencies)
```
1. Create HuggingFace Space (Docker SDK)
2. Drag-drop auth-service folder contents
3. Set JWT_SECRET in Space Settings
4. Note the Space URL (e.g., https://username-auth.hf.space)
```

### Step 2: Location Service (No Dependencies)
```
1. Create new Space (Docker SDK)
2. Upload location-service folder
3. Set JWT_SECRET (same as auth)
4. Uses free Nominatim/OSRM APIs
```

### Step 3: Chat Service (Depends on Auth JWT)
```
1. Create new Space (Docker SDK)
2. Upload chat-service folder
3. Set JWT_SECRET (same as auth)
```

### Step 4: Matchmaking Service (Depends on Auth)
```
1. Create new Space (Docker SDK)
2. Upload matchmaking-service folder
3. Set:
   - JWT_SECRET (same as auth)
   - AUTH_SERVICE_URL (auth service URL)
```

## 🔧 Environment Variables

| Service | Variable | Required |
|---------|----------|----------|
| All | `JWT_SECRET` | Yes - Must be same across all services |
| All | `PORT` | No - Default 7860 (HuggingFace) |
| Matchmaking | `AUTH_SERVICE_URL` | Yes - Auth service URL |
| Location | `NOMINATIM_URL` | No - Default OSM |
| Location | `OSRM_URL` | No - Default OSRM |

## 📱 Frontend Integration

Update `services/api.js` in your React Native app:

```javascript
// Set these to your HuggingFace Space URLs
const AUTH_URL = 'https://your-auth.hf.space';
const MATCHMAKING_URL = 'https://your-matchmaking.hf.space';
const CHAT_URL = 'https://your-chat.hf.space';
const LOCATION_URL = 'https://your-location.hf.space';
```

## 🧪 Local Testing

Each service can be tested locally:

```bash
cd auth-service
go run main.go
# Visit http://localhost:7860/health
```

Or with Docker:
```bash
docker build -t antar-auth .
docker run -p 7860:7860 antar-auth
```

## 📡 API Quick Reference

### Auth Service (:7860)
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/verify-otp` (demo: 123456)
- POST `/api/users/switch-role`
- GET `/api/users/me`

### Matchmaking Service (:7860)
- POST `/api/rides`
- GET `/api/rides`
- POST `/api/rides/:id/request`
- WS `/ws/rides`

### Chat Service (:7860)
- GET `/api/chat/threads`
- POST `/api/chat/threads/:id/messages`
- WS `/ws/chat`

### Location Service (:7860)
- GET `/api/geocode/search?q=place`
- GET `/api/geocode/reverse`
- GET `/api/route`
- WS `/ws/location/:rideId`

## ⚠️ HuggingFace Free Tier Notes

- **Cold Starts**: Free tier spaces sleep after inactivity
- **WebSockets**: Reconnection logic needed in frontend
- **Storage**: SQLite data persists within container
- **Rate Limits**: Respect Nominatim 1 req/sec limit

## 🔒 Security Reminder

Change `JWT_SECRET` to a strong random string in production!
