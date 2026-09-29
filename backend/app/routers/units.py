from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas.unit import UnitCreate, UnitUpdate, UnitResponse
from ..services.unit_service import create_unit, get_units, get_unit, update_unit, assign_tenant
from ..auth.dependencies import get_current_user, require_role
from ..models.user import User, UserRole

router = APIRouter(prefix="/api", tags=["Units"])


@router.post("/properties/{property_id}/units", response_model=UnitResponse, status_code=201)
def create(
    property_id: int,
    data: UnitCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.LANDLORD, UserRole.PROPERTY_MANAGER)),
):
    return create_unit(db, property_id, data, user)


@router.get("/properties/{property_id}/units", response_model=List[UnitResponse])
def list_units(
    property_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return get_units(db, property_id, user)


@router.get("/units/{unit_id}", response_model=UnitResponse)
def get_one(
    unit_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return get_unit(db, unit_id, user)


@router.put("/units/{unit_id}", response_model=UnitResponse)
def update(
    unit_id: int,
    data: UnitUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.LANDLORD, UserRole.PROPERTY_MANAGER)),
):
    return update_unit(db, unit_id, data, user)


@router.post("/units/{unit_id}/assign-tenant", response_model=UnitResponse)
def assign(
    unit_id: int,
    data: dict,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.LANDLORD, UserRole.PROPERTY_MANAGER)),
):
    return assign_tenant(db, unit_id, data.get("tenant_id"), user)
