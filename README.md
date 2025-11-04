# 🚗 ANTAR - Local Ride Sharing Platform

**ANTAR** is a ride-sharing mobile application built with React Native (Expo) and FastAPI backend. It connects local riders and passengers going the same route, helping reduce costs and carbon footprint - similar to BlaBlaCar but focused on local commutes.

## ✨ Features

### User Features
- 🔐 **Phone-based Authentication** with OTP verification
- 👤 **Dual Role System** - Be a rider, passenger, or both
- 📍 **Real-time Location Sharing** - Share and track locations during trips
- 🎯 **Intelligent Route Matching** - AI-powered algorithm matches users on similar routes
- 💬 **In-app Chat** - Communicate with matched users
- 🔔 **Push Notifications** - Get notified about matches, trip updates, and messages
- ⭐ **Rating System** - Rate and review your trip partners
- 📊 **Trip History** - View all past trips and statistics
- 🚨 **SOS Emergency** - Safety feature for emergencies

### Technical Features
- 🎨 **Dark Theme UI** - Modern, sleek interface
- 🚀 **Real-time Updates** - WebSocket integration for live location and chat
- 📱 **Cross-platform** - Works on iOS and Android
- 🔒 **Secure** - JWT authentication, password hashing
- 💾 **SQLite Database** - Demo-ready (easily upgradeable to PostgreSQL)
- 📡 **RESTful API** - Clean, documented API endpoints
- 🧪 **Demo Mode** - OTP printed to console for testing

## 📸 Screenshots

### Mobile App Screens
1. **Welcome/Onboarding** - Get started flow
2. **Login/Register** - Authentication screens
3. **Verification** - OTP verification
4. **Home** - Dashboard with quick actions
5. **Create Trip** - Offer or request rides
6. **Matches** - View and manage trip matches
7. **Active Trip** - Live trip tracking
8. **Chat** - In-app messaging
9. **Profile** - User profile and settings
10. **Trip History** - Past trips overview
11. **Notifications** - Notification center

## 🏗️ Architecture

### Frontend (React Native)
```
ANTAR/
├── App.js                    # Main app entry
├── navigation/
│   └── AppNavigator.js      # Navigation configuration
├── components/              # All screen components
│   ├── WelcomeScreen.js
│   ├── LoginScreen.js
│   ├── RegisterScreen.js
│   ├── VerificationScreen.js
│   ├── HomeScreen.js
│   ├── CreateTripScreen.js
│   ├── MatchesScreen.js
│   ├── ActiveTripScreen.js
│   ├── ChatScreen.js
│   ├── ProfileScreen.js
│   ├── TripHistoryScreen.js
│   └── NotificationsScreen.js
└── services/
    └── api.js               # API service layer
```

### Backend (FastAPI)
```
backend/
├── main.py                  # FastAPI application
├── models.py                # SQLAlchemy models
├── schemas.py               # Pydantic schemas
├── database.py              # Database configuration
├── utils.py                 # Utility functions
├── requirements.txt         # Python dependencies
└── README.md                # Backend documentation
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **Python** (3.8 or higher)
- **Expo CLI** (`npm install -g expo-cli`)
- **Git**

### 1. Clone the Repository
```bash
cd Downloads
cd ANTAR
```

### 2. Setup Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

Backend will run on: **http://localhost:8000**
API Docs: **http://localhost:8000/docs**

### 3. Setup Frontend

```bash
# Navigate back to root
cd ..

# Install dependencies
npm install

# Start Expo
npm start
```

### 4. Run the App

- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app for physical device

## 📱 Testing the App

### Demo Flow

1. **Onboarding**: Tap through welcome screens
2. **Register**: Create account (OTP will print in backend console)
3. **Verify**: Enter OTP `123456` (default for demo)
4. **Home**: Explore the dashboard
5. **Create Trip**: Tap "Offer a Ride" or "Find a Ride"
6. **Match**: System auto-matches similar trips
7. **Chat**: Message your matched partner
8. **Complete**: Mark trip as complete

### Demo Credentials
```
Phone: +919876543210
Password: password123
OTP: 123456 (check backend console)
```

## 🧠 Route Matching Algorithm

The intelligent matching system considers:

1. **Route Overlap (50% weight)**
   - Calculates geographical overlap between routes
   - Minimum 60% overlap required
   - Uses Haversine formula for distance calculation

2. **Time Difference (25% weight)**
   - Perfect match within 15 minutes
   - Decreases linearly up to 60 minutes

3. **User Ratings (25% weight)**
   - Combined average of both users
   - Higher-rated users get priority

**Minimum Match Score**: 70/100

### Example Match Calculation
```
Trip A: MG Road (9:00 AM) → Whitefield
Trip B: Koramangala (9:15 AM) → Whitefield

