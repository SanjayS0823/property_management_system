from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.unit import UnitType, OccupancyStatus


class UnitCreate(BaseModel):
    unit_number: str
    unit_type: UnitType = UnitType.ONE_BED
    monthly_rent: float


class UnitUpdate(BaseModel):
    unit_number: Optional[str] = None
    unit_type: Optional[UnitType] = None
    monthly_rent: Optional[float] = None
    status: Optional[OccupancyStatus] = None
    tenant_id: Optional[int] = None


class UnitResponse(BaseModel):
    id: int
    unit_number: str
    unit_type: UnitType
    monthly_rent: float
    status: OccupancyStatus
    property_id: int
    tenant_id: Optional[int] = None
    tenant_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
