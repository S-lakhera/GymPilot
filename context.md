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

### Phase 4: Core Backend Development

Implement:

1. Authentication
2. Users / Members
3. Trainers
4. Membership Plans
5. Subscriptions
6. Payments
7. Dashboard statistics

Test every module using Postman.

### Phase 5: Frontend Development

- Initialize React and Vite.
- Configure Tailwind CSS.
- Set up routing.
- Implement authentication pages.
- Implement protected layouts.
- Build the admin dashboard.
- Build member and trainer management pages.
- Build membership, subscription and payment pages.
- Integrate backend APIs.

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
