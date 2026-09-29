from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas.maintenance import MaintenanceCreate, MaintenanceUpdate, MaintenanceResponse
from ..services.maintenance_service import (
    create_maintenance_request, get_maintenance_requests, get_maintenance_request, update_maintenance_request
)
from ..auth.dependencies import get_current_user, require_role
from ..models.user import User, UserRole


def enrich_maintenance(db: Session, req) -> dict:
    from ..models.unit import Unit
    from ..models.property import Property
    unit = db.query(Unit).filter(Unit.id == req.unit_id).first()
    prop = db.query(Property).filter(Property.id == req.property_id).first() if req.property_id else None
    tenant = db.query(User).filter(User.id == req.tenant_id).first()
    return {
        "id": req.id,
        "title": req.title,
        "description": req.description,
        "priority": req.priority,
        "status": req.status,
        "tenant_id": req.tenant_id,
        "unit_id": req.unit_id,
        "property_id": req.property_id,
        "created_at": req.created_at,
        "updated_at": req.updated_at,
        "tenant_name": tenant.full_name if tenant else None,
        "unit_number": unit.unit_number if unit else None,
        "property_name": prop.name if prop else None,
    }


router = APIRouter(prefix="/api/maintenance", tags=["Maintenance"])


@router.post("", response_model=dict, status_code=201)
def create(
    data: MaintenanceCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.TENANT)),
):
    req = create_maintenance_request(db, data, user)
    return enrich_maintenance(db, req)


@router.get("", response_model=List[dict])
def list_requests(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    requests = get_maintenance_requests(db, user)
    return [enrich_maintenance(db, r) for r in requests]


@router.get("/{request_id}", response_model=dict)
def get_one(
    request_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    req = get_maintenance_request(db, request_id, user)
    return enrich_maintenance(db, req)


@router.patch("/{request_id}/status", response_model=dict)
def update_status(
    request_id: int,
    data: MaintenanceUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.LANDLORD, UserRole.PROPERTY_MANAGER)),
):
    req = update_maintenance_request(db, request_id, data, user)
    return enrich_maintenance(db, req)
