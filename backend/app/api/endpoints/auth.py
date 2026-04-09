from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import create_access_token
from app.models.models import User, ClimbingProfile
from app.api.deps import get_current_user
from datetime import datetime

router = APIRouter()

class GoogleAuthPayload(BaseModel):
    email: str
    google_id: str
    name: str
    id_token: str

@router.post("/google")
def auth_google(payload: GoogleAuthPayload, db: Session = Depends(get_db)):
    # In a real app, verify the Google token (payload.id_token)
    # For dev speed and following previous requirements, we'll use the payload info directly
    email = payload.email
    google_id = payload.google_id
    name = payload.name

    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Create new user
        user = User(
            email=email,
            google_id=google_id,
            name=name
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create initial profile
        profile = ClimbingProfile(
            user_id=user.id,
            radar_chart={"Safety": 0, "Technique": 0, "Terminology": 0, "Rope Skills": 0, "Training Science": 0}
        )
        db.add(profile)
        db.commit()

    # Generate our own JWT for the platform
    access_token = create_access_token(subject=user.id)
    
    return {
        "status": "success",
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "onboarding_completed": user.onboarding_completed
            }
        }
    }

@router.get("/refresh")
def refresh_token(current_user: User = Depends(get_current_user)):
    """
    Renew the access token for another 24 hours.
    This enables a sliding session: as long as the user is active,
    their session is extended.
    """
    new_access_token = create_access_token(subject=current_user.id)
    return {
        "status": "success",
        "data": {
            "access_token": new_access_token,
            "token_type": "bearer",
            "user": {
                "id": str(current_user.id),
                "email": current_user.email,
                "name": current_user.name,
                "onboarding_completed": current_user.onboarding_completed
            }
        }
    }

