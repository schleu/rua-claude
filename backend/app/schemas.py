from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum


# ── Auth ──────────────────────────────────────────────
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    mobility_type: Optional[str] = None  # wheelchair, cane, walker, low_vision, full


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


# ── Obstacles ─────────────────────────────────────────
class ObstacleType(str, Enum):
    hole = "hole"
    uneven = "uneven"
    construction = "construction"
    pole = "pole"
    step = "step"
    no_ramp = "no_ramp"
    other = "other"


class ObstacleCreate(BaseModel):
    latitude: float
    longitude: float
    type: ObstacleType
    description: Optional[str] = None
    photo_url: Optional[str] = None


class ObstacleOut(BaseModel):
    id: str
    latitude: float
    longitude: float
    type: str
    description: Optional[str]
    photo_url: Optional[str]
    confirmations: int
    resolved: bool
    created_at: datetime
    user_id: str


# ── Places ────────────────────────────────────────────
class PlaceCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    category: Optional[str] = None  # commerce, health, education, transport


class PlaceOut(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    address: Optional[str]
    category: Optional[str]
    avg_rating: Optional[float]
    review_count: int


# ── Reviews ───────────────────────────────────────────
class ReviewCreate(BaseModel):
    place_id: str
    rating_ramp: int          # 1-5
    rating_bathroom: int      # 1-5
    rating_parking: int       # 1-5
    rating_tactile_floor: int # 1-5
    comment: Optional[str] = None
    photo_url: Optional[str] = None


class ReviewOut(BaseModel):
    id: str
    place_id: str
    user_id: str
    rating_ramp: int
    rating_bathroom: int
    rating_parking: int
    rating_tactile_floor: int
    avg_rating: float
    comment: Optional[str]
    photo_url: Optional[str]
    created_at: datetime
