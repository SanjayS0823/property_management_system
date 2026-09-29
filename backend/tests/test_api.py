"""Comprehensive tests for the Property Management Portal API."""
import pytest
from datetime import date, timedelta

from app.models.user import User, UserRole
from app.models.property import Property, PropertyStatus
from app.models.unit import Unit, UnitType, OccupancyStatus
from app.models.lease import Lease, LeaseStatus
from app.models.maintenance import MaintenanceRequest, MaintenanceStatus, MaintenancePriority
from app.models.payment import Payment, PaymentStatus
from app.auth.security import get_password_hash

from tests.conftest import get_auth_header


# ============================================================
# AUTHENTICATION TESTS
# ============================================================

class TestAuthentication:
    def test_login_success(self, client, landlord):
        response = client.post("/api/auth/login", json={
            "email": "landlord@test.com",
            "password": "test123",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "landlord"

    def test_login_wrong_password(self, client, landlord):
        response = client.post("/api/auth/login", json={
            "email": "landlord@test.com",
            "password": "wrongpassword",
        })
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        response = client.post("/api/auth/login", json={
            "email": "nobody@test.com",
            "password": "test123",
        })
        assert response.status_code == 401

    def test_register_user(self, client):
        response = client.post("/api/auth/register", json={
            "email": "newuser@test.com",
            "full_name": "New User",
            "password": "Test1234",
            "role": "tenant",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@test.com"
        assert data["role"] == "tenant"
        assert "password" not in data
        assert "hashed_password" not in data

    def test_register_and_login(self, client):
        # Register
        client.post("/api/auth/register", json={
            "email": "flow@test.com",
            "full_name": "Flow User",
            "password": "Test1234",
            "role": "landlord",
        })
        # Login
        response = client.post("/api/auth/login", json={
            "email": "flow@test.com",
            "password": "Test1234",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "landlord"
        assert data["user"]["full_name"] == "Flow User"

    def test_register_duplicate_email(self, client, landlord):
        response = client.post("/api/auth/register", json={
            "email": "landlord@test.com",
            "full_name": "Another",
            "password": "Test1234",
            "role": "tenant",
        })
        assert response.status_code == 400

    def test_register_invalid_email(self, client):
        response = client.post("/api/auth/register", json={
            "email": "not-an-email",
            "full_name": "Test User",
            "password": "Test1234",
            "role": "tenant",
        })
        assert response.status_code == 422

    def test_register_empty_name(self, client):
        response = client.post("/api/auth/register", json={
            "email": "empty@test.com",
            "full_name": "",
            "password": "Test1234",
            "role": "tenant",
        })
        assert response.status_code == 422

    def test_register_weak_password(self, client):
        response = client.post("/api/auth/register", json={
            "email": "weak@test.com",
            "full_name": "Weak Pass",
            "password": "123",
            "role": "tenant",
        })
        assert response.status_code == 422

    def test_register_password_no_uppercase(self, client):
        response = client.post("/api/auth/register", json={
            "email": "noupper@test.com",
            "full_name": "No Upper",
            "password": "test1234",
            "role": "tenant",
        })
        assert response.status_code == 422

    def test_register_password_no_lowercase(self, client):
        response = client.post("/api/auth/register", json={
            "email": "nolower@test.com",
            "full_name": "No Lower",
            "password": "TEST1234",
            "role": "tenant",
        })
        assert response.status_code == 422

    def test_register_password_no_digit(self, client):
        response = client.post("/api/auth/register", json={
            "email": "nodigit@test.com",
            "full_name": "No Digit",
            "password": "TestTest",
            "role": "tenant",
        })
        assert response.status_code == 422

    def test_register_invalid_role(self, client):
        response = client.post("/api/auth/register", json={
            "email": "badrole@test.com",
            "full_name": "Bad Role",
            "password": "Test1234",
            "role": "admin",
        })
        assert response.status_code == 422

    def test_get_me(self, client, landlord):
        headers = get_auth_header(landlord)
        response = client.get("/api/auth/me", headers=headers)
        assert response.status_code == 200
        assert response.json()["email"] == "landlord@test.com"

    def test_get_me_unauthorized(self, client):
        response = client.get("/api/auth/me")
        assert response.status_code in (401, 403)


# ============================================================
# RBAC TESTS
# ============================================================

class TestRBAC:
    def test_tenant_cannot_create_property(self, client, tenant):
        headers = get_auth_header(tenant)
        response = client.post("/api/properties", json={
            "name": "Test Property",
            "address": "123 Test St",
            "city": "Test City",
            "state": "Test State",
            "postal_code": "12345",
        }, headers=headers)
        assert response.status_code == 403

    def test_tenant_cannot_list_tenants(self, client, tenant):
        headers = get_auth_header(tenant)
        response = client.get("/api/tenants", headers=headers)
        assert response.status_code == 403

    def test_landlord_can_create_property(self, client, landlord):
        headers = get_auth_header(landlord)
        response = client.post("/api/properties", json={
            "name": "Test Property",
            "address": "123 Test St",
            "city": "Test City",
            "state": "Test State",
            "postal_code": "12345",
        }, headers=headers)
        assert response.status_code == 201

    def test_manager_can_create_property(self, client, manager):
        headers = get_auth_header(manager)
        response = client.post("/api/properties", json={
            "name": "Manager Property",
            "address": "456 Manager Ave",
            "city": "Manager City",
            "state": "Manager State",
            "postal_code": "67890",
        }, headers=headers)
        assert response.status_code == 201

    def test_tenant_cannot_create_lease(self, client, tenant):
        headers = get_auth_header(tenant)
        response = client.post("/api/leases", json={
            "tenant_id": 1,
            "unit_id": 1,
            "start_date": "2026-01-01",
            "end_date": "2026-12-31",
            "monthly_rent": 18000,
        }, headers=headers)
        assert response.status_code == 403


# ============================================================
# PROPERTY TESTS
# ============================================================

class TestProperties:
    def test_create_property(self, client, landlord):
        headers = get_auth_header(landlord)
        response = client.post("/api/properties", json={
            "name": "Sunrise Apartments",
            "address": "123 Main Street",
            "city": "Bangalore",
            "state": "Karnataka",
            "postal_code": "560001",
        }, headers=headers)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Sunrise Apartments"
        assert data["owner_id"] == landlord.id

    def test_list_properties(self, client, landlord):
        headers = get_auth_header(landlord)
        client.post("/api/properties", json={
            "name": "P1", "address": "A1", "city": "C1", "state": "S1", "postal_code": "11111",
        }, headers=headers)
        response = client.get("/api/properties", headers=headers)
        assert response.status_code == 200
        assert len(response.json()) >= 1

    def test_get_property(self, client, landlord):
        headers = get_auth_header(landlord)
        create = client.post("/api/properties", json={
            "name": "P1", "address": "A1", "city": "C1", "state": "S1", "postal_code": "11111",
        }, headers=headers)
        prop_id = create.json()["id"]
        response = client.get(f"/api/properties/{prop_id}", headers=headers)
        assert response.status_code == 200
        assert response.json()["name"] == "P1"

    def test_update_property(self, client, landlord):
        headers = get_auth_header(landlord)
        create = client.post("/api/properties", json={
            "name": "P1", "address": "A1", "city": "C1", "state": "S1", "postal_code": "11111",
        }, headers=headers)
        prop_id = create.json()["id"]
        response = client.put(f"/api/properties/{prop_id}", json={
            "name": "Updated P1",
        }, headers=headers)
        assert response.status_code == 200
        assert response.json()["name"] == "Updated P1"

    def test_tenant_cannot_access_property(self, client, tenant, landlord):
        headers_l = get_auth_header(landlord)
        create = client.post("/api/properties", json={
            "name": "P1", "address": "A1", "city": "C1", "state": "S1", "postal_code": "11111",
        }, headers=headers_l)
        prop_id = create.json()["id"]
        headers_t = get_auth_header(tenant)
        response = client.get(f"/api/properties/{prop_id}", headers=headers_t)
        assert response.status_code == 403


# ============================================================
# UNIT TESTS
# ============================================================

class TestUnits:
    def test_create_unit(self, client, landlord):
        headers = get_auth_header(landlord)
        prop = client.post("/api/properties", json={
            "name": "P1", "address": "A1", "city": "C1", "state": "S1", "postal_code": "11111",
        }, headers=headers).json()
        response = client.post(f"/api/properties/{prop['id']}/units", json={
            "unit_number": "101",
            "unit_type": "1bed",
            "monthly_rent": 18000,
        }, headers=headers)
        assert response.status_code == 201
        assert response.json()["unit_number"] == "101"

    def test_duplicate_unit_number(self, client, landlord):
        headers = get_auth_header(landlord)
        prop = client.post("/api/properties", json={
            "name": "P1", "address": "A1", "city": "C1", "state": "S1", "postal_code": "11111",
        }, headers=headers).json()
        client.post(f"/api/properties/{prop['id']}/units", json={
            "unit_number": "101", "unit_type": "1bed", "monthly_rent": 18000,
        }, headers=headers)
        response = client.post(f"/api/properties/{prop['id']}/units", json={
            "unit_number": "101", "unit_type": "2bed", "monthly_rent": 25000,
        }, headers=headers)
        assert response.status_code == 400

    def test_list_units(self, client, landlord):
        headers = get_auth_header(landlord)
        prop = client.post("/api/properties", json={
            "name": "P1", "address": "A1", "city": "C1", "state": "S1", "postal_code": "11111",
        }, headers=headers).json()
        client.post(f"/api/properties/{prop['id']}/units", json={
            "unit_number": "101", "unit_type": "1bed", "monthly_rent": 18000,
        }, headers=headers)
        response = client.get(f"/api/properties/{prop['id']}/units", headers=headers)
        assert response.status_code == 200
        assert len(response.json()) == 1


# ============================================================
# LEASE TESTS
# ============================================================

class TestLeases:
    def test_create_lease(self, client, landlord, tenant):
        headers = get_auth_header(landlord)
        prop = client.post("/api/properties", json={
            "name": "P1", "address": "A1", "city": "C1", "state": "S1", "postal_code": "11111",
        }, headers=headers).json()
        unit = client.post(f"/api/properties/{prop['id']}/units", json={
            "unit_number": "101", "unit_type": "1bed", "monthly_rent": 18000,
        }, headers=headers).json()
        response = client.post("/api/leases", json={
            "tenant_id": tenant.id,
            "unit_id": unit["id"],
            "start_date": "2026-01-01",
            "end_date": "2026-12-31",
            "monthly_rent": 18000,
            "security_deposit": 36000,
        }, headers=headers)
        assert response.status_code == 201
        assert response.json()["tenant_id"] == tenant.id

    def test_invalid_lease_dates(self, client, landlord, tenant):
        headers = get_auth_header(landlord)
        prop = client.post("/api/properties", json={
            "name": "P1", "address": "A1", "city": "C1", "state": "S1", "postal_code": "11111",
        }, headers=headers).json()
        unit = client.post(f"/api/properties/{prop['id']}/units", json={
            "unit_number": "101", "unit_type": "1bed", "monthly_rent": 18000,
        }, headers=headers).json()
        response = client.post("/api/leases", json={
            "tenant_id": tenant.id,
            "unit_id": unit["id"],
            "start_date": "2026-12-31",
            "end_date": "2026-01-01",
            "monthly_rent": 18000,
        }, headers=headers)
        assert response.status_code == 422

    def test_duplicate_active_lease(self, client, landlord, tenant):
        headers = get_auth_header(landlord)
        prop = client.post("/api/properties", json={
            "name": "P1", "address": "A1", "city": "C1", "state": "S1", "postal_code": "11111",
        }, headers=headers).json()
        unit = client.post(f"/api/properties/{prop['id']}/units", json={
            "unit_number": "101", "unit_type": "1bed", "monthly_rent": 18000,
        }, headers=headers).json()
        client.post("/api/leases", json={
            "tenant_id": tenant.id, "unit_id": unit["id"],
            "start_date": "2026-01-01", "end_date": "2026-12-31", "monthly_rent": 18000,
        }, headers=headers)
        response = client.post("/api/leases", json={
            "tenant_id": tenant.id, "unit_id": unit["id"],
            "start_date": "2026-01-01", "end_date": "2026-12-31", "monthly_rent": 18000,
        }, headers=headers)
        assert response.status_code == 400

    def test_renew_lease(self, client, landlord, tenant):
        headers = get_auth_header(landlord)
        prop = client.post("/api/properties", json={
            "name": "P1", "address": "A1", "city": "C1", "state": "S1", "postal_code": "11111",
        }, headers=headers).json()
        unit = client.post(f"/api/properties/{prop['id']}/units", json={
            "unit_number": "101", "unit_type": "1bed", "monthly_rent": 18000,
        }, headers=headers).json()
        lease = client.post("/api/leases", json={
            "tenant_id": tenant.id, "unit_id": unit["id"],
            "start_date": "2026-01-01", "end_date": "2026-06-30", "monthly_rent": 18000,
        }, headers=headers).json()
        response = client.post(f"/api/leases/{lease['id']}/renew", json={
            "new_end_date": "2027-06-30",
        }, headers=headers)
        assert response.status_code == 200
        assert response.json()["status"] == "active"

    def test_tenant_isolation_cannot_see_other_lease(self, client, landlord, tenant, tenant2):
        headers = get_auth_header(landlord)
        prop = client.post("/api/properties", json={
            "name": "P1", "address": "A1", "city": "C1", "state": "S1", "postal_code": "11111",
        }, headers=headers).json()
        unit = client.post(f"/api/properties/{prop['id']}/units", json={
            "unit_number": "101", "unit_type": "1bed", "monthly_rent": 18000,
        }, headers=headers).json()
        lease = client.post("/api/leases", json={
            "tenant_id": tenant.id, "unit_id": unit["id"],
            "start_date": "2026-01-01", "end_date": "2026-12-31", "monthly_rent": 18000,
        }, headers=headers).json()
        headers_t2 = get_auth_header(tenant2)
        response = client.get(f"/api/leases/{lease['id']}", headers=headers_t2)
        assert response.status_code == 403


# ============================================================
# MAINTENANCE TESTS
# ============================================================

class TestMaintenance:
    def _setup_property_with_tenant(self, client, landlord, tenant):
        headers = get_auth_header(landlord)
        prop = client.post("/api/properties", json={
            "name": "P1", "address": "A1", "city": "C1", "state": "S1", "postal_code": "11111",
        }, headers=headers).json()
        unit = client.post(f"/api/properties/{prop['id']}/units", json={
            "unit_number": "101", "unit_type": "1bed", "monthly_rent": 18000,
        }, headers=headers).json()
        # Assign tenant to unit
        client.post(f"/api/units/{unit['id']}/assign-tenant", json={
            "tenant_id": tenant.id,
        }, headers=headers)
        return prop, unit

    def test_create_maintenance_request(self, client, landlord, tenant):
        prop, unit = self._setup_property_with_tenant(client, landlord, tenant)
        headers = get_auth_header(tenant)
        response = client.post("/api/maintenance", json={
            "title": "Water leakage",
            "description": "Water is leaking from the ceiling.",
            "priority": "high",
            "unit_id": unit["id"],
        }, headers=headers)
        assert response.status_code == 201
        assert response.json()["title"] == "Water leakage"

    def test_landlord_cannot_create_maintenance(self, client, landlord, tenant):
        prop, unit = self._setup_property_with_tenant(client, landlord, tenant)
        headers = get_auth_header(landlord)
        response = client.post("/api/maintenance", json={
            "title": "Test", "description": "Test", "unit_id": unit["id"],
        }, headers=headers)
        assert response.status_code == 403

    def test_update_maintenance_status(self, client, landlord, tenant):
        prop, unit = self._setup_property_with_tenant(client, landlord, tenant)
        t_headers = get_auth_header(tenant)
        req = client.post("/api/maintenance", json={
            "title": "Water leakage", "description": "Leaking.", "unit_id": unit["id"],
        }, headers=t_headers).json()
        l_headers = get_auth_header(landlord)
        response = client.patch(f"/api/maintenance/{req['id']}/status", json={
            "status": "in_progress",
        }, headers=l_headers)
        assert response.status_code == 200
        assert response.json()["status"] == "in_progress"
        # Move to resolved
        response = client.patch(f"/api/maintenance/{req['id']}/status", json={
            "status": "resolved",
        }, headers=l_headers)
        assert response.status_code == 200
        assert response.json()["status"] == "resolved"

    def test_tenant_cannot_update_maintenance_status(self, client, landlord, tenant, tenant2):
        prop, unit = self._setup_property_with_tenant(client, landlord, tenant)
        t_headers = get_auth_header(tenant)
        req = client.post("/api/maintenance", json={
            "title": "Water leakage", "description": "Leaking.", "unit_id": unit["id"],
        }, headers=t_headers).json()
        t2_headers = get_auth_header(tenant2)
        response = client.patch(f"/api/maintenance/{req['id']}/status", json={
            "status": "in_progress",
        }, headers=t2_headers)
        assert response.status_code == 403


# ============================================================
# PAYMENT TESTS
# ============================================================

class TestPayments:
    def _setup_lease(self, client, landlord, tenant):
        headers = get_auth_header(landlord)
        prop = client.post("/api/properties", json={
            "name": "P1", "address": "A1", "city": "C1", "state": "S1", "postal_code": "11111",
        }, headers=headers).json()
        unit = client.post(f"/api/properties/{prop['id']}/units", json={
            "unit_number": "101", "unit_type": "1bed", "monthly_rent": 18000,
        }, headers=headers).json()
        client.post(f"/api/units/{unit['id']}/assign-tenant", json={"tenant_id": tenant.id}, headers=headers)
        lease = client.post("/api/leases", json={
            "tenant_id": tenant.id, "unit_id": unit["id"],
            "start_date": "2026-01-01", "end_date": "2026-12-31", "monthly_rent": 18000,
            "security_deposit": 36000,
        }, headers=headers).json()
        return lease

    def test_create_payment(self, client, landlord, tenant):
        lease = self._setup_lease(client, landlord, tenant)
        headers = get_auth_header(tenant)
        response = client.post("/api/payments/create", json={
            "lease_id": lease["id"],
            "amount": 18000,
        }, headers=headers)
        assert response.status_code == 201
        assert response.json()["status"] == "pending"

    def test_payment_success(self, client, landlord, tenant):
        lease = self._setup_lease(client, landlord, tenant)
        headers = get_auth_header(tenant)
        pay = client.post("/api/payments/create", json={
            "lease_id": lease["id"], "amount": 18000,
        }, headers=headers).json()
        response = client.post(f"/api/payments/{pay['id']}/process", json={
            "success": True,
        }, headers=headers)
        assert response.status_code == 200
        assert response.json()["status"] == "paid"

    def test_payment_failure(self, client, landlord, tenant):
        lease = self._setup_lease(client, landlord, tenant)
        headers = get_auth_header(tenant)
        pay = client.post("/api/payments/create", json={
            "lease_id": lease["id"], "amount": 18000,
        }, headers=headers).json()
        response = client.post(f"/api/payments/{pay['id']}/process", json={
            "success": False,
        }, headers=headers)
        assert response.status_code == 200
        assert response.json()["status"] == "failed"

    def test_landlord_cannot_create_payment(self, client, landlord, tenant):
        lease = self._setup_lease(client, landlord, tenant)
        headers = get_auth_header(landlord)
        response = client.post("/api/payments/create", json={
            "lease_id": lease["id"], "amount": 18000,
        }, headers=headers)
        assert response.status_code == 403

    def test_tenant_cannot_access_other_payment(self, client, landlord, tenant, tenant2):
        lease = self._setup_lease(client, landlord, tenant)
        t_headers = get_auth_header(tenant)
        pay = client.post("/api/payments/create", json={
            "lease_id": lease["id"], "amount": 18000,
        }, headers=t_headers).json()
        t2_headers = get_auth_header(tenant2)
        response = client.get(f"/api/payments/{pay['id']}", headers=t2_headers)
        assert response.status_code == 403


# ============================================================
# DASHBOARD TESTS
# ============================================================

class TestDashboard:
    def test_landlord_dashboard(self, client, landlord):
        headers = get_auth_header(landlord)
        response = client.get("/api/dashboard", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_properties" in data
        assert "occupancy_rate" in data

    def test_tenant_dashboard(self, client, tenant):
        headers = get_auth_header(tenant)
        response = client.get("/api/dashboard/tenant", headers=headers)
        assert response.status_code == 200


# ============================================================
# NOTIFICATION TESTS
# ============================================================

class TestNotifications:
    def test_list_notifications(self, client, tenant):
        headers = get_auth_header(tenant)
        response = client.get("/api/notifications", headers=headers)
        assert response.status_code == 200

    def test_mark_read(self, client, tenant):
        headers = get_auth_header(tenant)
        response = client.post("/api/notifications/read-all", headers=headers)
        assert response.status_code == 200


# ============================================================
# TENANT TESTS
# ============================================================

class TestTenants:
    def test_list_tenants(self, client, landlord):
        headers = get_auth_header(landlord)
        response = client.get("/api/tenants", headers=headers)
        assert response.status_code == 200

    def test_get_tenant(self, client, landlord, tenant):
        headers = get_auth_header(landlord)
        response = client.get(f"/api/tenants/{tenant.id}", headers=headers)
        assert response.status_code == 200
        assert response.json()["email"] == "tenant@test.com"

    def test_tenant_cannot_access_other_tenant(self, client, tenant, tenant2):
        headers = get_auth_header(tenant)
        response = client.get(f"/api/tenants/{tenant2.id}", headers=headers)
        assert response.status_code == 403
