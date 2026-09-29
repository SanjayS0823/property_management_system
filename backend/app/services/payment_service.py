import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from ..models.payment import Payment, PaymentStatus
from ..models.lease import Lease, LeaseStatus
from ..models.unit import Unit
from ..models.property import Property
from ..models.user import User, UserRole
from ..schemas.payment import PaymentCreate


def create_payment(db: Session, data: PaymentCreate, user: User) -> Payment:
    if user.role == UserRole.LANDLORD or user.role == UserRole.PROPERTY_MANAGER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only tenants can create payments")

    lease = db.query(Lease).filter(Lease.id == data.lease_id).first()
    if not lease:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lease not found")
    if lease.tenant_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if lease.status != LeaseStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Lease is not active")

    payment_ref = f"PAY-{uuid.uuid4().hex[:12].upper()}"
    payment = Payment(
        tenant_id=user.id,
        lease_id=data.lease_id,
        unit_id=lease.unit_id,
        amount=data.amount,
        status=PaymentStatus.PENDING,
        payment_reference=payment_ref,
        due_date=datetime.now(timezone.utc),
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def process_payment(payment_id: int, success: bool, db: Session) -> Payment:
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    if payment.status == PaymentStatus.PAID:
        return payment  # Idempotent

    payment.status = PaymentStatus.PAID if success else PaymentStatus.FAILED
    payment.payment_date = datetime.now(timezone.utc)
    db.commit()
    db.refresh(payment)
    return payment


def get_payments(db: Session, user: User, skip: int = 0, limit: int = 100):
    query = db.query(Payment)
    if user.role == UserRole.TENANT:
        query = query.filter(Payment.tenant_id == user.id)
    elif user.role == UserRole.LANDLORD:
        query.join(Unit).join(Property).filter(Property.owner_id == user.id)
    elif user.role == UserRole.PROPERTY_MANAGER:
        query.join(Unit).join(Property).filter(
            (Property.owner_id == user.id) | (Property.property_manager_id == user.id)
        )
    return query.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()


def get_payment(db: Session, payment_id: int, user: User) -> Payment:
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    if user.role == UserRole.TENANT and payment.tenant_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return payment


def simulate_sandbox_payment(payment_id: int, success: bool, db: Session) -> dict:
    """Simulate payment gateway response for demo purposes."""
    payment = process_payment(payment_id, success, db)
    return {
        "payment_id": payment.id,
        "reference": payment.payment_reference,
        "status": payment.status.value,
        "amount": payment.amount,
        "gateway_response": {
            "status": "success" if success else "failed",
            "message": "Payment processed successfully" if success else "Payment declined",
            "transaction_id": f"TXN-{uuid.uuid4().hex[:16].upper()}",
        }
    }
