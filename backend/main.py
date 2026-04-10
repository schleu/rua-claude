from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, obstacles, places, routes, reviews, upload

app = FastAPI(
    title="Acessibilidade Urbana API",
    description="API para visualização de rotas acessíveis e avaliação de locais",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(obstacles.router, prefix="/api/obstacles", tags=["obstacles"])
app.include_router(places.router, prefix="/api/places", tags=["places"])
app.include_router(routes.router, prefix="/api/routes", tags=["routes"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["reviews"])
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])


@app.get("/")
def root():
    return {"status": "ok", "message": "Acessibilidade Urbana API"}


@app.get("/health")
def health():
    return {"status": "healthy"}
