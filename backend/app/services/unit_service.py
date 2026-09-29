from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from ..models.unit import Unit, OccupancyStatus
from ..models.property import Property
from ..models.user import User, UserRole
from ..schemas.unit import UnitCreate, UnitUpdate


def create_unit(db: Session, property_id: int, data: UnitCreate, user: User) -> Unit:
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    if user.role == UserRole.TENANT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if user.role == UserRole.LANDLORD and prop.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    existing = db.query(Unit).filter(Unit.property_id == property_id, Unit.unit_number == data.unit_number).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unit number already exists in this property")

    unit = Unit(
        unit_number=data.unit_number,
        unit_type=data.unit_type,
        monthly_rent=data.monthly_rent,
        property_id=property_id,
    )
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return unit


def get_units(db: Session, property_id: int, user: User):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    if user.role == UserRole.TENANT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return db.query(Unit).filter(Unit.property_id == property_id).all()


def get_all_units(db: Session, user: User):
    query = db.query(Unit)
    if user.role == UserRole.LANDLORD:
        query.join(Property).filter(Property.owner_id == user.id)
    elif user.role == UserRole.PROPERTY_MANAGER:
        query.join(Property).filter(
            (Property.owner_id == user.id) | (Property.property_manager_id == user.id)
        )
    else:
        return []
    return query.all()


def get_unit(db: Session, unit_id: int, user: User) -> Unit:
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")
    if user.role == UserRole.TENANT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    prop = db.query(Property).filter(Property.id == unit.property_id).first()
    if user.role == UserRole.LANDLORD and prop.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return unit


def update_unit(db: Session, unit_id: int, data: UnitUpdate, user: User) -> Unit:
    unit = get_unit(db, unit_id, user)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(unit, key, value)
    db.commit()
    db.refresh(unit)
    return unit


def assign_tenant(db: Session, unit_id: int, tenant_id: int, user: User) -> Unit:
    unit = get_unit(db, unit_id, user)
    tenant = db.query(User).filter(User.id == tenant_id, User.role == UserRole.TENANT).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid tenant")
    unit.tenant_id = tenant_id
    unit.status = OccupancyStatus.OCCUPIED
    db.commit()
    db.refresh(unit)
    return unit
