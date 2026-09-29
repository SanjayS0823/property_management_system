from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas.user import UserResponse
from ..auth.dependencies import get_current_user, require_role
from ..models.user import User, UserRole

router = APIRouter(prefix="/api/tenants", tags=["Tenants"])


@router.get("", response_model=List[UserResponse])
def list_tenants(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.LANDLORD, UserRole.PROPERTY_MANAGER)),
):
    tenants = db.query(User).filter(User.role == UserRole.TENANT).all()
    return tenants


@router.get("/{tenant_id}", response_model=UserResponse)
def get_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role == UserRole.TENANT and user.id != tenant_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")
    tenant = db.query(User).filter(User.id == tenant_id, User.role == UserRole.TENANT).first()
    if not tenant:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant
