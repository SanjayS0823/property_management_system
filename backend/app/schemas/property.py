from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from ..models.property import PropertyStatus


class PropertyCreate(BaseModel):
    name: str
    address: str
    city: str
    state: str
    postal_code: str
    property_manager_id: Optional[int] = None


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    status: Optional[PropertyStatus] = None
    property_manager_id: Optional[int] = None


class PropertyResponse(BaseModel):
    id: int
    name: str
    address: str
    city: str
    state: str
    postal_code: str
    status: PropertyStatus
    owner_id: int
    property_manager_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    total_units: int = 0
    occupied_units: int = 0
    vacant_units: int = 0

    class Config:
        from_attributes = True
