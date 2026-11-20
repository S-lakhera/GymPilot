# GymPilot — Functional Requirements & Business Rules

---

## 1. System Roles & Access Control

GymPilot enforces strict **Role-Based Access Control (RBAC)** at the API middleware layer. Frontend UI route protections act as presentation guards only.

### 1.1 Role Definitions
1. **Admin**
   - Full operational management of the gym facility.
   - Manages members, trainers, membership plan categories, plans, discounts, subscriptions, and financial refunds.
   - Reviews coach assignment requests, oversees live attendance floor presence, and manages membership expirations desk.
   - Accesses financial analytics, dashboard metrics, and audit logs.
2. **Trainer**
   - View assigned athletes, manage client capacity, and track member workout progress.
   - Author multi-day workout split routines and custom exercise catalogs.
   - Inspect athlete attendance history and live on-floor presence.
3. **Member**
   - Self-service portal for personal profile and emergency contact information.
   - View active memberships, scheduled renewal queues, and pass history.
   - Request personal trainers, follow active workout routines, check off daily exercise completions, and inspect personal 16-week attendance heatmaps.
   - Receive real-time and scheduled notifications for pass renewals and coaching updates.

### 1.2 Permissions Matrix

| Capability / API Endpoint | Admin | Trainer | Member |
| :--- | :---: | :---: | :---: |
| Self-Registration (`POST /api/auth/register`) | ❌ | ❌ | ✅ |
| Staff / Trainer Creation (`POST /api/trainers`) | ✅ | ❌ | ❌ |
| View All Members (`GET /api/users/members`) | ✅ | ❌ | ❌ |
| View Own Profile (`GET /api/users/profile`) | ✅ | ✅ | ✅ |
| Update Own Profile (`PATCH /api/users/profile`) | ✅ | ❌ | ✅ |
| Update Trainer Profile (`PATCH /api/trainers/:id`) | ✅ | ✅ | ❌ |
| Change Password (`PATCH /api/auth/change-password`) | ✅ | ✅ | ✅ |
| Manage Plan Categories (`POST, PUT, DELETE /api/categories`) | ✅ | ❌ | ❌ |
| Manage Membership Plans (`POST, PUT, DELETE /api/plans`) | ✅ | ❌ | ❌ |
| Browse Available Plans (`GET /api/plans`) | ✅ | ✅ | ✅ |
| Create / Renew Subscription (`POST /api/subscriptions/checkout`) | ✅ | ❌ | ✅ |
| Cancel Queued Subscription (`PATCH /api/subscriptions/:id/cancel`) | ✅ | ❌ | ✅ |
| View Financial Ledger (`GET /api/payments`) | ✅ | ❌ | ❌ |
| Process Refunds (`POST /api/refunds`) | ✅ | ❌ | ❌ |
| View Admin Dashboard Metrics (`GET /api/dashboard/admin`) | ✅ | ❌ | ❌ |
| View Trainer Dashboard Metrics (`GET /api/dashboard/trainer`) | ❌ | ✅ | ❌ |
| View Member Dashboard Metrics (`GET /api/dashboard/member`) | ❌ | ❌ | ✅ |
| Check-in Member (`POST /api/attendance/check-in`) | ✅ | ❌ | ❌ |
| Check-out Member (`POST /api/attendance/check-out`) | ✅ | ❌ | ❌ |
| View Live Floor Headcount (`GET /api/attendance/live`) | ✅ | ✅ | ❌ |
| View Own Attendance Heatmap (`GET /api/attendance/my-heatmap`) | ❌ | ❌ | ✅ |
| View Client Attendance (`GET /api/attendance/client/:memberId`) | ✅ | ✅ | ❌ |
| Submit Coach Request (`POST /api/coaching/requests`) | ❌ | ❌ | ✅ |
| Review Coach Request (`PATCH /api/coaching/requests/:id`) | ✅ | ❌ | ❌ |
| View Trainer Athlete Roster (`GET /api/coaching/roster`) | ✅ | ✅ | ❌ |
| Terminate Coach Assignment (`PATCH /api/coaching/assignments/:id/terminate`) | ✅ | ❌ | ❌ |
| Browse Exercise Catalog (`GET /api/workouts/exercises`) | ✅ | ✅ | ✅ |
| Create Custom Exercise (`POST /api/workouts/exercises`) | ❌ | ✅ | ❌ |
| View Own Active Workout Plan (`GET /api/workouts/my-plan`) | ❌ | ❌ | ✅ |
| Author Workout Plan (`POST /api/workouts`) | ❌ | ✅ | ❌ |
| Update Workout Plan (`PUT /api/workouts/:id`) | ❌ | ✅ | ❌ |
| Delete Workout Plan (`DELETE /api/workouts/:id`) | ❌ | ✅ | ❌ |
| View Notifications Feed (`GET /api/notifications`) | ✅ | ✅ | ✅ |
| Mark Notification Read (`PATCH /api/notifications/:id/read`) | ✅ | ✅ | ✅ |
| View Expirations Desk (`GET /api/notifications/expirations`) | ✅ | ❌ | ❌ |
| Trigger Manual Expiration Reminder (`POST /api/notifications/remind-member`) | ✅ | ❌ | ❌ |

