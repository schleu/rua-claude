from fastapi import APIRouter, HTTPException, Query
import httpx

router = APIRouter()

OSRM_BASE = "https://router.project-osrm.org/route/v1/foot"


@router.get("/")
async def get_route(
    origin_lat: float = Query(...),
    origin_lng: float = Query(...),
    dest_lat: float = Query(...),
    dest_lng: float = Query(...),
):
    """Proxy para OSRM — calcula rota pedestre acessível."""
    coords = f"{origin_lng},{origin_lat};{dest_lng},{dest_lat}"
    url = f"{OSRM_BASE}/{coords}?overview=full&geometries=geojson&steps=true"

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()

            if data.get("code") != "Ok" or not data.get("routes"):
                raise HTTPException(404, "Rota não encontrada")

            route = data["routes"][0]
            return {
                "geometry": route["geometry"],
                "distance_m": route["distance"],
                "duration_s": route["duration"],
                "steps": route["legs"][0]["steps"] if route.get("legs") else [],
            }
        except httpx.TimeoutException:
            raise HTTPException(504, "Serviço de rotas indisponível")
        except httpx.HTTPStatusError as e:
            raise HTTPException(502, f"Erro no serviço de rotas: {e}")


@router.get("/geocode")
async def geocode(q: str = Query(..., min_length=3)):
    """Busca de endereço via Nominatim (OpenStreetMap)."""
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": q,
        "format": "json",
        "limit": 5,
        "addressdetails": 1,
        "countrycodes": "br",
    }
    headers = {"User-Agent": "AcessibilidadeUrbana/0.1"}

    async with httpx.AsyncClient(timeout=8) as client:
        try:
            response = await client.get(url, params=params, headers=headers)
            results = response.json()
            return [
                {
                    "display_name": r["display_name"],
                    "lat": float(r["lat"]),
                    "lng": float(r["lon"]),
                }
                for r in results
            ]
        except Exception:
            raise HTTPException(502, "Serviço de geocodificação indisponível")
