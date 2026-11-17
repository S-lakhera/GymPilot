# GymPilot 🏋️‍♂️

> An enterprise-grade, full-stack gym management platform engineered with a strict 5-layer Node.js backend, native MySQL 8 relational design (no ORM), and a modern React 18 Progressive Web Application (PWA).

---

## 🌐 Live Production Deployment

| Service | Hosting Platform | URL |
| :--- | :--- | :--- |
| **Frontend Web App & PWA** | Vercel | [https://gympilot-zeta.vercel.app](https://gympilot-zeta.vercel.app) |
| **Backend REST API** | Render | [https://gympilot-3gjw.onrender.com/api](https://gympilot-3gjw.onrender.com/api) |
| **Interactive Swagger API Docs** | Render | [https://gympilot-3gjw.onrender.com/api/docs](https://gympilot-3gjw.onrender.com/api/docs) |
| **Health Check Endpoint** | Render | [https://gympilot-3gjw.onrender.com/health](https://gympilot-3gjw.onrender.com/health) |
| **Database** | TiDB Cloud | Serverless Distributed MySQL 8 (TLS encrypted) |
| **Uptime Monitor** | cron-job.org | Scheduled daytime keep-alive (`*/14 5-17 * * *` UTC) |

*For complete cloud infrastructure, environment variable guides, and cold-start mitigation architecture, see the dedicated [Deployment Guide (docs/deployment.md)](docs/deployment.md).*

---

## 🔑 Demo Accounts & Test Credentials

The production database is pre-seeded with realistic test accounts across all three user roles:

**Default Password for all test users:** `Password@123`

| Role | Email | Name | Capabilities & Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@gympilot.com` | Vikramaditya Singhania | Full management: Member directory, plan & category CRUD, financial ledger, refund issuance, discount coupons, and executive metrics. |
| **Trainer** | `trainer.alex@gympilot.com` | Alex Fernandes | Coaching portal: View assigned clients, schedule overview, and specialty profile. |
| **Member** | `rahul.sharma@gmail.com` | Rahul Sharma | Member portal: Multi-subscription passes (Strength + Yoga), pass renewal, payment receipts, and profile management. |
| **Member (Alt)** | `priya.patel@gmail.com` | Priya Patel | Holds an active Strength pass + queued renewal pass. |

---

## 📌 Project Overview

**GymPilot** is an enterprise-grade gym management solution designed to handle members, trainers, membership categories, subscriptions, payment records, and workout plans. 

The project prioritizes clean software architecture, relational database integrity, native SQL operations using `mysql2`, ACID-compliant transaction boundaries, and realistic business workflows (such as category-isolated multi-subscriptions and queued renewals).

### 🎯 Key Engineering Objectives
- **Pure Relational Database Engineering:** Deep hands-on experience designing normalized schemas (1NF, 2NF, 3NF), primary clustered indexes, foreign key constraints, and purpose-built composite indexes in MySQL 8.
- **Native SQL via `mysql2`:** No ORM abstractions (Prisma, Sequelize, TypeORM). All queries, joins, aggregations, and row locks are written in native, parameterized SQL.
- **ACID Transaction Management:** Atomic execution for financial transactions and subscription provisioning with `SELECT ... FOR UPDATE` row-level locking to prevent race conditions.
- **Strict 5-Layer Backend Architecture:** Clean separation of concerns: `Route → Controller → Service → Repository → Model`.
- **Role-Based Access Control (RBAC):** Distinct permissions and workflows for `Admin`, `Trainer`, and `Member` enforced at the backend middleware layer.
- **Progressive Web App (PWA):** Offline indicator, service worker asset precaching, installable mobile application shell, and standalone app manifest.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, JavaScript (ESM), Tailwind CSS, React Router v6, Axios, React Hook Form, Zod, Base UI, Lucide React, Recharts, Vitest |
| **PWA** | `vite-plugin-pwa`, Workbox, Web App Manifest, CacheFirst & StaleWhileRevalidate strategies |
| **Backend** | Node.js, Express.js (ES Modules), JWT, bcryptjs, express-validator, Swagger UI |
| **Database** | MySQL 8 / TiDB Cloud Serverless, `mysql2` (Connection Pooling & Transactions), TLS/SSL |
| **Deployment** | Vercel (Frontend), Render (Backend), TiDB Cloud (Database), cron-job.org (Uptime Monitor) |
| **Timezone** | Asia/Kolkata (`IST`, `+05:30`) |

---

## 🏛️ Architecture & Folder Structure

```
GymPilot/
├── client/                                    # Frontend (React 18 + Vite + Tailwind CSS + PWA)
│   ├── src/
│   │   ├── api/                               # Centralized Axios instances & API modules
│   │   ├── context/                           # AuthContext, ToastContext, PwaContext
│   │   ├── hooks/                             # Custom React hooks (useAuth, useToast, usePwa, usePasses)
│   │   ├── layouts/                           # Role layouts (Admin, Trainer, Member, Public)
│   │   ├── routes/                            # Flat routing hierarchy, protected & role guards
│   │   ├── components/                        # Base UI primitives (ui/), modals, drawers, charts
│   │   ├── schemas/                           # Zod validation schemas (auth, profile, plans, discounts)
│   │   ├── pages/                             # Public landing, Auth, Profile, Role workspaces & ledgers
│   │   └── utils/                             # Formatters, constants, error mappers & class merger
│   └── vercel.json                            # Vercel SPA rewrites & service worker cache headers
│
├── server/                                    # Backend (Node.js + Express + mysql2)
│   ├── database/                              # Raw SQL scripts & lightweight runners
│   │   ├── schema.sql                         # DDL: Core tables, constraints, indexes
│   │   ├── seeds.sql                          # DML: Realistic scenario seed data
│   │   ├── queries.sql                        # Test & verification queries (JOINs, EXPLAIN)
│   │   ├── init.js                            # Schema execution runner
│   │   ├── seed.js                            # Seed data runner
│   │   └── reset.js                           # Complete database reset runner
│   ├── src/
│   │   ├── config/                            # Environment config, swagger, & mysql2 pool
│   │   ├── routes/                            # Express routers & endpoint mapping
│   │   ├── controllers/                       # HTTP req/res handlers
│   │   ├── services/                          # Business logic & ACID transactions
│   │   ├── repositories/                      # Direct SQL queries via mysql2
│   │   ├── models/                            # Entity constants & status enums
│   │   ├── middlewares/                       # JWT auth, RBAC, error handling, validation
│   │   ├── utils/                             # Token generators, password helpers
│   │   └── app.js                             # Express app setup & middleware pipeline
│   ├── server.js                              # Server entrypoint and HTTP listener
│   ├── .env.example                           # Environment configuration template
│   └── package.json
│
├── docs/                                      # Project Documentation & Specifications
│   ├── requirements.md                        # Functional specs, business rules & permissions
│   ├── erd.md                                 # Entity-Relationship Diagram & Data Dictionary
│   ├── architecture.md                        # 5-layer backend & 4-layer frontend guides
│   ├── frontend.md                            # Comprehensive frontend tokens & PWA architecture
│   └── deployment.md                          # Production cloud architecture & configuration guide
│
├── context.md                                 # Core project context and decision log
└── README.md
```

---

## 📋 Core Business Rules

1. **Hybrid Onboarding:** Members can self-register online or be registered at the gym desk by an Admin. Trainers and additional Admins can only be provisioned by an Admin.
2. **Multi-Subscription Model:** A member can hold multiple concurrent active subscriptions across **different categories** (e.g., Strength + Yoga).
3. **Category Overlap Prohibition:** A member **cannot** have overlapping active subscriptions in the **same category**.
4. **Queued Renewals:** Renewing a subscription in an active category queues the new subscription to start automatically on the day after the current one expires (`start_date = current_end_date + 1 day`).
5. **Atomic Payment Recording:** Creating or renewing a subscription atomically records its payment record in the same database transaction.
6. **Refund Safeguards:** Refunds are verified against available balances, preventing over-refunding and preserving financial audit trails.
7. **Hybrid Deletion & Data Preservation:** 
   - Business entities (Users, Plans, Categories) use soft deletion/deactivation (`is_active`, `deleted_at`).
   - Cascade deletion (`ON DELETE CASCADE`) is strictly restricted to dependent 1:1 profile records (`member_profiles`, `trainer_profiles`) upon physical purge.
   - All historical subscriptions and payments enforce `ON DELETE RESTRICT` to guarantee audit trail preservation.

---

## 🚦 Roadmap & Development Phases

- [x] **Phase 1: Requirements & Planning** — Finalize roles, business rules, ERD, and directory scaffolding.
- [x] **Phase 2: Database Design** — Native MySQL schema (`schema.sql`), sample seeds (`seeds.sql`), verification queries (`queries.sql`), and runner scripts.
- [x] **Phase 3: Backend Foundation** — Express app, connection pooling with IST (+05:30), JWT auth, and RBAC middlewares.
- [x] **Phase 4: Core Backend Development** — Implement 5-layer modules for Auth, Members, Trainers, Categories, Plans, Subscriptions, Payments, and Dashboard stats.
- [x] **Phase 5: Frontend Development & PWA Integration**
  - [x] Milestone 5.1: Setup & Design Tokens (Vite, Tailwind dark athletic theme, formatters)
  - [x] Milestone 5.2: API Layer & Auth Architecture (Dual-token Axios interceptors, in-memory storage, silent restore)
  - [x] Milestone 5.3: Layouts, Routing & Role Navigation (Flat hierarchy, toasts, role guards, mobile bottom tabs)
  - [x] Milestone 5.4: Auth Pages & Profile Management (React Hook Form, Zod, Base UI, role-tailored profile workspace)
  - [x] Milestone 5.5: Role-Specific Dashboards (Recharts metrics, multi-pass hero cards, queued renewal banners)
  - [x] Milestone 5.6: Core Application Pages (Plans catalog & checkout, passes workspace, member inspection drawer, financial ledger, refund audit)
  - [x] Milestone 5.7: Progressive Web App Integration (Workbox precaching, offline banner, install prompts)
  - [x] Milestone 5.8: End-to-End Integration, Polish & UX Hardening (Lazy-loaded route chunks, error boundaries, journey integration tests)
- [x] **Phase 8 (Early Phase): Production Cloud Deployment**
  - [x] Production TiDB Cloud Serverless MySQL database setup, schema execution, and realistic seeding.
  - [x] Production Render backend API deployment with trust proxy, CORS credentials, and TLS database connections.
  - [x] Production Vercel frontend SPA deployment with rewrite routing and PWA caching.
  - [x] Cold-start UX mitigation: extended timeouts, static landing passes, warmup pings, and daytime keep-alive cron.
  - [x] Comprehensive deployment documentation ([docs/deployment.md](docs/deployment.md)).
- [ ] **Phase 6: Extended Features**
  - [x] Milestone 6.1: Trainer-Member Assignment Subsystem (1:N capacity limits, 10-day grace period, role coaching portals)
  - [x] Milestone 6.2: Attendance Management Subsystem
    - Admin live attendance desk with rapid member search, soft pass validation dialog, and 1-click check-out duration tracking.
    - Live floor occupancy roster & 7-day trend analytics with cross-midnight session persistence.
    - Authentic GitHub-style 16-week attendance heatmap with streak calculations and IST timezone alignment.
    - Merged coaching roster with athlete floor presence, visited-today badges, and accessible attendance inspection modal.
  - [x] Milestone 6.3: Workout Plan Management Subsystem
    - Curated 28-movement standard exercise catalog across 8 muscle groups with on-the-fly custom exercise creation for trainers.
    - Interactive multi-day split routine builder modal supporting dynamic day addition, sets, reps, rest intervals, and exercise notes.
    - Single active plan exclusivity with atomic transaction archiving upon new routine assignment.
    - Dedicated role-tailored `/workouts` workspaces: Trainer routine authoring desk with metric summaries, and Member daily checklist with `localStorage` persistence and celebratory completion badges.
    - Consolidated Member Training & Coaching Hub: Integrated streamlined coach profile, coach request modal, and review status directly into `/workouts`, redirecting member `/coaching` to `/workouts` and establishing a clean 4-tab PWA mobile navigation (`Dashboard`, `Passes`, `Workouts`, `Profile`).
    - Direct 1-click `Workout` assignment shortcut from the coaching roster.
  - [ ] Milestone 6.4: Expired Membership Tracking & Automated Notifications
  - [ ] Milestone 6.5: Advanced Business Reports & Revenue Analytics
- [ ] **Phase 7: Testing & Query Optimization** — API validation, transaction rollbacks, index tuning with `EXPLAIN`.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- MySQL Server 8.0+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/S-lakhera/GymPilot.git
cd GymPilot
```

### 2. Backend Setup
```bash
cd server
cp .env.example .env
# Edit .env with your local MySQL credentials
npm install
npm run db:init     # Execute schema.sql (create tables and constraints)
npm run db:seed     # Seed realistic users, plans, and subscriptions
npm run dev         # Starts server on http://localhost:5001
```

### 3. Frontend Setup
```bash
cd ../client
cp .env.example .env
npm install
npm run dev         # Starts Vite dev server on http://localhost:5173
```

### 4. Running Both Concurrently
From the root repository directory:
```bash
npm install
npm run dev         # Boots both server and client concurrently
```

---

## 📄 License
This project is open-source and developed for educational and portfolio demonstration purposes.
