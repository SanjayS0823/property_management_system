from sqlalchemy.orm import Session
from datetime import date, timedelta
from fastapi import HTTPException, status

from ..models.lease import Lease, LeaseStatus
from ..models.unit import Unit, OccupancyStatus
from ..models.property import Property
from ..models.user import User, UserRole
from ..schemas.lease import LeaseCreate


def create_lease(db: Session, data: LeaseCreate, user: User) -> Lease:
    if user.role == UserRole.TENANT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    unit = db.query(Unit).filter(Unit.id == data.unit_id).first()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")

    # Check for conflicting active leases on this unit
    active_lease = db.query(Lease).filter(
        Lease.unit_id == data.unit_id,
        Lease.status == LeaseStatus.ACTIVE,
    ).first()
    if active_lease:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This unit already has an active lease",
        )

    tenant = db.query(User).filter(User.id == data.tenant_id, User.role == UserRole.TENANT).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid tenant")

    # Check access to the property
    prop = db.query(Property).filter(Property.id == unit.property_id).first()
    if user.role == UserRole.LANDLORD and prop.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    lease = Lease(
        tenant_id=data.tenant_id,
        unit_id=data.unit_id,
        start_date=data.start_date,
        end_date=data.end_date,
        monthly_rent=data.monthly_rent,
        security_deposit=data.security_deposit,
    )
    db.add(lease)
    db.commit()
    db.refresh(lease)
    return lease


def get_leases(db: Session, user: User, skip: int = 0, limit: int = 100):
    query = db.query(Lease)
    if user.role == UserRole.TENANT:
        query = query.filter(Lease.tenant_id == user.id)
    elif user.role == UserRole.LANDLORD:
        query.join(Unit).join(Property).filter(Property.owner_id == user.id)
    elif user.role == UserRole.PROPERTY_MANAGER:
        query.join(Unit).join(Property).filter(
            (Property.owner_id == user.id) | (Property.property_manager_id == user.id)
        )
    return query.offset(skip).limit(limit).all()


def get_lease(db: Session, lease_id: int, user: User) -> Lease:
    lease = db.query(Lease).filter(Lease.id == lease_id).first()
    if not lease:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lease not found")

    if user.role == UserRole.TENANT and lease.tenant_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if user.role == UserRole.LANDLORD:
        unit = db.query(Unit).filter(Unit.id == lease.unit_id).first()
        prop = db.query(Property).filter(Property.id == unit.property_id).first()
        if prop.owner_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return lease


def update_lease(db: Session, lease_id: int, data, user: User) -> Lease:
    lease = get_lease(db, lease_id, user)
    if user.role == UserRole.TENANT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(lease, key, value)
    db.commit()
    db.refresh(lease)
    return lease


def renew_lease(db: Session, lease_id: int, user: User, new_end_date: date = None) -> Lease:
    lease = get_lease(db, lease_id, user)
    if user.role == UserRole.TENANT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if not new_end_date:
        new_end_date = lease.end_date + timedelta(days=365)

    if new_end_date <= lease.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New end date must be after current end date",
        )

    lease.status = LeaseStatus.RENEWED
    db.commit()

    new_lease = Lease(
        tenant_id=lease.tenant_id,
        unit_id=lease.unit_id,
        start_date=lease.end_date,
        end_date=new_end_date,
        monthly_rent=lease.monthly_rent,
        security_deposit=lease.security_deposit,
    )
    db.add(new_lease)
    db.commit()
    db.refresh(new_lease)
    return new_lease
