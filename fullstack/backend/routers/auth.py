"""Auth router — register and login endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
import auth as auth_utils

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=schemas.TokenResponse, status_code=201)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    """Register a new user account."""
    # Check email already exists
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )

    user = models.User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=auth_utils.hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth_utils.create_access_token({"sub": str(user.id)})
    return schemas.TokenResponse(
        access_token=token,
        user=schemas.UserOut.model_validate(user)
    )


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    """Login and receive a JWT access token."""
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not auth_utils.verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    token = auth_utils.create_access_token({"sub": str(user.id)})
    return schemas.TokenResponse(
        access_token=token,
        user=schemas.UserOut.model_validate(user)
    )


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth_utils.get_current_user)):
    """Get the currently authenticated user's profile."""
    return current_user


@router.put("/profile", response_model=schemas.UserOut)
def update_profile(
    payload: schemas.UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """Update user's profile details."""
    # Check if email is already taken by someone else
    if payload.email != current_user.email:
        existing = db.query(models.User).filter(models.User.email == payload.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already taken by another account"
            )

    current_user.full_name = payload.full_name
    current_user.email = payload.email
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/password")
def change_password(
    payload: schemas.UserPasswordChange,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """Change user's password."""
    if not auth_utils.verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )

    current_user.hashed_password = auth_utils.hash_password(payload.new_password)
    db.commit()
    return {"status": "success", "message": "Password changed successfully"}

