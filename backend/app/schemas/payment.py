from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.payment import PaymentStatus


class PaymentCreate(BaseModel):
    lease_id: int
    amount: float
    payment_method: Optional[str] = "card"


class PaymentResponse(BaseModel):
    id: int
    tenant_id: int
    lease_id: int
    unit_id: int
    amount: float
    status: PaymentStatus
    payment_reference: Optional[str] = None
    payment_date: Optional[datetime] = None
    due_date: datetime
    created_at: datetime
    tenant_name: Optional[str] = None
    unit_number: Optional[str] = None
    property_name: Optional[str] = None

    class Config:
        from_attributes = True