---

## 2. Core Modules Specification

### 2.1 Authentication & User Management
- **Password Security:** All passwords hashed using `bcryptjs` with salt rounds $\ge 10$. Passwords never returned in API responses.
- **Tokens:** Stateless JSON Web Tokens (JWT) signed with `JWT_ACCESS_SECRET` (15m expiry), and rotating refresh tokens in HTTP-only cookies signed with `JWT_REFRESH_SECRET` (7d expiry).
- **Session Revocation:** Refresh tokens stored as SHA-256 hashes in `refresh_tokens`. Password changes or manual logouts immediately invalidate active token families.

### 2.2 Plan Categories & Membership Plans
- **Dynamic Categories:** Categories (e.g. *Strength Training*, *Cardio / HIIT*, *Yoga & Flexibility*, *CrossFit*) are managed in `plan_categories`.
- **Referential Protection:** Deactivating a category hides it from new plan creation without deleting associated plans or historical subscriptions.
- **Explicit Durations:** Defined as explicit integer `duration_days` (e.g. 30, 90, 180, 365) to eliminate month-length ambiguities across calendar years.
- **Pricing:** Stored as `DECIMAL(10, 2)`. When a plan's price changes, existing subscriptions retain their historical `price_paid`.

### 2.3 Subscriptions Lifecycle & Business Rules
1. **Multi-Subscription Model:**
   - A member may maintain multiple concurrent active subscriptions across **different categories** (e.g., Active in Strength + Active in Yoga).
2. **Category-Isolated Overlap Prevention:**
   - A member **cannot** have overlapping active subscriptions for the **same category**.
   - Concurrency protection: Overlap validation queries use pessimistic row locking (`FOR UPDATE`) within an ACID transaction.
3. **Queued Renewals:**
   - If a member has an active subscription in Category X expiring on date $E$:
     - A renewal subscription for Category X is assigned status `'queued'`.
     - `start_date` is automatically set to $E + 1\text{ day}$.
     - `end_date` is calculated as $\text{start\_date} + \text{duration\_days}$.
4. **Subscription Status Flow:**
   - `queued` $\rightarrow$ `active` $\rightarrow$ `expired`
   - `active` $\rightarrow$ `cancelled`

### 2.4 Payments, Discounts & Refunds
1. **Atomic Provisioning:**
   - Creating or renewing a subscription executes inside a single database transaction with its corresponding payment record.
   - If payment recording fails, the subscription creation is rolled back immediately.
2. **Promotional Discounts:**
   - Supports fixed or percentage discounts with maximum discount caps, minimum order thresholds, and per-user/global redemption limits.
