from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas.payment import PaymentCreate, PaymentResponse
from ..services.payment_service import create_payment, get_payments, get_payment, simulate_sandbox_payment
from ..auth.dependencies import get_current_user, require_role
from ..models.user import User, UserRole


def enrich_payment(db: Session, payment) -> dict:
    from ..models.unit import Unit
    from ..models.property import Property
    unit = db.query(Unit).filter(Unit.id == payment.unit_id).first()
    prop = db.query(Property).filter(Property.id == unit.property_id).first() if unit else None
    tenant = db.query(User).filter(User.id == payment.tenant_id).first()
    return {
        "id": payment.id,
        "tenant_id": payment.tenant_id,
        "lease_id": payment.lease_id,
        "unit_id": payment.unit_id,
        "amount": payment.amount,
        "status": payment.status,
        "payment_reference": payment.payment_reference,
        "payment_date": payment.payment_date,
        "due_date": payment.due_date,
        "created_at": payment.created_at,
        "tenant_name": tenant.full_name if tenant else None,
        "unit_number": unit.unit_number if unit else None,
        "property_name": prop.name if prop else None,
    }


router = APIRouter(prefix="/api/payments", tags=["Payments"])


@router.post("/create", response_model=dict, status_code=201)
def create(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.TENANT)),
):
    payment = create_payment(db, data, user)
    return enrich_payment(db, payment)


@router.post("/{payment_id}/process", response_model=dict)
def process(
    payment_id: int,
    body: dict = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.TENANT)),
):
    success = True
    if body:
        success = body.get("success", True)
    result = simulate_sandbox_payment(payment_id, success, db)
    return result


@router.post("/webhook", response_model=dict)
def webhook(body: dict, db: Session = Depends(get_db)):
    payment_id = body.get("payment_id")
    success = body.get("status") == "success"
    if payment_id:
        result = simulate_sandbox_payment(payment_id, success, db)
        return result
    return {"error": "Invalid webhook payload"}


@router.get("", response_model=List[dict])
def list_payments(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    payments = get_payments(db, user)
    return [enrich_payment(db, p) for p in payments]


@router.get("/{payment_id}", response_model=dict)
def get_one(
    payment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    payment = get_payment(db, payment_id, user)
    return enrich_payment(db, payment)
