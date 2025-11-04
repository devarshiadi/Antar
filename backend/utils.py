from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from geopy.distance import geodesic
import math

# Security
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# Geolocation Utils
def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in kilometers using Haversine formula"""
    return geodesic((lat1, lon1), (lat2, lon2)).kilometers

def calculate_route_overlap(
    origin1_lat: float, origin1_lon: float,
    dest1_lat: float, dest1_lon: float,
    origin2_lat: float, origin2_lon: float,
    dest2_lat: float, dest2_lon: float
) -> dict:
    """
    Calculate route overlap between two trips
    Returns: {
        'overlap_percentage': float,
        'distance_overlap_km': float,
        'origin_distance': float,
        'dest_distance': float
    }
    """
    # Distance between origins
    origin_distance = calculate_distance(origin1_lat, origin1_lon, origin2_lat, origin2_lon)
    
    # Distance between destinations
    dest_distance = calculate_distance(dest1_lat, dest1_lon, dest2_lat, dest2_lon)
    
    # Total route distance for trip 1
    route1_distance = calculate_distance(origin1_lat, origin1_lon, dest1_lat, dest1_lon)
    
    # Total route distance for trip 2
    route2_distance = calculate_distance(origin2_lat, origin2_lon, dest2_lat, dest2_lon)
    
    # Calculate overlap score
    # If origins and destinations are close, routes likely overlap
    max_origin_threshold = 5  # 5km max distance between origins
    max_dest_threshold = 5    # 5km max distance between destinations
    
    # Normalize distances to 0-1 range
    origin_score = max(0, 1 - (origin_distance / max_origin_threshold))
    dest_score = max(0, 1 - (dest_distance / max_dest_threshold))
    
    # Combined score (0-100)
    overlap_percentage = ((origin_score + dest_score) / 2) * 100
    
    # Estimate overlap distance (simplified)
    if overlap_percentage > 60:
        distance_overlap_km = min(route1_distance, route2_distance) * (overlap_percentage / 100)
    else:
        distance_overlap_km = 0
    
    return {
        'overlap_percentage': round(overlap_percentage, 2),
        'distance_overlap_km': round(distance_overlap_km, 2),
        'origin_distance': round(origin_distance, 2),
        'dest_distance': round(dest_distance, 2)
    }

def calculate_match_score(
    route_overlap: dict,
    time_diff_minutes: int,
    user1_rating: float,
    user2_rating: float
) -> float:
    """
    Calculate overall match score (0-100)
    Factors:
    - Route overlap: 50%
    - Time difference: 25%
    - User ratings: 25%
    """
    # Route overlap score (0-50)
    route_score = (route_overlap['overlap_percentage'] / 100) * 50
    
    # Time difference score (0-25)
    # Perfect if within 15 min, decreases to 0 at 60 min
    time_score = max(0, (1 - (time_diff_minutes / 60)) * 25)
    
    # Rating score (0-25)
    avg_rating = (user1_rating + user2_rating) / 2
    rating_score = (avg_rating / 5.0) * 25
    
    total_score = route_score + time_score + rating_score
    
    return round(total_score, 2)

def parse_time_to_minutes(time_str: str) -> int:
    """Convert time string (HH:MM) to minutes since midnight"""
    try:
        hours, minutes = map(int, time_str.split(':'))
        return hours * 60 + minutes
    except:
        return 0

def generate_otp() -> str:
    """Generate a 6-digit OTP"""
    import random
    return f"{random.randint(100000, 999999)}"

# Simple in-memory OTP storage (for demo)
otp_storage = {}

def store_otp(phone_number: str, otp: str):
    """Store OTP with expiry (5 minutes)"""
    otp_storage[phone_number] = {
        'otp': otp,
        'expiry': datetime.utcnow() + timedelta(minutes=5)
    }

def verify_otp(phone_number: str, otp: str) -> bool:
    """Verify OTP"""
    if phone_number not in otp_storage:
        return False
    
    stored = otp_storage[phone_number]
    
    # Check expiry
    if datetime.utcnow() > stored['expiry']:
        del otp_storage[phone_number]
        return False
    
    # Check OTP
    if stored['otp'] == otp:
        del otp_storage[phone_number]
        return True
    
    return False
