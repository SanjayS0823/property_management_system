from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone

from ..models.property import Property
from ..models.unit import Unit
from ..models.lease import Lease, LeaseStatus
from ..models.maintenance import MaintenanceRequest, MaintenanceStatus
from ..models.payment import Payment, PaymentStatus
from ..models.user import User, UserRole
from ..schemas.dashboard import DashboardStats, TenantDashboardStats


def get_landlord_dashboard(db: Session, user: User) -> DashboardStats:
    if user.role == UserRole.TENANT:
        return DashboardStats()

    property_query = db.query(Property)
    if user.role == UserRole.LANDLORD:
        property_query = property_query.filter(Property.owner_id == user.id)
    else:
        property_query = property_query.filter(
            (Property.owner_id == user.id) | (Property.property_manager_id == user.id)
        )

    properties = property_query.all()
    property_ids = [p.id for p in properties]

    total_units = db.query(func.count(Unit.id)).filter(Unit.property_id.in_(property_ids)).scalar() or 0
    occupied = db.query(func.count(Unit.id)).filter(
        Unit.property_id.in_(property_ids), Unit.status == "occupied"
    ).scalar() or 0

    occupancy_rate = (occupied / total_units * 100) if total_units > 0 else 0

    active_leases = db.query(func.count(Lease.id)).filter(
        Lease.unit_id.in_([u.id for u in db.query(Unit).filter(Unit.property_id.in_(property_ids)).all()]),
        Lease.status == LeaseStatus.ACTIVE,
    ).scalar() or 0

    now = datetime.now(timezone.utc)
    upcoming_threshold = now + timedelta(days=30)

    upcoming_renewals = db.query(func.count(Lease.id)).filter(
        Lease.unit_id.in_([u.id for u in db.query(Unit).filter(Unit.property_id.in_(property_ids)).all()]),
        Lease.status == LeaseStatus.ACTIVE,
        Lease.end_date <= upcoming_threshold.date(),
    ).scalar() or 0

    all_payments = db.query(Payment).filter(
        Payment.unit_id.in_([u.id for u in db.query(Unit).filter(Unit.property_id.in_(property_ids)).all()])
    ).all()

    rent_collected = sum(p.amount for p in all_payments if p.status == PaymentStatus.PAID)
    pending_rent = sum(p.amount for p in all_payments if p.status == PaymentStatus.PENDING)
    overdue_rent = sum(p.amount for p in all_payments if p.status == PaymentStatus.OVERDUE)

    open_maintenance = db.query(func.count(MaintenanceRequest.id)).filter(
        MaintenanceRequest.property_id.in_(property_ids),
        MaintenanceRequest.status.in_([MaintenanceStatus.OPEN, MaintenanceStatus.IN_PROGRESS]),
    ).scalar() or 0

    return DashboardStats(
        total_properties=len(properties),
        total_units=total_units,
        occupied_units=occupied,
        vacant_units=total_units - occupied,
        occupancy_rate=round(occupancy_rate, 1),
        rent_collected=rent_collected,
        pending_rent=pending_rent,
        overdue_rent=overdue_rent,
        open_maintenance=open_maintenance,
        active_leases=active_leases,
        upcoming_renewals=upcoming_renewals,
        total_revenue=rent_collected,
    )


def get_tenant_dashboard(db: Session, user: User) -> TenantDashboardStats:
    from ..models.notification import Notification as Notif

    lease = db.query(Lease).filter(
        Lease.tenant_id == user.id,
        Lease.status == LeaseStatus.ACTIVE,
    ).first()

    if not lease:
        return TenantDashboardStats()

    unit = db.query(Unit).filter(Unit.id == lease.unit_id).first()
    prop = db.query(Property).filter(Property.id == unit.property_id).first() if unit else None

    open_maintenance = db.query(func.count(MaintenanceRequest.id)).filter(
        MaintenanceRequest.tenant_id == user.id,
        MaintenanceRequest.status.in_([MaintenanceStatus.OPEN, MaintenanceStatus.IN_PROGRESS]),
    ).scalar() or 0

    recent_payments = db.query(Payment).filter(
        Payment.tenant_id == user.id,
    ).order_by(Payment.created_at.desc()).limit(5).all()

    return TenantDashboardStats(
        unit_number=unit.unit_number if unit else None,
        property_name=prop.name if prop else None,
        monthly_rent=lease.monthly_rent,
        next_payment_due=lease.end_date.isoformat(),
        next_payment_amount=lease.monthly_rent,
        current_lease_status=lease.status.value,
        lease_end_date=lease.end_date.isoformat(),
        open_maintenance_count=open_maintenance,
        recent_payments=[
            {"amount": p.amount, "status": p.status.value, "date": p.payment_date.isoformat() if p.payment_date else None}
            for p in recent_payments
        ],
    )
