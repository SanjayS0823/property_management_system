# PropManager — Property Management Portal

A production-quality MVP for managing rental properties, tenants, leases, payments, and maintenance requests.

![Architecture](docs/architecture.svg)

---

## Problem Statement

Property managers and landlords juggle multiple tools — spreadsheets for rent tracking, messaging apps for maintenance, paper leases, manual payment reconciliation. This creates friction, missed payments, and unhappy tenants. PropManager brings the complete rental lifecycle into a single, secure platform.

---

## Key Features

- **Property & Unit Management** — Create properties, add units, track occupancy
- **Tenant Management** — View tenants, assign them to units, manage associations
- **Lease Management** — Create, renew, and track leases with status indicators (Active, Expiring Soon, Expired, Renewed)
- **Rent Collection** — Sandbox payment gateway with success/failure simulation
- **Maintenance Requests** — Full lifecycle: Open → In Progress → Resolved
- **Notifications & Reminders** — Lease renewal and overdue rent alerts
- **Role-Based Access Control** — Landlord, Property Manager, and Tenant roles
- **Dashboards** — Real-time metrics for landlords/managers; simplified portal for tenants
- **Professional UI** — Responsive, accessible, consistent design system

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **Landlord** | Full access to all properties, units, tenants, leases, maintenance, payments. Dashboard with metrics. |
| **Property Manager** | Same as Landlord for properties they manage. Cannot manage properties not assigned to them. |
| **Tenant** | View own lease, pay rent, submit maintenance requests, view notifications. Cannot see other tenants' data. |

### Registration

New users can create an account from the login page:

1. Click **"Create one"** on the sign-in page
2. Fill in full name, email, password, and select a role
3. Password must be at least 8 characters with uppercase, lowercase, and a number
4. After registration, sign in with your new credentials

Demo accounts are also available for quick access without registration.

---

## Architecture

```
User (Browser)
  ↓
React Frontend (Vite + Tailwind CSS)
  ↓
FastAPI Backend (Python)
  ↓
Authentication (JWT) + RBAC Middleware
  ↓
Service Layer (Business Logic)
  ↓
SQLAlchemy ORM → SQLite Database
```

External integrations (sandbox/mock):
- Payment Gateway (simulated)
- Notification/Reminder generation (scheduled via DB checks)

---

## Technology Stack

**Backend:**
- Python 3.13
- FastAPI
- SQLAlchemy 2.0
- SQLite (MVP development)
- python-jose (JWT)
- bcrypt (password hashing)

**Frontend:**
- React 19
- Vite
- Tailwind CSS v4
- React Router
- Axios
- React Hot Toast

---

## Database Overview

| Entity | Key Fields |
|--------|-----------|
| **Users** | id, email, full_name, role, hashed_password |
| **Properties** | id, name, address, city, state, owner_id, property_manager_id |
| **Units** | id, unit_number, unit_type, monthly_rent, status, property_id, tenant_id |
| **Leases** | id, tenant_id, unit_id, start_date, end_date, monthly_rent, status |
| **Maintenance** | id, title, description, priority, status, tenant_id, unit_id |
| **Payments** | id, tenant_id, lease_id, unit_id, amount, status, payment_reference |
| **Notifications** | id, user_id, title, message, type, is_read |

---

## Setup Instructions

### Prerequisites
- Python 3.13+
- Node.js 20+
- npm

### Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

```bash
DATABASE_URL=sqlite:///./propmanager.db
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=480
ENVIRONMENT=development
```

### Running Backend

```bash
cd backend
python3.13 -m pip install fastapi uvicorn sqlalchemy python-jose bcrypt pydantic-settings email-validator python-multipart httpx
python3.13 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The backend auto-seeds demo data on first start.

### Running Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` with API proxy to `http://localhost:8000`.

### Running Tests

```bash
cd backend
python3.13 -m pytest tests/ -v
```

---

## Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| alex@demo.com | demo123 | Landlord |
| sarah@demo.com | demo123 | Property Manager |
| john@demo.com | demo123 | Tenant |
| priya@demo.com | demo123 | Tenant |
| mike@demo.com | demo123 | Tenant |

---

## Main Workflows

### Landlord/Manager Flow
1. Login as landlord → View dashboard with real metrics
2. Create/manage properties and units
3. Assign tenants to units
4. Create leases with start/end dates and rent
5. Monitor maintenance requests and update status
6. View payment history and reconciliation

### Tenant Flow
1. Login as tenant → View simplified portal
2. View lease details and monthly rent
3. Pay rent via sandbox payment gateway
4. Submit maintenance requests
5. Track request status (Open → In Progress → Resolved)
6. Receive notifications for lease renewal and overdue rent

---

## Security / RBAC

- JWT-based authentication with configurable expiry
- User registration with email validation and password strength requirements
- Passwords hashed with bcrypt (never stored as plaintext)
- Backend authorization on every protected endpoint
- Tenant isolation: tenants cannot access other tenants' data
- Ownership checks: landlords can only manage their own properties
- Frontend hides UI elements for unauthorized roles (backend enforces actual security)
- Duplicate email prevention during registration
- Role cannot be changed after registration without backend verification

---

## Payment Sandbox

- No real money is processed
- Create a payment → Receive pending status
- Process payment through sandbox → Simulates success or failure
- Payment records include: reference ID, transaction ID, status, date
- Idempotent: already-paid payments return the existing record

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, seed data, routes
│   │   ├── config.py         # Settings from environment
│   │   ├── database.py       # SQLAlchemy engine & session
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── routers/          # API route handlers
│   │   ├── services/         # Business logic
│   │   └── auth/             # JWT & RBAC
│   ├── tests/                # pytest test suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios API client
│   │   ├── context/          # Auth context
│   │   ├── components/       # Shared UI components
│   │   ├── pages/landlord/   # Admin pages
│   │   └── pages/tenant/     # Tenant portal pages
│   └── package.json
├── docs/                     # Architecture diagrams
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |
| GET | /api/auth/me | Current user |
| GET | /api/dashboard | Landlord dashboard |
| GET | /api/dashboard/tenant | Tenant dashboard |
| CRUD | /api/properties | Property management |
| CRUD | /api/properties/:id/units | Unit management |
| GET | /api/tenants | Tenant list |
| CRUD | /api/leases | Lease management |
| POST | /api/leases/:id/renew | Renew lease |
| CRUD | /api/maintenance | Maintenance requests |
| PATCH | /api/maintenance/:id/status | Update status |
| POST | /api/payments/create | Create payment |
| POST | /api/payments/:id/process | Process payment |
| GET | /api/payments | Payment history |
| GET | /api/notifications | Notifications |
| POST | /api/notifications/read-all | Mark all read |

---

## Known Limitations

- SQLite used for MVP (swap to PostgreSQL for production)
- No file upload for lease documents yet (schema supports it)
- No email notifications (in-app only)
- No automated cron for reminders (generated on API calls)
- Single-server deployment

---

## Future Improvements

- PostgreSQL for production
- File upload for lease documents
- Email/SMS notifications
- Automated cron scheduler for reminders
- Multi-property portfolio analytics
- Online payment gateway integration (Stripe/Razorpay)
- Mobile app
- Lease document e-signing
- Audit log
- Two-factor authentication

---

## License

MIT
