from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.database import get_supabase
from app.dependencies import get_current_user
import uuid

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_MB = 5


@router.post("/photo")
async def upload_photo(
    file: UploadFile = File(...),
    bucket: str = "photos",
    user=Depends(get_current_user),
):
    """Upload de foto para o Supabase Storage. Retorna URL pública."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"Tipo de arquivo não permitido: {file.content_type}")

    content = await file.read()
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"Arquivo muito grande. Máximo: {MAX_SIZE_MB}MB")

    sb = get_supabase()
    if sb is None:
        raise HTTPException(503, "Storage não configurado")

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"

    try:
        sb.storage.from_(bucket).upload(
            filename,
            content,
            {"content-type": file.content_type},
        )
        public_url = sb.storage.from_(bucket).get_public_url(filename)
        return {"url": public_url, "filename": filename}
    except Exception as e:
        raise HTTPException(500, f"Erro no upload: {str(e)}")
