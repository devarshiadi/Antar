from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta


import models
import schemas
import utils
from database import engine, get_db

# Create database tables
# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ANTAR Ride Sharing API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_json(message)

manager = ConnectionManager()

# ==================== AUTH ENDPOINTS ====================

@app.post("/api/auth/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user exists
    existing_user = db.query(models.User).filter(models.User.phone_number == user_data.phone_number).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # Create new user
    hashed_password = utils.get_password_hash(user_data.password)
    new_user = models.User(
        phone_number=user_data.phone_number,
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role,
        is_driver=user_data.is_driver,
        license_type=user_data.license_type if user_data.is_driver else None,
        vehicle_model=user_data.vehicle_model if user_data.is_driver else None,
        vehicle_plate=user_data.vehicle_plate if user_data.is_driver else None,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate OTP (for demo, just print it)
    otp = utils.generate_otp()
    utils.store_otp(user_data.phone_number, otp)
    print(f"📱 OTP for {user_data.phone_number}: {otp}")
    
    # Create access token
    access_token = utils.create_access_token(data={"sub": user_data.phone_number})
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=schemas.Token)
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    user = db.query(models.User).filter(models.User.phone_number == user_data.phone_number).first()
    
    if not user or not utils.verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate OTP
    otp = utils.generate_otp()
    utils.store_otp(user_data.phone_number, otp)
    print(f"📱 OTP for {user_data.phone_number}: {otp}")
    
    # Create access token
    access_token = utils.create_access_token(data={"sub": user_data.phone_number})
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/verify-otp")
def verify_otp(otp_data: schemas.OTPVerify, db: Session = Depends(get_db)):
    """Verify OTP"""
    if utils.verify_otp(otp_data.phone_number, otp_data.otp_code):
        user = db.query(models.User).filter(models.User.phone_number == otp_data.phone_number).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        access_token = utils.create_access_token(data={"sub": otp_data.phone_number})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": schemas.UserResponse.from_orm(user)
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

# ==================== USER ENDPOINTS ====================

def get_current_user(token: str, db: Session = Depends(get_db)):
    """Get current user from token"""
    payload = utils.decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    phone_number = payload.get("sub")
    user = db.query(models.User).filter(models.User.phone_number == phone_number).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@app.get("/api/users/me", response_model=schemas.UserResponse)
def get_my_profile(db: Session = Depends(get_db)):
    """Get current user profile"""
    # For demo, return first user
    user = db.query(models.User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/api/users/me", response_model=schemas.UserResponse)
def update_profile(user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    """Update user profile"""
    user = db.query(models.User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_update.full_name:
        user.full_name = user_update.full_name
    if user_update.email:
        user.email = user_update.email
    if user_update.role:
        user.role = user_update.role
    if user_update.location_sharing_enabled is not None:
        user.location_sharing_enabled = user_update.location_sharing_enabled
    
    db.commit()
    db.refresh(user)
    return user

@app.post("/api/users/location")
def update_location(location: schemas.LocationUpdate, db: Session = Depends(get_db)):
    """Update user location"""
    user = db.query(models.User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user's current location
    user.current_latitude = location.latitude
    user.current_longitude = location.longitude
    user.location_updated_at = datetime.utcnow()
    
    # Store location history
    location_update = models.LocationUpdate(
        user_id=user.id,
        latitude=location.latitude,
        longitude=location.longitude,
        accuracy=location.accuracy,
        speed=location.speed,
        heading=location.heading,
        is_active_trip=location.is_active_trip
    )
    
    db.add(location_update)
    db.commit()
    
    return {"message": "Location updated successfully"}

# ==================== TRIP ENDPOINTS ====================

@app.post("/api/trips", response_model=schemas.TripResponse, status_code=status.HTTP_201_CREATED)
def create_trip(trip_data: schemas.TripCreate, db: Session = Depends(get_db)):
    """Create a new trip"""
    user = db.query(models.User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate distance
    distance = utils.calculate_distance(
        trip_data.origin_latitude, trip_data.origin_longitude,
        trip_data.destination_latitude, trip_data.destination_longitude
    )
    
    # Create trip
    new_trip = models.Trip(
        user_id=user.id,
        trip_type=trip_data.trip_type,
        origin_latitude=trip_data.origin_latitude,
        origin_longitude=trip_data.origin_longitude,
        origin_address=trip_data.origin_address,
        destination_latitude=trip_data.destination_latitude,
        destination_longitude=trip_data.destination_longitude,
        destination_address=trip_data.destination_address,
        departure_date=trip_data.departure_date,
        departure_time=trip_data.departure_time,
        seats_available=trip_data.seats_available,
        price=trip_data.price,
        distance_km=distance
    )
    
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    
    # Trigger matching algorithm
    find_and_create_matches(new_trip.id, db)
    
    return new_trip

@app.get("/api/trips/my-trips", response_model=List[schemas.TripResponse])
def get_my_trips(db: Session = Depends(get_db)):
    """Get current user's trips"""
    user = db.query(models.User).first()
    if not user:
        return []
    
    trips = db.query(models.Trip).filter(models.Trip.user_id == user.id).all()
    return trips

@app.get("/api/trips/{trip_id}", response_model=schemas.TripResponse)
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    """Get trip by ID"""
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

@app.put("/api/trips/{trip_id}", response_model=schemas.TripResponse)
def update_trip(trip_id: int, trip_update: schemas.TripUpdate, db: Session = Depends(get_db)):
    """Update trip"""
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if trip_update.status:
        trip.status = trip_update.status
    if trip_update.seats_available is not None:
        trip.seats_available = trip_update.seats_available
    if trip_update.price is not None:
        trip.price = trip_update.price
    
    trip.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(trip)
    return trip

@app.delete("/api/trips/{trip_id}")
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    """Delete/cancel trip"""
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    trip.status = models.TripStatus.CANCELLED
    db.commit()
    return {"message": "Trip cancelled successfully"}

# ==================== MATCH ENDPOINTS ====================

def find_and_create_matches(trip_id: int, db: Session):
    """Find potential matches for a trip"""
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        return
    
    # Find opposite type trips (offer matches with request)
    opposite_type = models.TripType.REQUEST if trip.trip_type == models.TripType.OFFER else models.TripType.OFFER
    
    # Get candidate trips (same day, searching status)
    candidates = db.query(models.Trip).filter(
        models.Trip.trip_type == opposite_type,
        models.Trip.status == models.TripStatus.SEARCHING,
        models.Trip.departure_date == trip.departure_date,
        models.Trip.id != trip_id
    ).all()
    
    for candidate in candidates:
        # Calculate route overlap
        overlap = utils.calculate_route_overlap(
            trip.origin_latitude, trip.origin_longitude,
            trip.destination_latitude, trip.destination_longitude,
            candidate.origin_latitude, candidate.origin_longitude,
            candidate.destination_latitude, candidate.destination_longitude
        )
        
        # Only create match if overlap is significant
        if overlap['overlap_percentage'] > 60:
            # Calculate time difference
            trip_time_minutes = utils.parse_time_to_minutes(trip.departure_time)
            candidate_time_minutes = utils.parse_time_to_minutes(candidate.departure_time)
            time_diff = abs(trip_time_minutes - candidate_time_minutes)
            
            # Calculate match score
            match_score = utils.calculate_match_score(
                overlap,
                time_diff,
                trip.user.rating,
                candidate.user.rating
            )
            
            # Create match if score is good
            if match_score > 70:
                new_match = models.Match(
                    trip_id=trip.id,
                    matched_trip_id=candidate.id,
                    match_score=match_score,
                    route_overlap_percentage=overlap['overlap_percentage'],
                    distance_overlap_km=overlap['distance_overlap_km']
                )
                db.add(new_match)
                
                # Create notification for both users
                notification1 = models.Notification(
                    user_id=trip.user_id,
                    type="match",
                    title="New Match Found!",
                    message=f"A rider is going your way with {match_score}% match",
                    related_id=new_match.id
                )
                notification2 = models.Notification(
                    user_id=candidate.user_id,
                    type="match",
                    title="New Match Found!",
                    message=f"A rider is going your way with {match_score}% match",
                    related_id=new_match.id
                )
                db.add(notification1)
                db.add(notification2)
    
    db.commit()

@app.get("/api/matches/{trip_id}", response_model=List[schemas.MatchResponse])
def get_matches_for_trip(trip_id: int, db: Session = Depends(get_db)):
    """Get available matches for a trip (excludes already accepted matches)"""
    # Get the trip
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Get all potential matches for this trip
    potential_matches = db.query(models.Match).filter(
        (models.Match.trip_id == trip_id) | (models.Match.matched_trip_id == trip_id)
    ).all()
    
    # Filter out matches where the OTHER trip is already accepted by someone else
    available_matches = []
    for match in potential_matches:
        # Determine which trip is the "other" trip
        other_trip_id = match.matched_trip_id if match.trip_id == trip_id else match.trip_id
        
        # Check if the other trip has any ACCEPTED matches
        has_accepted_match = db.query(models.Match).filter(
            ((models.Match.trip_id == other_trip_id) | (models.Match.matched_trip_id == other_trip_id)),
            models.Match.status == models.MatchStatus.ACCEPTED,
            models.Match.id != match.id  # Exclude current match
        ).first()
        
        # Only include if the other trip doesn't have accepted matches
        # OR if THIS match is the accepted one
        if not has_accepted_match or match.status == models.MatchStatus.ACCEPTED:
            available_matches.append(match)
    
    return available_matches

@app.get("/api/matches/find/{trip_id}")
def find_matches(trip_id: int, db: Session = Depends(get_db)):
    """Manually trigger match finding for a trip"""
    find_and_create_matches(trip_id, db)
    return {"message": "Match finding completed"}

@app.put("/api/matches/{match_id}", response_model=schemas.MatchResponse)
def update_match(match_id: int, match_update: schemas.MatchUpdate, db: Session = Depends(get_db)):
    """Accept or reject a match"""
    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    match.status = match_update.status
    match.updated_at = datetime.utcnow()
    
    # If accepted, update trip statuses
    if match_update.status == models.MatchStatus.ACCEPTED:
        match.trip.status = models.TripStatus.MATCHED
        match.matched_trip.status = models.TripStatus.MATCHED
    
    db.commit()
    db.refresh(match)
    return match

# ==================== MESSAGE/CHAT ENDPOINTS ====================

@app.post("/api/chat/{trip_id}/message", response_model=schemas.MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(trip_id: int, message_data: schemas.MessageCreate, db: Session = Depends(get_db)):
    """Send a message"""
    user = db.query(models.User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_message = models.Message(
        sender_id=user.id,
        receiver_id=message_data.receiver_id,
        trip_id=trip_id,
        content=message_data.content
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return new_message

@app.get("/api/chat/{trip_id}/history", response_model=List[schemas.MessageResponse])
def get_chat_history(trip_id: int, db: Session = Depends(get_db)):
    """Get chat history for a trip"""
    messages = db.query(models.Message).filter(models.Message.trip_id == trip_id).order_by(models.Message.created_at).all()
    return messages

# ==================== NOTIFICATION ENDPOINTS ====================

@app.get("/api/notifications", response_model=List[schemas.NotificationResponse])
def get_notifications(db: Session = Depends(get_db)):
    """Get user notifications"""
    user = db.query(models.User).first()
    if not user:
        return []
    
    notifications = db.query(models.Notification).filter(
        models.Notification.user_id == user.id
    ).order_by(models.Notification.created_at.desc()).all()
    return notifications

@app.put("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    """Mark notification as read"""
    notification = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.read = True
    db.commit()
    return {"message": "Notification marked as read"}

# ==================== WEBSOCKET ====================

@app.websocket("/ws/location/{user_id}")
async def websocket_location(websocket: WebSocket, user_id: int):
    """WebSocket for real-time location updates"""
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            # Broadcast location to relevant users
            await manager.broadcast({
                "type": "location_update",
                "user_id": user_id,
                "data": data
            })
    except WebSocketDisconnect:
        manager.disconnect(user_id)

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "ANTAR Ride Sharing API",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
