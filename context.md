# GymPilot — Project Context

## 1. Project Overview

**Project Name:** GymPilot  
**Project Type:** Full-Stack Gym Management Platform  
**Project Description:** A web-based gym management platform that allows gym administrators to manage members, trainers, membership plans, subscriptions, payments, attendance, and workout plans.

GymPilot is being developed as a portfolio project to demonstrate practical knowledge of relational database management, SQL, backend engineering, REST API development, and full-stack application development.

The primary learning objective is to gain practical experience with MySQL and understand how relational databases are designed, queried, optimized, and integrated into real-world backend applications.

This project should prioritize clean architecture, relational database design, data integrity, maintainability, and meaningful business logic rather than unnecessary features.

---

## 2. Technology Stack

### Frontend

- React.js
- Vite
- JavaScript
- Tailwind CSS
- React Router
- Axios

### Backend

- Node.js
- Express.js
- JavaScript
- JWT Authentication
- bcrypt for password hashing
- express-validator for request validation

### Database

- MySQL 8
- mysql2 Node.js package
- MySQL connection pooling
- MySQL Workbench for database management and visualization

### Development Tools

- Git and GitHub
- Postman
- VS Code / Antigravity IDE
- npm

**Important:** Use native SQL queries through mysql2. Do not introduce Prisma, Sequelize, TypeORM, or another ORM.

The objective is to develop a strong understanding of SQL and relational database operations by writing actual SQL queries.

---

## 3. Application Roles

The application will initially support three roles.

### Admin

- Manage gym members.
- Manage trainers.
- Create and update membership plans.
- Assign membership plans to members.
- Manage subscriptions.
- View and manage payment records.
- Monitor attendance.
- Access dashboard statistics and reports.

### Trainer

- View assigned members.
- View member information.
- Create and manage workout plans.
- View assigned workout routines.

### Member

- View personal profile.
- View current membership details.
- View subscription history.
- View payment history.
- View assigned workout plans.
- View attendance history.

Role-based access control must be implemented on the backend. Frontend route protection alone is not sufficient.

---

## 4. Core Application Modules

The initial application will contain the following modules:

1. Authentication
2. Users / Members
3. Trainers
4. Membership Plans
5. Subscriptions
6. Payments
7. Dashboard and Statistics

Additional modules will be introduced in later development phases:

8. Attendance Management
9. Workout Plan Management
10. Trainer-Member Assignment
11. Reports and Analytics

Do not implement all modules simultaneously. Follow the development roadmap.

---

## 5. Database Design Principles

MySQL is the primary database of this application.

Database design must follow relational database principles.

### Initial entities

- users
- trainer_profiles
- plans
- subscriptions
- payments
- attendance
- workout_plans
- exercises
- workout_exercises
- trainer_member_assignments

These are proposed entities, not a finalized schema.

The agent must analyze relationships and business requirements before generating SQL table definitions.

### Important database rules

1. Every table must have an appropriate primary key.
2. Use foreign keys to establish relational integrity.
3. Use appropriate data types for every column.
4. Apply NOT NULL, UNIQUE, DEFAULT and CHECK constraints wherever appropriate.
5. Avoid unnecessary duplication of data.
6. Follow database normalization principles (1NF, 2NF and 3NF).
7. Use indexes for frequently queried columns where justified.
8. Avoid storing multiple values in a single column.
9. Preserve historical subscription and payment records.
10. Use appropriate DECIMAL types for monetary values.
11. Store timestamps consistently and define a clear timezone policy.
12. Use parameterized queries to prevent SQL injection.

### Important relational considerations

- A user can have multiple subscriptions over time.
- A membership plan can be associated with multiple subscriptions.
- A trainer can be assigned to multiple members.
- A member can have multiple workout plans.
- A workout plan can contain multiple exercises.
- A subscription can have associated payment records.

The exact cardinalities and foreign key relationships must be finalized during database design.

