from sqlalchemy import Boolean, Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

class UserRole(str, enum.Enum):
    RIDER = "rider"
    PASSENGER = "passenger"
    BOTH = "both"

class TripType(str, enum.Enum):
    OFFER = "offer"
    REQUEST = "request"

class TripStatus(str, enum.Enum):
    SEARCHING = "searching"
    MATCHED = "matched"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class MatchStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.BOTH)
    is_driver = Column(Boolean, default=False)
    avatar_url = Column(String, nullable=True)
    rating = Column(Float, default=5.0)
    trips_completed = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Driver specific fields
    license_type = Column(String, nullable=True)
    vehicle_model = Column(String, nullable=True)
    vehicle_plate = Column(String, nullable=True)
    vehicle_photo_url = Column(String, nullable=True)
    
    # Current location
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    location_updated_at = Column(DateTime, nullable=True)
    location_sharing_enabled = Column(Boolean, default=True)
    
    # Relationships
    trips = relationship("Trip", back_populates="user")
    location_updates = relationship("LocationUpdate", back_populates="user")
    messages_sent = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    messages_received = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    trip_type = Column(Enum(TripType), nullable=False)
    status = Column(Enum(TripStatus), default=TripStatus.SEARCHING)
    
    # Route details
    origin_latitude = Column(Float, nullable=False)
    origin_longitude = Column(Float, nullable=False)
    origin_address = Column(String, nullable=False)
    
    destination_latitude = Column(Float, nullable=False)
    destination_longitude = Column(Float, nullable=False)
    destination_address = Column(String, nullable=False)
    
    # Trip details
    departure_date = Column(String, nullable=False)
    departure_time = Column(String, nullable=False)
    seats_available = Column(Integer, nullable=True)  # For riders
    price = Column(Float, nullable=False)
    distance_km = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="trips")
    matches = relationship("Match", foreign_keys="Match.trip_id", back_populates="trip")
    matched_with = relationship("Match", foreign_keys="Match.matched_trip_id", back_populates="matched_trip")

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    matched_trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    
    match_score = Column(Float, nullable=False)  # 0-100
    route_overlap_percentage = Column(Float, nullable=False)
    distance_overlap_km = Column(Float, nullable=False)
    
    status = Column(Enum(MatchStatus), default=MatchStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    trip = relationship("Trip", foreign_keys=[trip_id], back_populates="matches")
    matched_trip = relationship("Trip", foreign_keys=[matched_trip_id], back_populates="matched_with")

class LocationUpdate(Base):
    __tablename__ = "location_updates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=True)
    speed = Column(Float, nullable=True)
    heading = Column(Float, nullable=True)
    
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_active_trip = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="location_updates")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    
    content = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="messages_sent")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="messages_received")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    type = Column(String, nullable=False)  # match, trip, message, alert, achievement
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    
    related_id = Column(Integer, nullable=True)  # ID of related trip/match/message
    
    created_at = Column(DateTime, default=datetime.utcnow)
