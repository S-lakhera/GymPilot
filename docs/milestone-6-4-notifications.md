# Milestone 6.4: Expired Membership Tracking & Automated Notifications Subsystem

## 1. Architectural Overview

Milestone 6.4 introduces an automated notification engine, reconciliation runner, and Admin Expirations Desk to GymPilot. It bridges pass life-cycles, coaching grace periods, and workout plan prescriptions with real-time in-app alerts and proactive administrative renewal workflows.

```
                      +---------------------------------------+
                      |   Background Runner & Reconciliation  |
                      |   (Startup + Every 12 Hours / Cron)   |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |    subscriptionService.syncStatuses   |
                      |  - 7-day & 3-day Pass Expiry Check    |
                      |  - Past Active Passes -> Expired      |
                      |  - 10-day Coach Grace Period Checks   |
                      |  - Queued Renewal Auto-Activation     |
                      +-------------------+-------------------+
                                          |
                                          v
+--------------------------+  Dispatches  +---------------------------+
| Event Dispatchers        | -----------> | notifications (MySQL 8)   |
| - Pass Expiring (7D/3D)  |              | - Idempotent event_key    |
| - Pass Expired / Renewed |              | - Target userId           |
| - Coach Request / Grace  |              | - Type & Metadata JSON    |
| - Workout Plan Assigned  |              | - Read State & Action URL |
+--------------------------+              +-------------+-------------+
                                                        |
                                                        v
                 +--------------------------------------+--------------------------------------+
                 |                                                                             |
                 v                                                                             v
+------------------------------------+                                       +-----------------------------------+
|     Client Notification Center     |                                       |       Admin Expirations Desk      |
| - Global <NotificationBell />      |                                       | - Metrics Cards (7D, 3D, Expired) |
| - Real-time unread badge counter   |                                       | - "Run Expiration Sync" Trigger   |
| - Popover with quick navigation    |                                       | - Member Renewal Queue Table      |
| - Mark read / delete controls      |                                       | - On-demand "Send Reminder" Action|
+------------------------------------+                                       +-----------------------------------+
```

---

## 2. Database Schema (`notifications`)

The `notifications` table guarantees transactional integrity and idempotency through dedicated composite indexes and a unique `event_key`:

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type ENUM(
    'PASS_EXPIRING_7D',
    'PASS_EXPIRING_3D',
    'PASS_EXPIRED',
    'PASS_RENEWED',
    'COACH_REQUEST_SUBMITTED',
    'COACH_REQUEST_APPROVED',
    'COACH_REQUEST_REJECTED',
    'COACH_GRACE_PERIOD',
    'WORKOUT_PLAN_ASSIGNED',
    'SYSTEM_ALERT'
  ) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  event_key VARCHAR(120) NULL UNIQUE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url VARCHAR(255) NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_notification_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  INDEX idx_notification_user_read (user_id, is_read),
  INDEX idx_notification_user_created (user_id, created_at),
  INDEX idx_notification_event_key (event_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Idempotency Guarantee
When automatic jobs or users trigger syncs multiple times, notifications use `ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)` keyed on `event_key` (e.g. `EXP_7D_SUB_42`, `EXP_3D_SUB_42`, `EXPIRED_SUB_42`, `WORKOUT_PLAN_15_MEMBER_6`). Duplicate inserts are quietly ignored without raising SQL conflicts.

---

## 3. Supported Notification Event Types

| Type | Trigger Event | Destination URL |
| :--- | :--- | :--- |
| `PASS_EXPIRING_7D` | Active subscription ends in exactly 7 days (`end_date = CURDATE() + 7`) | `/passes` |
| `PASS_EXPIRING_3D` | Active subscription ends in exactly 3 days (`end_date = CURDATE() + 3`) | `/passes` |
| `PASS_EXPIRED` | Active subscription passed end date (`end_date < CURDATE()`), transitions to `expired` | `/passes` |
| `PASS_RENEWED` | Queued pass automatically promoted to active upon start date | `/passes` |
| `COACH_REQUEST_SUBMITTED` | Member submits new 1-on-1 coach assignment request | `/workouts` |
| `COACH_REQUEST_APPROVED` | Admin approves member coach request, assigning personal trainer | `/workouts` |
| `COACH_REQUEST_REJECTED` | Admin rejects member coach request with recorded reason | `/workouts` |
| `COACH_GRACE_PERIOD` | Active pass expires and member enters 10-day coach retention grace period | `/passes` |
| `WORKOUT_PLAN_ASSIGNED` | Trainer authors and assigns a multi-day routine split to athlete | `/workouts` |
| `SYSTEM_ALERT` | System maintenance or broadcast administrative notification | `/dashboard` |

---

## 4. Backend REST API Endpoints

All routes are mounted under `/api/notifications` and guarded by `verifyToken` session verification.

### Member & Trainer Endpoints
- `GET /api/notifications`: Retrieve paginated notifications (`limit`, `offset`, `unreadOnly`).
- `GET /api/notifications/unread-count`: Retrieve unread badge count `{ unreadCount: number }`.
- `PATCH /api/notifications/:id/read`: Mark single notification as read (scoped to current user).
- `PATCH /api/notifications/read-all`: Mark all notifications as read for current user.
- `DELETE /api/notifications/:id`: Delete a single notification.

### Administrator Endpoints (`requireRoles(['admin'])`)
- `POST /api/notifications/sync-expirations`: Execute system-wide pass expiration and reminder reconciliation.
- `GET /api/notifications/admin/expirations-queue`: Fetch renewal queue with metrics (`windowDays`, `status`, `page`, `limit`, `search`).
- `POST /api/notifications/admin/remind/:subscriptionId`: Dispatch an on-demand manual renewal reminder.

---

## 5. Frontend Components & User Experience

### 1. Centralized `<NotificationBell />`
- Integrated seamlessly into `MemberLayout`, `TrainerLayout`, and `AdminLayout`.
- Shows real-time pulsing counter badge when unread notifications exist.
- Accessible popover dialog with outside click detection and `Escape` key trapping.
- Filter toggle between `All` and `Unread`.
- Direct 1-click action navigation (marking read automatically upon click).

### 2. Admin Expirations Desk (`/admin/expirations`)
- **Metric Cards**: Total Expiring 7 Days, Expiring 3 Days, Expired Passes, and Reminders Sent.
- **Run Expiration Sync Button**: Instant reconciliation runner with animated spinner and toast report.
- **Renewal Queue Ledger**: Detailed table with member contact info, plan names, days remaining status badges, and per-row `Send Reminder` buttons.
- Search and window filters (`7 Days`, `14 Days`, `30 Days`).
