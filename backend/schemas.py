from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import UserRole, TripType, TripStatus, MatchStatus

# User Schemas
class UserCreate(BaseModel):
    phone_number: str
    full_name: str
    email: Optional[EmailStr] = None
    password: str
    role: UserRole = UserRole.BOTH
    is_driver: bool = False
    license_type: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_plate: Optional[str] = None

class UserLogin(BaseModel):
    phone_number: str
    password: str

class UserResponse(BaseModel):
    id: int
    phone_number: str
    full_name: str
    email: Optional[str]
    role: UserRole
    is_driver: bool
    avatar_url: Optional[str]
    rating: float
    trips_completed: int
    license_type: Optional[str]
    vehicle_model: Optional[str]
    vehicle_plate: Optional[str]
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    location_sharing_enabled: Optional[bool] = None

# Location Schemas
class LocationUpdate(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    speed: Optional[float] = None
    heading: Optional[float] = None
    is_active_trip: bool = False

# Trip Schemas
class TripCreate(BaseModel):
    trip_type: TripType
    origin_latitude: float
    origin_longitude: float
    origin_address: str
    destination_latitude: float
    destination_longitude: float
    destination_address: str
    departure_date: str
    departure_time: str
    seats_available: Optional[int] = None
    price: float

class TripResponse(BaseModel):
    id: int
    user_id: int
    trip_type: TripType
    status: TripStatus
    origin_latitude: float
    origin_longitude: float
    origin_address: str
    destination_latitude: float
    destination_longitude: float
    destination_address: str
    departure_date: str
    departure_time: str
    seats_available: Optional[int]
    price: float
    distance_km: Optional[float]
    created_at: datetime
    user: UserResponse
    
    class Config:
        from_attributes = True

class TripUpdate(BaseModel):
    status: Optional[TripStatus] = None
    seats_available: Optional[int] = None
    price: Optional[float] = None

# Match Schemas
class MatchResponse(BaseModel):
    id: int
    trip_id: int
    matched_trip_id: int
    match_score: float
    route_overlap_percentage: float
    distance_overlap_km: float
    status: MatchStatus
    created_at: datetime
    trip: TripResponse
    matched_trip: TripResponse
    
    class Config:
        from_attributes = True

class MatchUpdate(BaseModel):
    status: MatchStatus

# Message Schemas
class MessageCreate(BaseModel):
    receiver_id: int
    trip_id: Optional[int] = None
    content: str

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    trip_id: Optional[int]
    content: str
    read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    message: str
    read: bool
    related_id: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    phone_number: Optional[str] = None

# OTP Verification
class OTPVerify(BaseModel):
    phone_number: str
    otp_code: str
