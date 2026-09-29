from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.dashboard import DashboardStats, TenantDashboardStats
from ..services.dashboard_service import get_landlord_dashboard, get_tenant_dashboard
from ..auth.dependencies import get_current_user
from ..models.user import User, UserRole

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardStats)
def dashboard(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role == UserRole.TENANT:
        return DashboardStats()
    return get_landlord_dashboard(db, user)


@router.get("/tenant", response_model=TenantDashboardStats)
def tenant_dashboard(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return get_tenant_dashboard(db, user)
