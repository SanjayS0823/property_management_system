from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.maintenance import MaintenanceStatus, MaintenancePriority


class MaintenanceCreate(BaseModel):
    title: str
    description: str
    priority: MaintenancePriority = MaintenancePriority.MEDIUM
    unit_id: int


class MaintenanceUpdate(BaseModel):
    status: Optional[MaintenanceStatus] = None
    priority: Optional[MaintenancePriority] = None
    description: Optional[str] = None


class MaintenanceResponse(BaseModel):
    id: int
    title: str
    description: str
    priority: MaintenancePriority
    status: MaintenanceStatus
    tenant_id: int
    unit_id: int
    property_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    tenant_name: Optional[str] = None
    unit_number: Optional[str] = None
    property_name: Optional[str] = None

    class Config:
        from_attributes = True
