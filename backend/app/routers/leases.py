from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from ..database import get_db
from ..schemas.lease import LeaseCreate, LeaseUpdate, LeaseResponse
from ..services.lease_service import create_lease, get_leases, get_lease, update_lease, renew_lease
from ..auth.dependencies import get_current_user, require_role
from ..models.user import User, UserRole


def enrich_lease(db: Session, lease) -> dict:
    from ..models.unit import Unit
    from ..models.property import Property
    unit = db.query(Unit).filter(Unit.id == lease.unit_id).first()
    prop = db.query(Property).filter(Property.id == unit.property_id).first() if unit else None
    tenant = db.query(User).filter(User.id == lease.tenant_id).first()
    return {
        "id": lease.id,
        "tenant_id": lease.tenant_id,
        "unit_id": lease.unit_id,
        "start_date": lease.start_date,
        "end_date": lease.end_date,
        "monthly_rent": lease.monthly_rent,
        "security_deposit": lease.security_deposit,
        "status": lease.status,
        "lease_document_path": lease.lease_document_path,
        "created_at": lease.created_at,
        "updated_at": lease.updated_at,
        "tenant_name": tenant.full_name if tenant else None,
        "unit_number": unit.unit_number if unit else None,
        "property_name": prop.name if prop else None,
        "property_id": unit.property_id if unit else None,
    }


router = APIRouter(prefix="/api/leases", tags=["Leases"])


@router.post("", response_model=dict, status_code=201)
def create(
    data: LeaseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.LANDLORD, UserRole.PROPERTY_MANAGER)),
):
    lease = create_lease(db, data, user)
    return enrich_lease(db, lease)


@router.get("", response_model=List[dict])
def list_leases(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    leases = get_leases(db, user)
    return [enrich_lease(db, l) for l in leases]


@router.get("/{lease_id}", response_model=dict)
def get_one(
    lease_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    lease = get_lease(db, lease_id, user)
    return enrich_lease(db, lease)


@router.put("/{lease_id}", response_model=dict)
def update(
    lease_id: int,
    data: LeaseUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.LANDLORD, UserRole.PROPERTY_MANAGER)),
):
    lease = update_lease(db, lease_id, data, user)
    return enrich_lease(db, lease)


@router.post("/{lease_id}/renew", response_model=dict)
def renew(
    lease_id: int,
    body: dict = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.LANDLORD, UserRole.PROPERTY_MANAGER)),
):
    new_end_date = None
    if body and "new_end_date" in body:
        new_end_date = date.fromisoformat(body["new_end_date"])
    lease = renew_lease(db, lease_id, user, new_end_date)
    return enrich_lease(db, lease)
