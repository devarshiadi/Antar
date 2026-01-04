# 📍 Antar Location Service

Standalone location microservice using free OpenStreetMap APIs.

## 🚀 Deploy to HuggingFace Spaces

1. Create a new HuggingFace Space with **Docker** SDK
2. Upload this folder
3. Set `JWT_SECRET` (same as auth-service)

**No database needed!** Uses external free APIs.

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check |
| GET | `/api/geocode/search?q=place` | No | Search places |
| GET | `/api/geocode/reverse?lat=X&lng=Y` | No | Get address |
| GET | `/api/route?from_lat=...` | No | Calculate route |
| POST | `/api/location/update` | Yes | Update location |
| GET | `/api/location/live/:rideId` | Yes | Get live location |
| WS | `/ws/location/:rideId` | No | Real-time updates |

## 🌍 Free APIs Used

| Service | URL | Rate Limit |
|---------|-----|------------|
| Nominatim | nominatim.openstreetmap.org | 1 req/sec |
| OSRM | router.project-osrm.org | Fair use |

## 🧪 Test Locally

```bash
docker build -t antar-location .
docker run -p 7860:7860 antar-location
```

## Example Requests

```bash
# Search for a place
curl "http://localhost:7860/api/geocode/search?q=Delhi"

# Get route
curl "http://localhost:7860/api/route?from_lat=28.6&from_lng=77.2&to_lat=28.5&to_lng=77.1"
```

## 🔧 Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (7860) |
| `JWT_SECRET` | JWT secret |
| `NOMINATIM_URL` | Nominatim API URL |
| `OSRM_URL` | OSRM routing URL |
