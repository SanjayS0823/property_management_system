from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas.property import PropertyCreate, PropertyUpdate, PropertyResponse
from ..services.property_service import (
    create_property, get_properties, get_property, update_property, get_property_with_stats
)
from ..auth.dependencies import get_current_user, require_role
from ..models.user import User, UserRole

router = APIRouter(prefix="/api/properties", tags=["Properties"])


@router.post("", response_model=dict, status_code=201)
def create(
    data: PropertyCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.LANDLORD, UserRole.PROPERTY_MANAGER)),
):
    prop = create_property(db, data, user.id)
    return get_property_with_stats(db, prop)


@router.get("", response_model=List[dict])
def list_properties(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.LANDLORD, UserRole.PROPERTY_MANAGER)),
):
    properties = get_properties(db, user)
    return [get_property_with_stats(db, p) for p in properties]


@router.get("/{property_id}", response_model=dict)
def get_one(
    property_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    prop = get_property(db, property_id, user)
    return get_property_with_stats(db, prop)


@router.put("/{property_id}", response_model=dict)
def update(
    property_id: int,
    data: PropertyUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.LANDLORD, UserRole.PROPERTY_MANAGER)),
):
    prop = update_property(db, property_id, data, user)
    return get_property_with_stats(db, prop)
