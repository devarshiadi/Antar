# ANTAR Backend API

FastAPI backend for ANTAR ride-sharing application.

## Features

- ✅ User Authentication (JWT)
- ✅ OTP Verification (Demo mode - prints to console)
- ✅ Trip Creation & Management
- ✅ Intelligent Route Matching Algorithm
- ✅ Real-time Location Tracking
- ✅ Chat/Messaging System
- ✅ Notifications
- ✅ WebSocket Support
- ✅ SQLite Database (Demo friendly)

## Setup

1. **Install Dependencies**
```bash
cd backend
pip install -r requirements.txt
```

2. **Run Server**
```bash
python main.py
```

Or using uvicorn:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

3. **Access API Documentation**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-otp` - Verify OTP code

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update profile
- `POST /api/users/location` - Update location

### Trips
- `POST /api/trips` - Create new trip
- `GET /api/trips/my-trips` - Get user's trips
- `GET /api/trips/{trip_id}` - Get trip details
- `PUT /api/trips/{trip_id}` - Update trip
- `DELETE /api/trips/{trip_id}` - Cancel trip

### Matches
- `GET /api/matches/{trip_id}` - Get matches for trip
- `GET /api/matches/find/{trip_id}` - Trigger matching
- `PUT /api/matches/{match_id}` - Accept/reject match

### Chat
- `POST /api/chat/{trip_id}/message` - Send message
- `GET /api/chat/{trip_id}/history` - Get chat history

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/{notification_id}/read` - Mark as read

### WebSocket
- `WS /ws/location/{user_id}` - Real-time location updates

## Demo Mode

### OTP Verification
When you register or login, the OTP will be printed in the console:
```
📱 OTP for +919876543210: 123456
```

For testing, use OTP: **123456**

### Database
SQLite database file: `antar.db` (auto-created on first run)

## Route Matching Algorithm

The matching algorithm considers:
1. **Route Overlap (50%)** - How much routes overlap
2. **Time Difference (25%)** - Departure time proximity
3. **User Ratings (25%)** - Combined user ratings

**Minimum Match Score**: 70/100  
**Minimum Route Overlap**: 60%

## React Native Integration

### Installation
```bash
cd ../
npm install axios
```

### Example Usage
```javascript
import axios from 'axios';

const API_URL = 'http://localhost:8000';

// Register
const register = async () => {
  const response = await axios.post(`${API_URL}/api/auth/register`, {
    phone_number: '+919876543210',
    full_name: 'John Doe',
    password: 'password123',
    role: 'both',
    is_driver: true
  });
  return response.data;
};

// Create Trip
const createTrip = async (token) => {
  const response = await axios.post(
    `${API_URL}/api/trips`,
    {
      trip_type: 'offer',
      origin_latitude: 12.9716,
      origin_longitude: 77.5946,
      origin_address: 'MG Road, Bangalore',
      destination_latitude: 12.9698,
      destination_longitude: 77.7499,
      destination_address: 'Whitefield, Bangalore',
      departure_date: '2024-11-05',
      departure_time: '09:00',
      seats_available: 2,
      price: 100
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};
```

## Testing

```bash
# Test registration
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+919876543210",
    "full_name": "Test User",
    "password": "password123",
    "role": "both",
    "is_driver": true
  }'

# Get all trips
curl http://localhost:8000/api/trips/my-trips
```

## Production Deployment

For production:
1. Replace SQLite with PostgreSQL + PostGIS
2. Add Redis for caching & real-time data
3. Implement real SMS gateway for OTP
4. Add proper authentication middleware
5. Enable HTTPS
6. Set environment variables for secrets
7. Add rate limiting
8. Implement proper logging

## License

MIT
