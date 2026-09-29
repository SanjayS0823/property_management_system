from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from ..models.maintenance import MaintenanceRequest, MaintenanceStatus
from ..models.unit import Unit
from ..models.property import Property
from ..models.user import User, UserRole
from ..schemas.maintenance import MaintenanceCreate, MaintenanceUpdate


def create_maintenance_request(db: Session, data: MaintenanceCreate, user: User) -> MaintenanceRequest:
    if user.role == UserRole.LANDLORD or user.role == UserRole.PROPERTY_MANAGER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only tenants can create maintenance requests")

    unit = db.query(Unit).filter(Unit.id == data.unit_id).first()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")

    if unit.tenant_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only create requests for your unit")

    property_id = unit.property_id
    request = MaintenanceRequest(
        title=data.title,
        description=data.description,
        priority=data.priority,
        tenant_id=user.id,
        unit_id=data.unit_id,
        property_id=property_id,
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


def get_maintenance_requests(db: Session, user: User, skip: int = 0, limit: int = 100):
    query = db.query(MaintenanceRequest)
    if user.role == UserRole.TENANT:
        query = query.filter(MaintenanceRequest.tenant_id == user.id)
    elif user.role == UserRole.LANDLORD:
        query.join(Unit).join(Property).filter(Property.owner_id == user.id)
    elif user.role == UserRole.PROPERTY_MANAGER:
        query.join(Unit).join(Property).filter(
            (Property.owner_id == user.id) | (Property.property_manager_id == user.id)
        )
    return query.order_by(MaintenanceRequest.created_at.desc()).offset(skip).limit(limit).all()


def get_maintenance_request(db: Session, request_id: int, user: User) -> MaintenanceRequest:
    req = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    if user.role == UserRole.TENANT and req.tenant_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if user.role == UserRole.LANDLORD:
        prop = db.query(Property).filter(Property.id == req.property_id).first()
        if prop.owner_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return req


def update_maintenance_request(db: Session, request_id: int, data: MaintenanceUpdate, user: User) -> MaintenanceRequest:
    if user.role == UserRole.TENANT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only landlords and managers can update requests")

    req = get_maintenance_request(db, request_id, user)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(req, key, value)
    db.commit()
    db.refresh(req)
    return req
