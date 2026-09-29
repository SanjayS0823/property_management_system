from datetime import datetime, timedelta, timezone, date
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..models.notification import Notification
from ..models.lease import Lease, LeaseStatus
from ..models.payment import Payment, PaymentStatus
from ..models.unit import Unit
from ..models.property import Property
from ..models.user import User, UserRole


def create_notification(db: Session, user_id: int, title: str, message: str, ntype: str = "info") -> Notification:
    # Prevent duplicate notifications for same type on same day
    today = datetime.now(timezone.utc).date()
    existing = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.type == ntype,
        Notification.created_at >= datetime.combine(today, datetime.min.time()),
    ).first()
    if existing:
        return existing

    notif = Notification(user_id=user_id, title=title, message=message, type=ntype)
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def get_notifications(db: Session, user_id: int, skip: int = 0, limit: int = 50):
    return db.query(Notification).filter(
        Notification.user_id == user_id
    ).order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()


def mark_notification_read(db: Session, notification_id: int, user_id: int) -> Notification:
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id,
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
        db.refresh(notif)
    return notif


def mark_all_read(db: Session, user_id: int):
    db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()


def generate_lease_renewal_reminders(db: Session):
    """Generate reminders for leases expiring within 30 days."""
    threshold = date.today() + timedelta(days=30)
    expiring = db.query(Lease).filter(
        Lease.status == LeaseStatus.ACTIVE,
        Lease.end_date <= threshold,
        Lease.end_date >= date.today(),
    ).all()

    for lease in expiring:
        unit = db.query(Unit).filter(Unit.id == lease.unit_id).first()
        if not unit:
            continue
        prop = db.query(Property).filter(Property.id == unit.property_id).first()
        prop_name = prop.name if prop else "Unknown Property"
        days_left = (lease.end_date - date.today()).days
        create_notification(
            db,
            user_id=lease.tenant_id,
            title="Lease Renewal Reminder",
            message=f"Your lease for Unit {unit.unit_number} at {prop_name} expires in {days_left} days.",
            ntype="warning",
        )
        if prop and prop.owner_id:
            create_notification(
                db,
                user_id=prop.owner_id,
                title="Lease Renewal Reminder",
                message=f"Lease for Unit {unit.unit_number} at {prop_name} expires in {days_left} days.",
                ntype="warning",
            )


def generate_overdue_rent_reminders(db: Session):
    """Generate reminders for overdue rent payments."""
    today = datetime.now(timezone.utc)
    overdue_payments = db.query(Payment).filter(
        Payment.status.in_([PaymentStatus.PENDING, PaymentStatus.OVERDUE]),
        Payment.due_date < today,
    ).all()

    for payment in overdue_payments:
        unit = db.query(Unit).filter(Unit.id == payment.unit_id).first()
        if not unit:
            continue
        prop = db.query(Property).filter(Property.id == unit.property_id).first()
        prop_name = prop.name if prop else "Unknown Property"
        create_notification(
            db,
            user_id=payment.tenant_id,
            title="Overdue Rent Payment",
            message=f"Rent payment of ${payment.amount:.2f} for Unit {unit.unit_number} at {prop_name} is overdue.",
            ntype="error",
        )
        if prop and prop.owner_id:
            create_notification(
                db,
                user_id=prop.owner_id,
                title="Overdue Rent Payment",
                message=f"Rent payment for Unit {unit.unit_number} at {prop_name} (${payment.amount:.2f}) is overdue.",
                ntype="error",
            )
