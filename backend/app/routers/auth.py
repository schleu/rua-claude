from fastapi import APIRouter, HTTPException
from app.schemas import SignUpRequest, SignInRequest
from app.database import get_supabase

router = APIRouter()


@router.post("/signup")
async def signup(data: SignUpRequest):
    sb = get_supabase()
    if sb is None:
        raise HTTPException(503, "Banco de dados não configurado")
    try:
        res = sb.auth.sign_up({
            "email": data.email,
            "password": data.password,
            "options": {
                "data": {
                    "full_name": data.full_name,
                    "mobility_type": data.mobility_type,
                }
            },
        })
        return {"user": res.user, "session": res.session}
    except Exception as e:
        raise HTTPException(400, str(e))


@router.post("/signin")
async def signin(data: SignInRequest):
    sb = get_supabase()
    if sb is None:
        raise HTTPException(503, "Banco de dados não configurado")
    try:
        res = sb.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password,
        })
        return {"user": res.user, "session": res.session}
    except Exception as e:
        raise HTTPException(401, str(e))


@router.post("/signout")
async def signout():
    sb = get_supabase()
    if sb:
        sb.auth.sign_out()
    return {"message": "Logout realizado"}
