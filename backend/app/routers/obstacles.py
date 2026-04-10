from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.schemas import ObstacleCreate, ObstacleOut
from app.database import get_supabase
from app.dependencies import get_current_user, get_optional_user

router = APIRouter()


@router.get("/")
async def list_obstacles(
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    radius_km: float = Query(5.0),
    resolved: bool = Query(False),
    _user=Depends(get_optional_user),
):
    sb = get_supabase()
    if sb is None:
        return {"data": [], "message": "Demo mode — configure Supabase"}

    query = sb.table("obstacles").select("*").eq("resolved", resolved)
    result = query.execute()
    return {"data": result.data}


@router.post("/", status_code=201)
async def create_obstacle(
    data: ObstacleCreate,
    user=Depends(get_current_user),
):
    sb = get_supabase()
    if sb is None:
        raise HTTPException(503, "Banco de dados não configurado")

    row = {
        "user_id": user["id"],
        "latitude": data.latitude,
        "longitude": data.longitude,
        "type": data.type.value,
        "description": data.description,
        "photo_url": data.photo_url,
        "confirmations": 0,
        "resolved": False,
    }
    result = sb.table("obstacles").insert(row).execute()
    return result.data[0]


@router.post("/{obstacle_id}/confirm")
async def confirm_obstacle(
    obstacle_id: str,
    user=Depends(get_current_user),
):
    sb = get_supabase()
    if sb is None:
        raise HTTPException(503, "Banco não configurado")

    existing = sb.table("obstacles").select("confirmations").eq("id", obstacle_id).single().execute()
    new_count = (existing.data.get("confirmations") or 0) + 1
    result = sb.table("obstacles").update({"confirmations": new_count}).eq("id", obstacle_id).execute()
    return result.data[0]


@router.patch("/{obstacle_id}/resolve")
async def resolve_obstacle(
    obstacle_id: str,
    user=Depends(get_current_user),
):
    sb = get_supabase()
    if sb is None:
        raise HTTPException(503, "Banco não configurado")

    result = sb.table("obstacles").update({"resolved": True}).eq("id", obstacle_id).execute()
    return result.data[0]
