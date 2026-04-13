from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash, verify_password, create_password_reset_token, verify_password_reset_token
from app.models.models import User, ClimbingProfile
from app.api.deps import get_current_user
from datetime import datetime

router = APIRouter()

class RegisterPayload(BaseModel):
    email: str
    password: str
    name: str

class LoginPayload(BaseModel):
    email: str
    password: str

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

@router.post("/register")
def register(payload: RegisterPayload, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )
    
    # Create new user
    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        name=payload.name
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

@router.post("/login")
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

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

@router.post("/password-reset/request")
def request_password_reset(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # We don't want to leak if a user exists or not
        return {"status": "success", "message": "If an account with that email exists, we have sent a reset link to it."}
    
    token = create_password_reset_token(email=user.email)
    
    # In a real app, send email here. For now, log and return (for testing).
    print(f"PASSWORD RESET LINK for {user.email}: http://localhost:3000/reset-password?token={token}")
    
    return {
        "status": "success",
        "message": "If an account with that email exists, we have sent a reset link to it.",
        "debug_token": token # Remove this in production
    }

@router.post("/password-reset/reset")
def reset_password(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    email = verify_password_reset_token(payload.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    
    return {"status": "success", "message": "Password has been reset successfully"}