### Transaction management

Transactions must be used for operations that involve multiple dependent database changes.

For example, creating a subscription and recording its corresponding payment should be handled atomically where applicable.

If one operation fails, the entire transaction must roll back.

The agent must pay particular attention to ACID properties and data consistency.

---

## 6. Backend Architecture

The backend must follow a modular five-layer architecture.

**Route → Controller → Service → Repository → Model**

### Layer responsibilities

**Routes**

- Define API endpoints.
- Apply authentication and authorization middleware.
- Attach validation middleware.

**Controllers**

- Handle HTTP requests and responses.
- Extract request data.
- Call appropriate service methods.
- Return consistent API responses.

**Services**

- Implement business logic.
- Coordinate multiple repository operations.
- Handle transaction workflows.
- Enforce business rules.

**Repositories**

- Contain SQL queries.
- Communicate with the MySQL database.
- Handle database operations.
- Use mysql2 connection pools and transactions.

**Models**

- Define database entity representations and relevant constants.
- Keep database-related structure organized.
- Do not introduce an ORM.

The service layer must not contain raw SQL queries. Database queries belong in the repository layer.

### Dashboard Module Architecture (Milestone 4.4)

All dashboard aggregation operations reside in a dedicated, unified dashboard module: `dashboardRoutes.js` → `dashboardController.js` → `dashboardService.js` → `dashboardRepository.js`.

#### 1. Role-Specific Endpoints
GymPilot strictly exposes three role-specific dashboard endpoints:
- `GET /api/dashboard/admin` (Admin only)
- `GET /api/dashboard/trainer` (Trainer only)
- `GET /api/dashboard/member` (Member only)

*(Note: A duplicate or unified `/api/dashboard` route is strictly prohibited).*

#### 2. Authentication & RBAC Authorization
- Every dashboard route requires `verifyToken` authentication and `requireRoles('admin' | 'trainer' | 'member')`.
- Missing or invalid token returns `401 Unauthorized`.
- Authenticated user with mismatched role returns `403 Forbidden`.
- Authenticated user with matching role returns `200 OK`.
- Never rely on frontend checks for backend security.

#### 3. Strict User Data Isolation
- Dashboard queries derive identity exclusively from `req.user.id` and `req.user.role`.
- Never accept a client-supplied user ID parameter to determine dashboard scope.
- Admin dashboard retrieves authorized gym-wide aggregates and financial logs.
- Trainer dashboard retrieves records scoped strictly to the authenticated trainer.
- Member dashboard retrieves records scoped strictly to the authenticated member.

#### 4. Dashboard SQL Aggregation Principles
- Native MySQL queries via `mysql2/promise`.
- Leverage conditional aggregation (`COUNT(CASE WHEN ... THEN 1 END)`, `SUM(...)`), `COALESCE`, `LEFT JOIN`, and targeted subqueries.
- Never fetch complete table collections into Node.js to compute metrics. Avoid N+1 queries.
- Avoid multi-table 1:N joins that cause cartesian row multiplication and inflate financial or membership totals; use separate targeted queries.
- Clearly distinguish **Gross Completed Payments** from **Net Revenue** (Net Revenue = Completed Payments − Completed Refunds). Never label gross receipts as net revenue.
- Filter out soft-deleted records (`deleted_at IS NULL`) and enforce status business rules.
- Self-healing bounds: Ensure queries calculate active/expiring/expired subscriptions correctly even if the daily status sync cron has not executed yet.
- Limit and paginate recent activity and transaction feeds.

#### 5. Backend-First Scope
- Backend dashboard module, SQL aggregations, and automated tests are implemented in this milestone. Frontend navigation and PWA requirements serve as architectural context for Phase 5.

### Subscription Status Maintenance & Synchronization Lifecycle

The subscription lifecycle includes automated status transitions (active expiry, queued activation, stale checkout purge).

