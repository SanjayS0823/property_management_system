from datetime import date, timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import init_db, SessionLocal
from .models.user import User, UserRole
from .models.property import Property, PropertyStatus
from .models.unit import Unit, UnitType, OccupancyStatus
from .models.lease import Lease, LeaseStatus
from .models.maintenance import MaintenanceRequest, MaintenanceStatus, MaintenancePriority
from .models.payment import Payment, PaymentStatus
from .models.notification import Notification
from .auth.security import get_password_hash
from .routers import auth, properties, units, tenants, leases, maintenance, payments, notifications, dashboard


def seed_data():
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return

        # Create demo users
        landlord = User(
            email="alex@demo.com", full_name="Alex Morgan",
            hashed_password=get_password_hash("demo123"),
            phone="+1-555-0101", role=UserRole.LANDLORD,
        )
        pm = User(
            email="sarah@demo.com", full_name="Sarah Chen",
            hashed_password=get_password_hash("demo123"),
            phone="+1-555-0102", role=UserRole.PROPERTY_MANAGER,
        )
        tenant1 = User(
            email="john@demo.com", full_name="John Carter",
            hashed_password=get_password_hash("demo123"),
            phone="+1-555-0103", role=UserRole.TENANT,
        )
        tenant2 = User(
            email="priya@demo.com", full_name="Priya Sharma",
            hashed_password=get_password_hash("demo123"),
            phone="+1-555-0104", role=UserRole.TENANT,
        )
        tenant3 = User(
            email="mike@demo.com", full_name="Mike Johnson",
            hashed_password=get_password_hash("demo123"),
            phone="+1-555-0105", role=UserRole.TENANT,
        )
        db.add_all([landlord, pm, tenant1, tenant2, tenant3])
        db.flush()

        # Create properties
        prop1 = Property(
            name="Sunrise Apartments", address="123 Main Street",
            city="Bangalore", state="Karnataka", postal_code="560001",
            owner_id=landlord.id, property_manager_id=pm.id,
        )
        prop2 = Property(
            name="Ocean View Complex", address="456 Beach Road",
            city="Mumbai", state="Maharashtra", postal_code="400001",
            owner_id=landlord.id,
        )
        db.add_all([prop1, prop2])
        db.flush()

        # Create units for prop1
        units_data = [
            ("101", UnitType.ONE_BED, 18000.0, OccupancyStatus.OCCUPIED, tenant1.id),
            ("102", UnitType.ONE_BED, 18000.0, OccupancyStatus.OCCUPIED, tenant2.id),
            ("201", UnitType.TWO_BED, 25000.0, OccupancyStatus.VACANT, None),
            ("202", UnitType.TWO_BED, 25000.0, OccupancyStatus.OCCUPIED, tenant3.id),
            ("301", UnitType.THREE_BED, 35000.0, OccupancyStatus.VACANT, None),
        ]
        units_list = []
        for un, ut, rent, status, tid in units_data:
            u = Unit(unit_number=un, unit_type=ut, monthly_rent=rent,
                     status=status, property_id=prop1.id, tenant_id=tid)
            units_list.append(u)
        db.add_all(units_list)
        db.flush()

        # Create units for prop2
        p2_units = [
            ("A1", UnitType.STUDIO, 15000.0, OccupancyStatus.VACANT, None),
            ("A2", UnitType.ONE_BED, 20000.0, OccupancyStatus.OCCUPIED, tenant2.id),
        ]
        for un, ut, rent, status, tid in p2_units:
            u = Unit(unit_number=un, unit_type=ut, monthly_rent=rent,
                     status=status, property_id=prop2.id, tenant_id=tid)
            db.add(u)
        db.flush()

        today = date.today()
        # Create leases
        lease1 = Lease(
            tenant_id=tenant1.id, unit_id=units_list[0].id,
            start_date=today - timedelta(days=300),
            end_date=today + timedelta(days=65),
            monthly_rent=18000.0, security_deposit=36000.0,
            status=LeaseStatus.ACTIVE,
        )
        lease2 = Lease(
            tenant_id=tenant2.id, unit_id=units_list[1].id,
            start_date=today - timedelta(days=200),
            end_date=today + timedelta(days=20),
            monthly_rent=18000.0, security_deposit=36000.0,
            status=LeaseStatus.ACTIVE,
        )
        lease3 = Lease(
            tenant_id=tenant3.id, unit_id=units_list[3].id,
            start_date=today - timedelta(days=100),
            end_date=today + timedelta(days=265),
            monthly_rent=25000.0, security_deposit=50000.0,
            status=LeaseStatus.ACTIVE,
        )
        db.add_all([lease1, lease2, lease3])
        db.flush()

        # Create some maintenance requests
        maint1 = MaintenanceRequest(
            title="Water leakage in bathroom",
            description="Water is leaking from the bathroom ceiling. It has been ongoing for 2 days.",
            priority=MaintenancePriority.HIGH,
            status=MaintenanceStatus.IN_PROGRESS,
            tenant_id=tenant1.id, unit_id=units_list[0].id,
            property_id=prop1.id,
        )
        maint2 = MaintenanceRequest(
            title="AC not cooling properly",
            description="The air conditioning unit in the bedroom is not cooling effectively.",
            priority=MaintenancePriority.MEDIUM,
            status=MaintenanceStatus.OPEN,
            tenant_id=tenant2.id, unit_id=units_list[1].id,
            property_id=prop1.id,
        )
        db.add_all([maint1, maint2])
        db.flush()

        # Create some payments
        pay1 = Payment(
            tenant_id=tenant1.id, lease_id=lease1.id, unit_id=units_list[0].id,
            amount=18000.0, status=PaymentStatus.PAID,
            payment_reference="PAY-DEMO0001",
            payment_date=today - timedelta(days=5),
            due_date=today - timedelta(days=10),
        )
        pay2 = Payment(
            tenant_id=tenant2.id, lease_id=lease2.id, unit_id=units_list[1].id,
            amount=18000.0, status=PaymentStatus.PAID,
            payment_reference="PAY-DEMO0002",
            payment_date=today - timedelta(days=3),
            due_date=today - timedelta(days=3),
        )
        pay3 = Payment(
            tenant_id=tenant3.id, lease_id=lease3.id, unit_id=units_list[3].id,
            amount=25000.0, status=PaymentStatus.PENDING,
            due_date=today + timedelta(days=5),
        )
        db.add_all([pay1, pay2, pay3])

        # Create some notifications
        notif1 = Notification(
            user_id=tenant2.id,
            title="Lease Renewal Reminder",
            message="Your lease for Unit 102 at Sunrise Apartments expires in 20 days. Please contact your property manager for renewal.",
            type="warning",
        )
        db.add(notif1)

        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_data()
    yield


app = FastAPI(title="Property Management Portal", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)





# Include routers
app.include_router(auth.router)
app.include_router(properties.router)
app.include_router(units.router)
app.include_router(tenants.router)
app.include_router(leases.router)
app.include_router(maintenance.router)
app.include_router(payments.router)
app.include_router(notifications.router)
app.include_router(dashboard.router)


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
