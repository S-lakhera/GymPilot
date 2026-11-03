# GymPilot — Functional Requirements & Business Rules

---

## 1. System Roles & Access Control

GymPilot enforces strict **Role-Based Access Control (RBAC)** at the API middleware layer. Frontend UI route protections act as presentation guards only.

### 1.1 Role Definitions
1. **Admin**
   - Full operational management of the gym facility.
   - Manages members, trainers, membership plan categories, plans, subscriptions, and payments.
   - Accesses financial analytics, dashboard metrics, and audit logs.
2. **Trainer**
   - View assigned members and their profile information.
   - (Phase 6) Create and manage customized workout plans and routines.
3. **Member**
   - Self-service portal for personal profile information.
   - View current active subscriptions, queued renewals, and subscription history.
   - Access billing receipts and payment logs.
   - (Phase 6) View assigned workout plans and personal attendance logs.

### 1.2 Permissions Matrix

| Capability / API Endpoint | Admin | Trainer | Member |
| :--- | :---: | :---: | :---: |
| Self-Registration (`POST /api/auth/register`) | ❌ | ❌ | ✅ |
| Staff / Trainer Creation (`POST /api/trainers`) | ✅ | ❌ | ❌ |
| View All Members (`GET /api/users/members`) | ✅ | ❌ | ❌ |
| View Assigned Members (`GET /api/trainers/assigned-members`) | ✅ | ✅ | ❌ |
| View Own Profile (`GET /api/users/me`) | ✅ | ✅ | ✅ |
| Update Own Profile (`PUT /api/users/me`) | ✅ | ✅ | ✅ |
| Manage Plan Categories (`POST, PUT, DELETE /api/categories`) | ✅ | ❌ | ❌ |
| Manage Membership Plans (`POST, PUT, DELETE /api/plans`) | ✅ | ❌ | ❌ |
| Browse Available Plans (`GET /api/plans`) | ✅ | ✅ | ✅ |
| Create / Renew Subscription (`POST /api/subscriptions`) | ✅ | ❌ | ✅ |
| Cancel Subscription (`PATCH /api/subscriptions/:id/cancel`) | ✅ | ❌ | ❌ |
| View All Payments / Financials (`GET /api/payments`) | ✅ | ❌ | ❌ |
| View Own Payments (`GET /api/payments/me`) | ❌ | ❌ | ✅ |
| View Admin Dashboard Metrics (`GET /api/dashboard/stats`) | ✅ | ❌ | ❌ |

---

## 2. Core Modules Specification

### 2.1 Authentication & User Management
- **Password Security:** All passwords hashed using `bcryptjs` with salt rounds $\ge 10$. Passwords never returned in API responses.
- **Tokens:** Stateless JSON Web Tokens (JWT) signed with `JWT_SECRET`, containing `userId`, `email`, and `role`.
- **Hybrid Onboarding:**
  - Members can register self-service accounts online.
  - Front-desk Admins can register members directly.
  - Trainers and additional Admins can only be provisioned by authenticated Admins.
- **Account Status Enforcement:**
  - If `is_active = FALSE` or `deleted_at IS NOT NULL`, login attempts are rejected with HTTP 403 Forbidden.

### 2.2 Plan Categories & Membership Plans
- **Dynamic Categories:** Categories (e.g. *Strength Training*, *Cardio / HIIT*, *Yoga & Flexibility*, *CrossFit*) are managed in a normalized table (`plan_categories`).
- **Referential Protection:** Deactivating a category hides it from new plan creation without deleting associated plans or historical subscriptions.
- **Plan Durations:** Defined as explicit integer `duration_days` (e.g. 30, 90, 180, 365) to eliminate month-length ambiguities across calendar years.
- **Pricing:** Stored as `DECIMAL(10, 2)`. When a plan's price changes, existing subscriptions retain their historical `price_paid`.

### 2.3 Subscriptions Lifecycle & Business Rules
1. **Multi-Subscription Model:**
   - A member may maintain multiple concurrent active subscriptions across **different categories** (e.g., Active in Strength + Active in Yoga).
2. **Category-Isolated Overlap Prevention:**
   - A member **cannot** have overlapping active subscriptions for the **same category**.
   - Concurrency protection: Overlap validation queries use row locking (`FOR UPDATE`) within an ACID transaction.
3. **Queued Renewals:**
   - If a member has an active subscription in Category X expiring on date $E$:
     - A renewal subscription for Category X is assigned status `'queued'`.
     - `start_date` is automatically set to $E + 1\text{ day}$.
     - `end_date` is calculated as $\text{start\_date} + \text{duration\_days}$.
   - If the previous subscription has already expired, the new subscription begins immediately (`CURRENT_DATE`) or on an explicitly selected future start date.
4. **Subscription Status Flow:**
   - `queued` $\rightarrow$ `active` $\rightarrow$ `expired`
   - `active` $\rightarrow$ `cancelled`
5. **Daily Maintenance & Query Synchronization:**
   - Daily automated task transitions expired active subscriptions (`end_date < CURRENT_DATE`) to `'expired'`, and promotes queued subscriptions (`start_date <= CURRENT_DATE`) to `'active'`.
   - Read queries also validate bounds dynamically to eliminate status drift.

### 2.4 Payments & Financial Transactions
1. **Atomic Provisioning:**
   - Creating or renewing a subscription executes inside a single database transaction with its corresponding payment record.
   - If payment recording fails, the subscription creation is rolled back immediately.
2. **Payment Tracking:**
   - Payment record logs `subscription_id`, `user_id`, `amount`, `payment_method` (`CASH`, `CARD`, `UPI`, `NET_BANKING`), `payment_status` (`COMPLETED`, `REFUNDED`, `FAILED`), and `transaction_reference`.
3. **Audit Immutability:**
   - Payment records cannot be deleted. Any adjustments require recording an explicit refund status or adjustment entry.

---

## 3. Timezone & Temporal Policy

- **Standard Timezone:** Indian Standard Time (`Asia/Kolkata`, `UTC+05:30`).
- **Calendar Boundaries:** Stored as `DATE` (YYYY-MM-DD) for start dates, expiry dates, and dates of birth to prevent hour/minute conversion shifts.
- **Event & Audit Timestamps:** Stored as `DATETIME` defaulting to `CURRENT_TIMESTAMP`.
- **Database Connection:** MySQL session configured with `timezone: '+05:30'` and `dateStrings: true` to prevent automatic Node.js UTC date offsetting.