#### 1. Maintenance Endpoint (`POST /api/subscriptions/sync-statuses`)
- Administrative maintenance endpoint (`subscriptionService.syncStatuses()`) that performs batch database reconciliation:
  1. **Expiry Transition:** Updates subscriptions where `status = 'active'` and `end_date < CURRENT_DATE` to `status = 'expired'`.
  2. **Queued Promotion:** Promotes subscriptions where `status = 'queued'` and `start_date <= CURRENT_DATE` to `status = 'active'`, verifying no active subscription is concurrently running in that plan category.
  3. **Stale Checkout Purge:** Cancels uncompleted `pending_payment` checkouts and transitions corresponding `PENDING` payments older than 24 hours to `FAILED`.

#### 2. Invocation Architecture: External Trigger vs In-Process Scheduler
- **Current Model (On-Demand / External Cron Hook):** Status maintenance is exposed as a protected Admin HTTP endpoint (`POST /api/subscriptions/sync-statuses`). It is intentionally **not run by an in-process Node.js scheduler** (`node-cron` or `setInterval`) at this stage.
  - Keeps the Node.js API server completely stateless.
  - Prevents race conditions and duplicate job runs when the application runs across multiple clustered processes or horizontal containers.
  - In staging/production environments, this endpoint is invoked on a scheduled cadence (e.g. daily at 00:01 IST) by external infrastructure schedulers (such as Linux `crontab`, AWS EventBridge, cloud cron runners, or Admin dashboard maintenance actions).

#### 3. Self-Healing Query Design
- To ensure continuous accuracy regardless of whether the maintenance job has run, all dashboard and subscription read queries use **self-healing calendar date bounds**:
  - `active`: requires both `status = 'active'` and `start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE`.
  - `expired`: includes both `status = 'expired'` and `(status = 'active' AND end_date < CURRENT_DATE)`.
- This ensures metrics, member gym access, and financial feeds remain 100% accurate in real time without hard dependency on cron timing.

---

## 7. Frontend Architecture

Follow a modular frontend architecture:

**API → Hooks → State → UI**

Responsibilities:

- API: Centralized Axios instances and API functions.
- Hooks: Reusable application logic and data fetching.
- State: Shared authentication and application state.
- UI: Components, pages, layouts and reusable interface elements.

The frontend should have separate layouts and protected routes based on user roles.

Maintain reusable components and avoid unnecessarily large components.

### Frontend Role-Aware Navigation & PWA Specification

#### 1. Public Landing Page & Route Map
- `/`: Public landing page accessible to all users. Authenticated users can freely revisit `/` via the GymPilot logo or Home link; they are not forced away.
- `/login`: User authentication page.
- `/register`: Public new member registration.
- `/app`: PWA entry point and authentication restoration gate.
- `/admin/dashboard`: Admin dashboard.
- `/trainer/dashboard`: Trainer dashboard.
- `/member/dashboard`: Member dashboard.

#### 2. Navbar Role-Aware Dashboard Redirection
The shared navigation bar displays a dynamic "Dashboard" button. When clicked:
- `admin` $\rightarrow$ `/admin/dashboard`
- `trainer` $\rightarrow$ `/trainer/dashboard`
- `member` $\rightarrow$ `/member/dashboard`

Each dashboard page independently requests its corresponding backend endpoint (`/api/dashboard/admin`, `/api/dashboard/trainer`, or `/api/dashboard/member`).

#### 3. PWA Entry Point (`/app`) & Startup Flow
Configured PWA manifest:
```json
{
  "start_url": "/app",
  "scope": "/",
  "display": "standalone"
}
```
**Startup Lifecycle:**
1. Display a clean loading / splash indicator.
2. Attempt silent session restoration by calling `POST /api/auth/refresh` (the browser automatically sends the HttpOnly refresh token cookie).
3. If refresh succeeds:
   - Store new access token in frontend memory.
   - Fetch authenticated profile via `GET /api/auth/me`.
   - Read user role and navigate directly to the appropriate dashboard (`/admin/dashboard`, `/trainer/dashboard`, or `/member/dashboard`).
