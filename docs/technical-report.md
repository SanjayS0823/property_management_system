# PropManager — Technical Report

## 1. Architecture Decisions

### Backend Framework: FastAPI
FastAPI was chosen for its automatic OpenAPI documentation, native async support, dependency injection system, and Pydantic integration. This gives us type-safe request/response validation out of the box.

### Database: SQLite
SQLite is used for MVP development to minimize setup complexity. The SQLAlchemy ORM abstracts the database layer, making migration to PostgreSQL straightforward for production. The `DATABASE_URL` environment variable controls the backend connection.

### Authentication: JWT
JSON Web Tokens with HS256 signing provide stateless authentication. Tokens include user ID and role, verified on every protected endpoint. bcrypt handles password hashing.

### Frontend: React + Tailwind CSS v4
React provides the component architecture. Tailwind CSS v4 with the Vite plugin enables rapid, consistent styling without a separate build step.

---

## 2. Database Design

### Entity Relationships

```
Users (1) ──→ (N) Properties       [owner]
Users (1) ──→ (N) Properties       [property_manager]
Properties (1) ──→ (N) Units
Units (1) ──→ (N) Leases
Units (1) ──→ (N) Payments
Leases (1) ──→ (N) Payments
Users (1) ──→ (N) Leases           [tenant]
Users (1) ──→ (N) Maintenance      [tenant]
Users (1) ──→ (N) Notifications
```

### Key Design Choices

- **Enum types** for status fields (UserRole, LeaseStatus, PaymentStatus, etc.) ensure data consistency
- **Foreign keys with proper constraints** prevent orphaned records
- **Timestamps on all entities** for audit trail
- **Soft status on properties** (active/inactive) rather than hard deletes

---

## 3. API Design

### REST Conventions

- `GET /resource` — List
- `GET /resource/:id` — Get one
- `POST /resource` — Create
- `PUT /resource/:id` — Update
- `PATCH /resource/:id/status` — Partial update for specific operations
- `POST /resource/:id/action` — Action endpoints (e.g., renew, process)

### Response Format

All responses use JSON. Errors return appropriate HTTP status codes with a `detail` message.

---

## 4. RBAC Design

### Role Hierarchy

```
Landlord
  ├── Property Manager (assigned properties only)
  └── Tenant (own data only)
```

### Implementation

1. **Frontend**: Conditional rendering hides UI elements based on role
2. **Backend**: `require_role()` decorator validates JWT role claim
3. **Data-level**: Each query filters by ownership/association
4. **Authorization checks**: Every endpoint verifies the user has the right to access the specific resource, not just the resource type

### Example: Tenant Isolation

```
Tenant A requests: GET /api/leases/42
Backend:
  1. Decode JWT → user_id = 3, role = tenant
  2. Fetch lease where id = 42
  3. Check: lease.tenant_id == user_id? → Yes: allow. No: 403.
```

---

## 5. Payment Integration

### Sandbox Mode

The payment flow simulates a gateway without real money:

1. Tenant creates a payment request (creates PENDING record)
2. Frontend calls process endpoint with success/failure flag
3. Backend updates payment status to PAID or FAILED
4. Response includes simulated gateway response with transaction ID

### Idempotency

- Payments are identified by unique `payment_reference` (UUID-based)
- Already-paid payments return the existing record without reprocessing
- Webhook endpoint validates payment references

---

## 6. Maintenance Workflow

### Status Lifecycle

```
OPEN → IN_PROGRESS → RESOLVED
```

### Access Control

- **Tenants** can create requests for their own units only
- **Landlords/Managers** can update status on requests for their properties
- **Tenants** cannot update status (only view)
- **Tenants** cannot modify other tenants' requests

---

## 7. Notification Logic

### Trigger-Based Generation

Notifications are generated when:
- Lease end date is within 30 days (renewal reminder)
- Payment is past due date (overdue reminder)

### Deduplication

Before creating a notification, the system checks for existing notifications of the same type on the same day for the same user. This prevents duplicate reminders.

---

## 8. Testing Strategy

### Test Categories

- **Authentication**: Login, register, token validation
- **RBAC**: Role-based access for all endpoints
- **CRUD**: Property, unit, lease, maintenance, payment operations
- **Business Logic**: Lease renewal, duplicate prevention, date validation
- **Tenant Isolation**: Cross-tenant access prevention
- **Payment**: Success, failure, authorization checks

### Test Count: 41 passing

---

## 9. Trade-offs

| Decision | Trade-off |
|----------|----------|
| SQLite | Easy setup vs. production scalability |
| Sandbox payments | Demo-ready vs. real payment processing |
| JWT without refresh tokens | Simplicity vs. security for long sessions |
| No file upload | MVP scope vs. full feature set |
| In-app notifications only | Simplicity vs. email/SMS delivery |

---

## 10. Known Limitations

1. SQLite not suitable for concurrent production workloads
2. No automated cron scheduler for reminder generation
3. No file storage for lease documents
4. No email/SMS notification delivery
5. No audit logging
6. No two-factor authentication
7. Single-server deployment only

---

## 11. Future Improvements

1. PostgreSQL migration
2. File upload with S3-compatible storage
3. Email/SMS notification integration
4. Cron-based reminder scheduling
5. Stripe/Razorpay payment integration
6. Audit logging
7. Multi-factor authentication
8. Mobile-responsive PWA
9. Portfolio analytics dashboard
10. Lease e-signing integration