3. **Immutable Refunds:**
   - Payment records cannot be deleted. Any returns require recording an explicit record in `refunds` with reason tracking and ceiling checks.

### 2.5 Trainer-Member Assignment Subsystem (Milestone 6.1)
1. **1:N Cardinality & Capacity Locking:**
   - A member can have at most **one** `ACTIVE` or `PAUSED` coach assignment at any given time.
   - Trainers possess individual capacity ceilings (`max_clients`, default 10). Soft capacity alerts warn administrators during review, with explicit admin overrides permitted.
2. **Request Review Lifecycle:**
   - Members submit coach requests (`trainer_assignment_requests`).
   - Administrators approve or reject requests with audit logging (`reviewed_by_id`, `rejection_reason`).
3. **10-Day Grace Period Engine:**
   - If a member's gym subscription expires, their active coach assignment is automatically transitioned to `PAUSED` with a 10-day grace period window (`grace_period_ends_at`).
   - If the member renews within 10 days, the coach assignment automatically reactivates to `ACTIVE`.
   - If 10 days elapse without renewal, the assignment is terminated with reason `GRACE_PERIOD_EXPIRED`.

### 2.6 Attendance Management & Visual Analytics (Milestone 6.2)
1. **Check-In & Check-Out Desk:**
   - Front-desk administrators check in members via search. Soft warnings display if membership is expired or inactive, allowing staff override.
   - 1-click check-out records checkout timestamp and calculates duration in minutes.
2. **Live Floor Presence:**
   - Real-time roster and counter of members currently on-floor (`check_out_time IS NULL`), persisting sessions across midnight.
3. **GitHub-Style 16-Week Heatmap:**
   - Member and trainer portals display authentic 16-week activity heatmaps aligned to Indian Standard Time (`UTC+05:30`), with daily session intensity and current streak tracking.

### 2.7 Workout Plan Management Subsystem (Milestone 6.3)
1. **Curated Exercise Catalog:**
   - System standard catalog of 28 core exercises across 8 muscle groups (`chest`, `back`, `legs`, `shoulders`, `arms`, `core`, `full_body`, `cardio`).
   - Trainers can author custom exercises tied to their trainer profile.
2. **Multi-Day Split Routine Builder:**
   - Trainers construct routines across multi-day splits with target focus, exercises, sets, reps, and rest intervals.
3. **Single Active Plan Exclusivity:**
   - A member has at most one active workout plan. Assigning a new routine automatically archives previous active plans atomically.
4. **Member Daily Session Checklist:**
   - Interactive day switcher with checklist completion state persisted in `localStorage` alongside celebratory completion badges.

### 2.8 Membership Expiration Tracking & Notification Center (Milestone 6.4)
1. **Idempotent Expiration Engine:**
   - Background synchronization runner executing on startup and recurring every 12 hours.
   - Detects memberships expiring in 7 days (`PASS_EXPIRING_7D`), 3 days (`PASS_EXPIRING_3D`), and passes expired today (`PASS_EXPIRED`).
   - Deduplicated using deterministic unique constraint keys (`event_key`, e.g., `EXP_7D_SUB_42`).
2. **Role-Aware Notification Center:**
   - Floating `<NotificationBell />` header component with unread badges, instant mark-as-read, and deep links.
3. **Admin Expirations Desk:**
   - Dedicated workspace (`/admin/expirations`) with metrics cards, expiration window filters, search, and manual reminder triggers.

---

## 3. Timezone & Temporal Policy

- **Standard Timezone:** Indian Standard Time (`Asia/Kolkata`, `UTC+05:30`).
- **Calendar Boundaries:** Stored as `DATE` (YYYY-MM-DD) for start dates, expiry dates, and dates of birth to prevent hour/minute conversion shifts.
- **Event & Audit Timestamps:** Stored as `DATETIME` defaulting to `CURRENT_TIMESTAMP`.
- **Database Connection:** MySQL session configured with `timezone: '+05:30'` and `dateStrings: true` to prevent automatic Node.js UTC date offsetting.