4. If refresh fails (session expired, revoked, or non-existent):
   - Clear any stale frontend authentication state.
   - Redirect to `/login` or public `/`.
5. Support direct deep-linking and browser page refreshes seamlessly without re-prompting active users.

#### 4. Centralized Axios Authentication & Refresh Interceptor
- Single centralized Axios client instance.
- Request interceptor automatically attaches in-memory access token via `Authorization: Bearer <token>`.
- Response interceptor intercepts `401 Unauthorized`.
- Implements a **single-flight refresh mutex/promise queue** to prevent multiple concurrent requests from triggering redundant token refresh calls.
- Retries the failed original request once after token rotation.
- Re-entrancy guards prevent infinite refresh retry loops.
- Clears auth state and redirects to login if refresh fails.

---

## 8. Coding Standards

1. Use JavaScript consistently throughout the project.
2. Use ES modules.
3. Follow consistent naming conventions.
4. Use async/await for asynchronous operations.
5. Handle errors centrally.
6. Validate all incoming request data.
7. Never expose passwords or sensitive authentication information in API responses.
8. Never store passwords in plain text.
9. Never construct SQL queries by directly concatenating user input.
10. Use environment variables for secrets and configuration.
11. Keep controllers thin and business logic inside services.
12. Keep repositories focused on database operations.
13. Avoid unnecessary abstractions and overengineering.
14. Write meaningful comments only where logic needs clarification.

---

## 9. SQL Learning Objectives

This project must provide practical exposure to the following concepts:

### Fundamentals

- CREATE, ALTER and DROP
- INSERT, UPDATE and DELETE
- SELECT and filtering
- ORDER BY and LIMIT
- DISTINCT

### Relational Database Concepts

- Primary keys and foreign keys
- One-to-one relationships
- One-to-many relationships
- Many-to-many relationships
- Database normalization
- Constraints and referential integrity

### Intermediate SQL

- INNER JOIN
- LEFT JOIN
- RIGHT JOIN
- GROUP BY
- HAVING
- Aggregate functions
- Subqueries

### Advanced SQL

- Transactions
- ACID properties
- Indexes and composite indexes
- Views
- Stored procedures
- EXPLAIN
- Query optimization
- Concurrent database operations
- Row-level locking

The agent should explain relevant SQL concepts when implementing database-related features, especially when a design decision involves trade-offs.

---

## 10. Development Roadmap

Development must follow these phases.

### Phase 1: Requirements and Planning [COMPLETED]

- [x] Define application requirements (Documented in `docs/requirements.md`).
- [x] Finalize user roles and permissions (Admin, Trainer, Member RBAC matrix).
- [x] Identify modules (Core 1-7 for Phase 2-4; Extended modules for Phase 6).
- [x] Define business rules (Multi-subscription, category overlap prohibition, queued renewals, atomic payments, Asia/Kolkata timezone, hybrid deletion policy).
- [x] Prepare database ER diagram (Documented in `docs/erd.md` with Mermaid diagram & data dictionary).
- [x] Finalize initial relational entities (users, member_profiles, trainer_profiles, plan_categories, plans, subscriptions, payments).
- [x] Scaffold repository architecture: `server/server.js` at root, 5-layer backend hierarchy, role-segmented client hierarchy, and `docs/` suite.

### Phase 2: Database Design [COMPLETED]

