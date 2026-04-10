from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.schemas import PlaceCreate
from app.database import get_supabase
from app.dependencies import get_current_user, get_optional_user

router = APIRouter()


@router.get("/")
async def list_places(
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    category: Optional[str] = Query(None),
    _user=Depends(get_optional_user),
):
    sb = get_supabase()
    if sb is None:
        return {"data": [], "message": "Demo mode"}

    query = sb.table("places").select("*, reviews(rating_ramp, rating_bathroom, rating_parking, rating_tactile_floor)")
    if category:
        query = query.eq("category", category)
    result = query.execute()
    return {"data": result.data}


@router.get("/{place_id}")
async def get_place(place_id: str, _user=Depends(get_optional_user)):
    sb = get_supabase()
    if sb is None:
        raise HTTPException(503, "Banco não configurado")

    result = sb.table("places").select("*, reviews(*)").eq("id", place_id).single().execute()
    return result.data


@router.post("/", status_code=201)
async def create_place(data: PlaceCreate, user=Depends(get_current_user)):
    sb = get_supabase()
    if sb is None:
        raise HTTPException(503, "Banco não configurado")

    row = {
        "name": data.name,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "address": data.address,
        "category": data.category,
        "created_by": user["id"],
    }
    result = sb.table("places").insert(row).execute()
    return result.data[0]
