from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import climbing, auth
from app.core.database import engine, Base

# Create tables (only for development/SQLite, Postgres should use Alembic)
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="Climbing Community API")

# Add CORS to allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, should be lock to frontend origin later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(climbing.router, prefix="/api/v1", tags=["Climbing"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Climbing Community API"}