- [x] Configure MySQL and connection pool (`server/src/config/db.js` with IST +05:30 and dateStrings).
- [x] Create the GymPilot database (`gympilot_db`).
- [x] Design tables and relationships (7 Core tables in `server/database/schema.sql`).
- [x] Define constraints (PKs, FKs, UNIQUE, NOT NULL, CHECK, CASCADE on 1:1 profiles, RESTRICT on financial/historical).
- [x] Apply normalization (3NF normalized plan_categories, 1:1 extension tables, atomic transactions).
- [x] Create purpose-built indexes (login email O(1), overlap checks, daily expiry status, revenue date ranges).
- [x] Insert sample data (`server/database/seeds.sql` with affordable Indian rates, diverse member lifecycles, Password@123).
- [x] Test important SQL queries (13 verified queries in `server/database/queries.sql` with EXPLAIN execution plan analysis).
- [x] Provide database runner scripts (`npm run db:init`, `npm run db:seed`, `npm run db:reset`).

### Phase 3: Backend Foundation [COMPLETED]

- [x] Initialize Express application with cookie-parser, CORS credentials, and Swagger UI (`/api/docs`).
- [x] Configure environment variables (Dual JWT access/refresh secrets, cookie secret, CORS origin, IST timezone).
- [x] Establish MySQL connection pooling with higher-order `withTransaction` ACID runner.
- [x] Implement centralized error handling (`AppError` hierarchy, MySQL 1062/1452/1451 mapping, JSend envelope).
- [x] Implement authentication infrastructure (Dual JWT access/refresh tokens, SHA-256 token hashing, `refresh_tokens` MySQL table, `verifyToken` middleware).
- [x] Implement role-based authorization (`requireRoles` middleware supporting Admin, Trainer, and Member RBAC).
- [x] Establish modular five-layer architecture utilities (`validateRequest` gate, `asyncHandler`, `ApiResponse`, Model enums).
- [x] Integrate Swagger UI documentation (`/api/docs`) and OpenAPI 3.0 spec.
- [x] Build automated test suite using Jest + Supertest (`npm test` — 22/22 tests passing).

### Phase 4: Core Backend Development [IN PROGRESS]

Staged Delivery:

- [x] **Milestone 4.1: Authentication & User/Member Management [COMPLETED]**
  - Public registration (`POST /api/auth/register`) with atomic user + member_profile + refresh session creation and auto-login.
  - Login (`POST /api/auth/login`) with Dual JWT (access token in body, HttpOnly cookie for refresh token).
  - Token refresh with rotation & reuse detection (`POST /api/auth/refresh`).
  - Logout (`POST /api/auth/logout`) with session revocation.
  - Current user & profile retrieval (`GET /api/auth/me`).
  - Change password with multi-session revocation (`PATCH /api/auth/change-password`).
  - Member profile management & non-blocking completeness (`GET & PATCH /api/users/profile`).
  - Admin member management (`GET /api/users/members`, `GET /api/users/members/:id`, `PATCH /api/users/members/:id/status`).
  - Automated test suite: `tests/auth.test.js` and `tests/users.test.js` (45/45 tests passing).
- [x] **Milestone 4.2: Trainers & Plan Categories / Plans [COMPLETED]**
  - Admin-only trainer provisioning (`POST /api/trainers`) creating `users` (`role = 'trainer'`) and `trainer_profiles` atomically.
  - Trainer roster listing (`GET /api/trainers`) with pagination, search, and dynamic field visibility (scrubs `monthlySalary` for non-admins).
  - Trainer detail lookup (`GET /api/trainers/:id`) and updates (`PATCH /api/trainers/:id`) with role-based field restrictions.
  - Trainer account activation/deactivation toggle (`PATCH /api/trainers/:id/status`).
  - Dynamic plan categories management (`POST, GET, PATCH /api/categories`, `PATCH /api/categories/:id/status`) with duplicate name checks.
  - Membership plans management (`POST, GET, PATCH /api/plans`, `PATCH /api/plans/:id/status`) with duration, pricing, and category validation.
  - Automated test suite: `tests/trainers.test.js` and `tests/plans.test.js` (78/78 total suite tests passing).
