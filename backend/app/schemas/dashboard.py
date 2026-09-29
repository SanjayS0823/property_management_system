from pydantic import BaseModel
from typing import List, Optional


class DashboardStats(BaseModel):
    total_properties: int = 0
    total_units: int = 0
    occupied_units: int = 0
    vacant_units: int = 0
    occupancy_rate: float = 0.0
    rent_collected: float = 0.0
    pending_rent: float = 0.0
    overdue_rent: float = 0.0
    open_maintenance: int = 0
    active_leases: int = 0
    upcoming_renewals: int = 0
    total_revenue: float = 0.0


class TenantDashboardStats(BaseModel):
    unit_number: Optional[str] = None
    property_name: Optional[str] = None
    monthly_rent: float = 0.0
    next_payment_due: Optional[str] = None
    next_payment_amount: float = 0.0
    current_lease_status: Optional[str] = None
    lease_end_date: Optional[str] = None
    open_maintenance_count: int = 0
    recent_payments: List[dict] = []
