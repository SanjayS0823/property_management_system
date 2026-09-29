from pydantic import BaseModel, model_validator
from typing import Optional
from datetime import datetime, date
from ..models.lease import LeaseStatus


class LeaseCreate(BaseModel):
    tenant_id: int
    unit_id: int
    start_date: date
    end_date: date
    monthly_rent: float
    security_deposit: float = 0.0

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date <= self.start_date:
            raise ValueError("End date must be after start date")
        return self


class LeaseUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    monthly_rent: Optional[float] = None
    security_deposit: Optional[float] = None
    status: Optional[LeaseStatus] = None


class LeaseResponse(BaseModel):
    id: int
    tenant_id: int
    unit_id: int
    start_date: date
    end_date: date
    monthly_rent: float
    security_deposit: float
    status: LeaseStatus
    lease_document_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    tenant_name: Optional[str] = None
    unit_number: Optional[str] = None
    property_name: Optional[str] = None
    property_id: Optional[int] = None

    class Config:
        from_attributes = True