- [x] **Milestone 4.3: Subscriptions & Payments (ACID Concurrency & Promotional Engine)**
  - Schema updates: added `discounts`, `discount_plans`, and `refunds` tables; extended `subscriptions` and `payments` with pricing snapshots and two-phase lifecycle statuses.
  - Promotional discount engine (`POST, GET, PATCH, DELETE /api/discounts`) supporting percentage/fixed discounts, max caps, min purchase thresholds, plan-specific eligibility, global usage limits, and per-user redemption limits.
  - Subscription lifecycle & concurrency row locking (`POST /api/subscriptions/quote`, `POST /api/subscriptions/checkout`, `GET /api/subscriptions`, `GET /api/subscriptions/:id`) with pessimistic write locks (`FOR UPDATE`), sequential renewal queuing, and cross-category isolation.
  - Two-phase payment confirmation and webhooks (`POST /api/payments/confirm`, `POST /api/payments/webhook`, `GET /api/payments`, `GET /api/payments/my`, `GET /api/payments/:id`) with idempotent verification, subscription promotion, and discount counter increments.
  - Dedicated refunds and cancellation governance (`POST /api/refunds`, `GET /api/refunds/payment/:paymentId`, `PATCH /api/subscriptions/:id/cancel`, `POST /api/subscriptions/sync-statuses`) with strict ceiling checks, queued renewal promotion, and automated maintenance sync.
  - Complete automated test coverage across 9 test suites with 125/125 passing tests (`tests/discounts.test.js`, `tests/subscriptions.test.js`, `tests/payments.test.js`, `tests/refunds.test.js`).
- [x] **Milestone 4.4: Role-Tailored Dashboards & Status Maintenance Architecture**
  - Modular dashboard architecture: dedicated `dashboardRoutes.js` -> `dashboardController.js` -> `dashboardService.js` -> `dashboardRepository.js`.
  - Role-specific endpoints: `GET /api/dashboard/admin` (Admin overview & financials), `GET /api/dashboard/trainer` (Trainer profile & allocations), `GET /api/dashboard/member` (Member passes, renewals & completeness). Unified `/api/dashboard` route explicitly prohibited and returns 404.
  - Strict RBAC & Data Isolation: endpoints derive identity strictly from `req.user.id` and `req.user.role`; 401 for unauthenticated, 403 for mismatched roles.
  - Financial integrity: distinct separation of Gross Completed Payments from Net Revenue (Net Revenue = Completed Payments − Completed Refunds); separate targeted SQL aggregate queries avoid cartesian product inflation.
  - Status maintenance model: exposed via Admin `POST /api/subscriptions/sync-statuses` intended for external schedulers / on-demand triggers (no in-process cron).
  - Self-healing bounds: queries accurately calculate active, expiring (within 7 days), and expired subscriptions using calendar date logic even if the daily status sync cron has not executed.
  - Profile completeness: dynamically computes member profile completion percentage and field-level breakdown.
  - Phase 6 stubs: structured empty trainer allocations (`totalAssignedMembers`, `assignedMembers`, `upcomingSessions`) ready for future attendance/assignment modules.
  - Comprehensive automated test coverage: `tests/dashboard.test.js` passing with 14 new integration tests (10 test suites, 139/139 total tests passing).

Test every module using Postman.

### Phase 5: Frontend Development

Follows the architectural flow: **API → Hooks → State → UI**.

