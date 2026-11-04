"""Auth router — registration, login, and password recovery endpoints."""

import hashlib
import os
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from agents.email_sender import send_email
from database import get_db
import models
import schemas
import auth as auth_utils

router = APIRouter(prefix="/auth", tags=["Authentication"])
PASSWORD_RESET_EXPIRE_MINUTES = int(os.getenv("PASSWORD_RESET_EXPIRE_MINUTES", "60"))


def _hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _reset_email_sender() -> str:
    return (os.getenv("SENDER_EMAIL") or os.getenv("GMAIL_ADDRESS") or "").strip()


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


@router.post("/forgot-password")
def forgot_password(
    payload: schemas.PasswordResetRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Send a password reset link when the email belongs to an active account."""
    generic_message = (
        "If an account exists for that email, a password reset link has been sent."
    )
    user = (
        db.query(models.User)
        .filter(models.User.email == payload.email, models.User.is_active.is_(True))
        .first()
    )
    if not user:
        return {"status": "ok", "message": generic_message}

    raw_token = secrets.token_urlsafe(32)
    reset_token = models.PasswordResetToken(
        user_id=user.id,
        token_hash=_hash_reset_token(raw_token),
        expires_at=datetime.utcnow() + timedelta(minutes=PASSWORD_RESET_EXPIRE_MINUTES),
    )
    db.add(reset_token)
    db.commit()

    frontend_url = (
        request.headers.get("origin")
        or os.getenv("FRONTEND_URL")
        or "http://localhost:3000"
    ).rstrip("/")
    reset_link = f"{frontend_url}/reset-password?token={raw_token}"
    sender = _reset_email_sender()
    if not sender:
        db.delete(reset_token)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Password reset email is not configured on the server.",
        )

    sent, message = send_email(
        sender,
        user.email,
        "Reset your MeetingGhost password",
        (
            f"Hello {user.full_name},\n\n"
            "We received a request to reset your MeetingGhost password. "
            f"This link expires in {PASSWORD_RESET_EXPIRE_MINUTES} minutes and can be used once:\n\n"
            f"{reset_link}\n\n"
            "If you did not request this, you can safely ignore this email."
        ),
    )
    if not sent:
        db.delete(reset_token)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not send the password reset email: {message}",
        )

    return {"status": "ok", "message": generic_message}


@router.post("/reset-password")
def reset_password(payload: schemas.PasswordResetConfirm, db: Session = Depends(get_db)):
    """Set a new password using a valid, unexpired, single-use token."""
    reset_token = (
        db.query(models.PasswordResetToken)
        .filter(
            models.PasswordResetToken.token_hash == _hash_reset_token(payload.token),
            models.PasswordResetToken.used_at.is_(None),
        )
        .first()
    )
    if (
        not reset_token
        or reset_token.expires_at <= datetime.utcnow()
        or not reset_token.user
        or not reset_token.user.is_active
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link is invalid or expired.",
        )

    reset_token.user.hashed_password = auth_utils.hash_password(payload.new_password)
    reset_token.used_at = datetime.utcnow()
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == reset_token.user_id,
        models.PasswordResetToken.id != reset_token.id,
        models.PasswordResetToken.used_at.is_(None),
    ).update({"used_at": datetime.utcnow()}, synchronize_session=False)
    db.commit()
    return {"status": "success", "message": "Password reset successfully. You can now sign in."}


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
