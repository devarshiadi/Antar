# 🚗 Antar Matchmaking Service

Standalone matchmaking microservice for ride matching and request handling.

## 🚀 Deploy to HuggingFace Spaces

1. Create a new HuggingFace Space with **Docker** SDK
2. Upload this folder
3. Set environment variables:
   - `JWT_SECRET`: Same as auth-service
   - `AUTH_SERVICE_URL`: URL of your deployed auth-service

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/rides` | Create ride offer/request |
| GET | `/api/rides` | Get available rides |
| GET | `/api/rides/my-rides` | Get user's rides |
| POST | `/api/rides/:id/request` | Request to join |
| PUT | `/api/rides/:id/request/:reqId` | Accept/reject |
| POST | `/api/rides/:id/complete` | Complete ride |
| GET | `/api/matches/find/:rideId` | Find matches |
| WS | `/ws/rides?userId=X` | Real-time updates |

## 🎯 Matching Algorithm

- **Route Overlap (50%)**: How close pickup/drop points are
- **Time Match (25%)**: Departure time difference
- **Rating Bonus (25%)**: User ratings
- **Minimum Score**: 70/100

## 🧪 Test Locally

```bash
docker build -t antar-matchmaking .
docker run -p 7860:7860 -e AUTH_SERVICE_URL=http://host.docker.internal:8001 antar-matchmaking
```

## 🔧 Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 7860) |
| `JWT_SECRET` | JWT secret (same as auth) |
| `AUTH_SERVICE_URL` | Auth service URL |
| `DATABASE_PATH` | SQLite path |
