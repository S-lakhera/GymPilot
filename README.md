# GymPilot 🏋️‍♂️

> A robust, full-stack gym management platform engineered with a strict 5-layer Node.js backend, native MySQL 8 relational design (no ORM), and a modern React frontend.

---

## 📌 Project Overview

**GymPilot** is an enterprise-grade gym management solution designed to handle members, trainers, membership categories, subscriptions, payment records, and workout plans. 

The project prioritizes clean software architecture, relational database integrity, native SQL operations using `mysql2`, ACID-compliant transaction boundaries, and realistic business workflows (such as category-isolated multi-subscriptions and queued renewals).

### 🎯 Key Learning Objectives
- **Pure Relational Database Engineering:** Deep hands-on experience designing normalized schemas (1NF, 2NF, 3NF), primary clustered indexes, foreign key constraints, and purpose-built composite indexes in MySQL 8.
- **Native SQL via `mysql2`:** No ORM abstractions (Prisma, Sequelize, TypeORM). All queries, joins, aggregations, and row locks are written in native, parameterized SQL.
- **ACID Transaction Management:** Atomic execution for financial transactions and subscription provisioning with `SELECT ... FOR UPDATE` row-level locking to prevent race conditions.
- **Strict 5-Layer Backend Architecture:** Clean separation of concerns: `Route → Controller → Service → Repository → Model`.
- **Role-Based Access Control (RBAC):** Distinct permissions and workflows for `Admin`, `Trainer`, and `Member` enforced at the backend middleware layer.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, JavaScript (ES Modules), Tailwind CSS, React Router v6, Axios |
| **Backend** | Node.js, Express.js (ES Modules), JWT, bcryptjs, express-validator |
| **Database** | MySQL 8, `mysql2` (Connection Pooling & Transactions), MySQL Workbench |
| **Timezone** | Asia/Kolkata (`IST`, `+05:30`) |

---

## 🏛️ Architecture & Folder Structure

```
GymPilot/
├── client/                                    # Frontend (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── api/                               # Centralized Axios instances & API modules
│   │   ├── context/                           # Auth and UI context state
│   │   ├── hooks/                             # Custom React hooks
│   │   ├── layouts/                           # Role layouts (Admin, Trainer, Member, Auth)
│   │   ├── pages/                             # Role-segmented pages
│   │   ├── components/                        # Modular presentation components
│   │   ├── routes/                            # Protected routing & guards
│   │   └── utils/                             # Formatters & date helpers
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
│   │   ├── config/                            # Environment config & mysql2 pool
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
│   └── architecture.md                        # 5-layer backend & 4-layer frontend guides
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
6. **Hybrid Deletion & Data Preservation:** 
   - Business entities (Users, Plans, Categories) use soft deletion/deactivation (`is_active`, `deleted_at`).
   - Cascade deletion (`ON DELETE CASCADE`) is strictly restricted to dependent 1:1 profile records (`member_profiles`, `trainer_profiles`) upon physical purge.
   - All historical subscriptions and payments enforce `ON DELETE RESTRICT` to guarantee audit trail preservation.

---

## 🚦 Roadmap & Development Phases

- [x] **Phase 1: Requirements & Planning** — Finalize roles, business rules, ERD, and directory scaffolding.
- [ ] **Phase 2: Database Design** — Native MySQL schema (`schema.sql`), sample seeds (`seeds.sql`), verification queries (`queries.sql`), and runner scripts.
- [ ] **Phase 3: Backend Foundation** — Express app, connection pooling with IST (+05:30), JWT auth, and RBAC middlewares.
- [ ] **Phase 4: Core Backend Development** — Implement 5-layer modules for Auth, Members, Trainers, Categories, Plans, Subscriptions, Payments, and Dashboard stats.
- [ ] **Phase 5: Frontend Development** — React + Vite setup, Tailwind styling, role layouts, protected routes, and API integration.
- [ ] **Phase 6: Extended Features** — Attendance tracking, Workout routines, Trainer-member assignments, and Reports.
- [ ] **Phase 7: Testing & Query Optimization** — API validation, transaction rollbacks, index tuning with `EXPLAIN`.
- [ ] **Phase 8: Deployment & Final Documentation** — Production deployment, configuration guides, and demo credentials.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MySQL Server 8.0+
- Git

### Backend Setup
```bash
cd server
cp .env.example .env
npm install
npm run dev
```

---

## 📄 License
This project is open-source and developed for educational and portfolio demonstration purposes.