- [x] **Milestone 5.1: Frontend Foundation & Tooling Scaffolding**
  - Scaffolded Vite + React 18 client application in `client/` with ESM module configuration.
  - Configured root concurrent process orchestration (`npm run dev` boots both server & client via `concurrently`, `npm run client`, `npm run client:build`).
  - Configured Vite development reverse proxy forwarding `/api` calls directly to Express backend on `http://localhost:5001`.
  - Implemented agreed Dark Athletic + Clean Workspace design system in `client/tailwind.config.js`: brand dark (`#0F172A`), brand surface (`#1E293B`), emerald accent (`#34D399`), lime accent (`#A3E635`), workspace canvas (`#F8FAFC`), card surfaces (`#FFFFFF`), neutral borders (`#E2E8F0`), and semantic status colors.
  - Installed `@tailwindcss/forms` and `@tailwindcss/typography` plugins.
  - Installed core runtime dependencies: `react-router-dom`, `axios`, `lucide-react`, `clsx`, `tailwind-merge`.
  - Built foundational utilities: `cn.js` (Tailwind class merging), `formatters.js` (currency INR `₹`, date IST, days remaining), and `constants.js` (routes, roles, statuses).
  - Built base application shell, branded `SplashLoader.jsx` component, and interactive foundation preview dashboard in `App.jsx`.
  - Verified clean production build bundle (`vite build` passing with zero errors).
- [x] **Milestone 5.2: API Layer & Centralized Authentication Architecture**
  - Centralized Axios client (`src/api/axiosClient.js`) with relative `baseURL: '/api'`, `withCredentials: true`, and in-memory access token injection (`Authorization: Bearer <token>`).
  - Single-flight refresh mutex queue preventing duplicate refresh storms when multiple concurrent requests receive 401s; buffers and replays pending calls upon successful token rotation.
  - Centralized terminal session teardown: catches 401 on refresh and triggers an AuthContext callback to reset in-memory state and navigate to `/login?session_expired=true` using `{ replace: true }`.
  - Distinguishes terminal 401s from transient network/5xx server errors (retains session state during temporary connectivity interruptions).
  - Normalized Auth API service module (`src/api/authApi.js`) with JSend unwrapping and standardized error payloads (`{ message, code, errors, status }`).
  - AuthContext (`src/context/AuthContext.jsx`) and `useAuth` hook managing in-memory tokens, user identity, profile state, and startup silent session restoration.
  - Branded full-screen `SplashLoader` on initial app boot during silent session restoration (`isRestoring === true`), preventing UI flicker and unauthenticated layout jumps.
  - Interactive Auth Testbench in `App.jsx` for live testing of Admin, Trainer, and Member sessions, token rotation, profile fetching, and logout.
  - Verified clean production client bundle compilation (`vite build` passing with zero errors).
- [x] **Milestone 5.3: Layouts, Routing & Role-Aware Navigation**
  - Implemented single flat route hierarchy without role prefixes in browser URLs (`/`, `/login`, `/register`, `/app`, `/dashboard`, `/profile`, `/members`, `/passes`, `/schedule`).
  - Built `ToastContext` (`src/context/ToastContext.jsx`) and floating auto-dismissing notification system (`useToast` hook) with variant styling (`success`, `warning`, `danger`, `info`) and slide-in animations.
  - Built comprehensive route guards:
    - `ProtectedRoute.jsx`: Authentication check with full-screen `SplashLoader` during session restoration; preserves deep links via `state.from`.
    - `RoleRoute.jsx`: Role-restriction verification with warning toast alert on unauthorized access and redirect to `/dashboard`.
    - `GuestRoute.jsx`: Redirects already authenticated visitors away from `/login` and `/register` to `state.from` or `/dashboard`.
    - `PwaGateway.jsx`: Dedicated `/app` PWA start URL restoring session via HttpOnly cookie and routing to `/dashboard` or `/login`.
  - Built role-segregated structural layouts:
    - `PublicLayout.jsx`: Dark athletic header, brand logo (navigates to `/`), public links, and role-aware action buttons.
    - `AdminLayout.jsx`: Desktop sidebar with collapse toggle, off-canvas mobile drawer with backdrop, and top administrative bar.
    - `TrainerLayout.jsx`: Dedicated trainer workspace navigation and schedule quick links.
    - `MemberLayout.jsx`: Hybrid navigation with desktop sticky header and fixed **mobile bottom tab bar** (`Dashboard`, `Passes`, `Workouts`, `Profile`) with notch safe-area support.
  - Built `DashboardDispatcher.jsx` resolving Admin, Trainer, or Member dashboard directly under the common `/dashboard` URL without URL redirection.
  - Built `ProfileDispatcher.jsx` wrapping user profile inside their active role layout.
  - Built core page shells and route-probe test components (`PublicLandingPage`, `LoginPage`, `RegisterPage`, `NotFoundPage`, `ProfileShell`, `AdminDashboardShell`, `TrainerDashboardShell`, `MemberDashboardShell`, `MembersManagementShell`, `MemberPassesShell`, `TrainerScheduleShell`).
  - Wired `BrowserRouter`, `ToastProvider`, `AuthProvider`, and `AppRoutes` in `App.jsx`.
  - Verified clean production client bundle compilation (`vite build` passing with zero errors) and all 10 backend integration test suites (139 tests passing).