Route Overlap: 75% → 37.5 points
Time Difference: 15 min → 25 points
Ratings: 4.8 & 4.9 avg → 24.4 points

Total Score: 86.9/100 ✅ MATCH!
```

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register      # Register user
POST   /api/auth/login         # Login user
POST   /api/auth/verify-otp    # Verify OTP
```

### Users
```
GET    /api/users/me           # Get profile
PUT    /api/users/me           # Update profile
POST   /api/users/location     # Update location
```

### Trips
```
POST   /api/trips              # Create trip
GET    /api/trips/my-trips     # Get user's trips
GET    /api/trips/{id}         # Get trip details
PUT    /api/trips/{id}         # Update trip
DELETE /api/trips/{id}         # Cancel trip
```

### Matches
```
GET    /api/matches/{trip_id}        # Get matches
GET    /api/matches/find/{trip_id}   # Find matches
PUT    /api/matches/{id}             # Accept/reject
```

### Chat
```
POST   /api/chat/{trip_id}/message   # Send message
GET    /api/chat/{trip_id}/history   # Get history
```

### Notifications
```
GET    /api/notifications             # Get all
PUT    /api/notifications/{id}/read   # Mark read
```

### WebSocket
```
WS     /ws/location/{user_id}         # Real-time location
```

## 🔧 Configuration

### Change Backend URL (for physical devices)

In `services/api.js`, update:
```javascript
// Replace with your computer's IP address
const API_URL = 'http://192.168.1.100:8000';
```

To find your IP:
- **Windows**: `ipconfig`
- **Mac/Linux**: `ifconfig` or `ip addr`

### Enable Location Services

In `app.json`, permissions are already configured:
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Allow ANTAR to access your location"
      }
    },
    "android": {
      "permissions": ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"]
    }
  }
}
```

## 🎯 Roadmap

### Phase 1 (Current - Demo)
- ✅ Basic authentication
- ✅ Trip creation
- ✅ Route matching
- ✅ Chat system
- ✅ SQLite database

### Phase 2 (Production Ready)
- [ ] Real SMS/OTP gateway integration
- [ ] Google Maps integration
- [ ] Payment gateway (Razorpay/Stripe)
- [ ] PostgreSQL + PostGIS
- [ ] Redis caching
- [ ] Push notifications (FCM)
- [ ] Image upload (S3/Cloudinary)
- [ ] Advanced filters (gender, smoking, etc.)

### Phase 3 (Scale)
- [ ] Background location tracking
- [ ] Route optimization
- [ ] Carpooling for events
- [ ] Scheduled/recurring rides
- [ ] Driver verification
- [ ] Insurance integration
- [ ] Analytics dashboard

## 🛠️ Tech Stack

### Frontend
- **React Native** (Expo)
- **React Navigation** 7.x
- **Axios** - HTTP client
- **Lucide Icons** - Icon library
- **AsyncStorage** - Local storage
- **Expo Location** - GPS tracking

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM
- **Pydantic** - Data validation
- **JWT** - Authentication
- **WebSockets** - Real-time communication
- **Geopy** - Geolocation calculations
- **SQLite** - Database (demo)

## 📝 Environment Variables

Create `.env` file in backend:
```env
SECRET_KEY=your-secret-key-change-in-production
DATABASE_URL=sqlite:///./antar.db
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

## 🐛 Troubleshooting

### Backend Issues
**Port already in use**
```bash
# Kill process on port 8000
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:8000 | xargs kill -9
```

**Module not found**
```bash
pip install -r requirements.txt --force-reinstall
```

### Frontend Issues
**Metro bundler cache**
```bash
expo start --clear
```

**Dependencies conflict**
```bash
rm -rf node_modules
npm install
```

**Location not working**
- Grant location permissions in device settings
- Restart the app
- Check if location services are enabled

## 📄 License

MIT License - feel free to use for learning and commercial projects.

## 👨‍💻 Author

Built by Devendra for ANTAR Ride Sharing Platform

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check `/docs` endpoint for API documentation
- Review backend README for detailed API specs

---

**Happy Riding! 🚗💨**
