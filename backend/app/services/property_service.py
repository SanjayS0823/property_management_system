from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from ..models.property import Property, PropertyStatus
from ..models.unit import Unit
from ..models.user import User, UserRole
from ..schemas.property import PropertyCreate, PropertyUpdate


def create_property(db: Session, data: PropertyCreate, owner_id: int) -> Property:
    prop = Property(
        name=data.name,
        address=data.address,
        city=data.city,
        state=data.state,
        postal_code=data.postal_code,
        owner_id=owner_id,
        property_manager_id=data.property_manager_id,
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop


def get_properties(db: Session, user: User, skip: int = 0, limit: int = 100):
    query = db.query(Property)
    if user.role == UserRole.LANDLORD:
        query = query.filter(Property.owner_id == user.id)
    elif user.role == UserRole.PROPERTY_MANAGER:
        query = query.filter(
            (Property.owner_id == user.id) | (Property.property_manager_id == user.id)
        )
    else:
        return []
    return query.offset(skip).limit(limit).all()


def get_property(db: Session, property_id: int, user: User) -> Property:
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    if user.role == UserRole.TENANT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if user.role == UserRole.LANDLORD and prop.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if user.role == UserRole.PROPERTY_MANAGER and prop.owner_id != user.id and prop.property_manager_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return prop


def update_property(db: Session, property_id: int, data: PropertyUpdate, user: User) -> Property:
    prop = get_property(db, property_id, user)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(prop, key, value)
    db.commit()
    db.refresh(prop)
    return prop


def get_property_with_stats(db: Session, prop: Property) -> dict:
    total_units = db.query(func.count(Unit.id)).filter(Unit.property_id == prop.id).scalar() or 0
    occupied = db.query(func.count(Unit.id)).filter(Unit.property_id == prop.id, Unit.status == "occupied").scalar() or 0
    return {
        "id": prop.id,
        "name": prop.name,
        "address": prop.address,
        "city": prop.city,
        "state": prop.state,
        "postal_code": prop.postal_code,
        "status": prop.status,
        "owner_id": prop.owner_id,
        "property_manager_id": prop.property_manager_id,
        "created_at": prop.created_at,
        "updated_at": prop.updated_at,
        "total_units": total_units,
        "occupied_units": occupied,
        "vacant_units": total_units - occupied,
    }