- [ ] **Milestone 5.4: Authentication Pages & Profile Management**
- [ ] **Milestone 5.5: Role-Specific Dashboards**
- [ ] **Milestone 5.6: Core Application Pages (Memberships, Plans, Payments & Members)**
- [ ] **Milestone 5.7: Progressive Web App (PWA) Integration**
- [ ] **Milestone 5.8: End-to-End Integration, Polish & UX Hardening**

### Phase 6: Additional Features

- Attendance management.
- Workout plan management.
- Trainer-member assignment.
- Membership renewals.
- Expired membership tracking.
- Revenue and membership reports.

### Phase 7: Testing and Optimization

- Test API endpoints.
- Test authorization.
- Test database constraints.
- Test transactions and rollback.
- Test edge cases.
- Analyze queries with EXPLAIN.
- Optimize indexes and SQL queries.

### Phase 8: Deployment and Documentation

- Deploy frontend and backend.
- Configure production database.
- [x] Configure environment variables (Dual JWT access/refresh secrets, cookie secret, CORS origin, IST timezone).
- Prepare API documentation.
- Document database design.
- Prepare comprehensive README.
- Add screenshots and deployment links.

---

## 11. Development Guidelines for the AI Agent

These instructions are especially important.

1. Read this document before starting any implementation.
2. Do not implement the entire application in one step.
3. Work phase by phase and step by step.
4. Before implementing a module, explain the proposed approach and relevant design decisions.
5. Do not create database tables without first understanding their relationships.
6. Prefer native SQL queries over ORM abstractions.
7. Explain important SQL queries and why they are written that way.
8. Prioritize database integrity and business logic.
9. Do not introduce additional libraries without a valid reason.
10. Do not modify unrelated modules when implementing a feature.
11. Maintain consistency with the established architecture.
12. If an architectural decision needs to change, explain the reason before making the change.
13. Keep documentation updated as the project evolves.
14. Do not assume a feature is complete until it has been implemented and tested.

### Implementation workflow

For every major feature:

1. Understand the requirement.
2. Identify affected database entities.
3. Explain the database relationships.
4. Design the required SQL queries.
5. Implement repository operations.
6. Implement service-layer business logic.
7. Implement controllers, routes and validation.
8. Test the backend.
9. Integrate the frontend.
10. Verify the complete workflow.

The agent should not skip database design and jump directly into API implementation.

---

## 12. Project Success Criteria

GymPilot will be considered successfully implemented when:

- All three user roles work correctly.
- Core gym management workflows are functional.
- Relational database relationships are correctly implemented.
- SQL queries are written using mysql2.
- Transactions preserve data consistency.
- Authentication and authorization work correctly.
- Frontend and backend are fully integrated.
- Important APIs and database operations are tested.
- The application is deployed.
- GitHub documentation clearly explains the architecture and database design.

**Primary objective:** Build a practical, maintainable gym management application while developing strong hands-on knowledge of MySQL, SQL querying, relational database design, and backend engineering.
