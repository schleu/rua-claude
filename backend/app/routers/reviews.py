from fastapi import APIRouter, Depends, HTTPException
from app.schemas import ReviewCreate
from app.database import get_supabase
from app.dependencies import get_current_user

router = APIRouter()


@router.get("/place/{place_id}")
async def get_place_reviews(place_id: str):
    sb = get_supabase()
    if sb is None:
        return {"data": []}

    result = sb.table("reviews").select("*").eq("place_id", place_id).order("created_at", desc=True).execute()
    return {"data": result.data}


@router.post("/", status_code=201)
async def create_review(data: ReviewCreate, user=Depends(get_current_user)):
    sb = get_supabase()
    if sb is None:
        raise HTTPException(503, "Banco não configurado")

    avg = (data.rating_ramp + data.rating_bathroom + data.rating_parking + data.rating_tactile_floor) / 4

    row = {
        "place_id": data.place_id,
        "user_id": user["id"],
        "rating_ramp": data.rating_ramp,
        "rating_bathroom": data.rating_bathroom,
        "rating_parking": data.rating_parking,
        "rating_tactile_floor": data.rating_tactile_floor,
        "avg_rating": round(avg, 2),
        "comment": data.comment,
        "photo_url": data.photo_url,
    }
    result = sb.table("reviews").insert(row).execute()
    return result.data[0]
