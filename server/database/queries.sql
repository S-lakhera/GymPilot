-- ============================================================================
-- GymPilot Test & Verification Queries (queries.sql)
-- Validates relational schema, joins, aggregations, overlap checks, and indexes
-- ============================================================================

USE gympilot_db;

-- ----------------------------------------------------------------------------
-- 1. Full Member Profile with Active Subscriptions & Categories (Multi-Table JOIN)
-- Demonstrates: 1:1 join with member_profiles and 1:N join with subscriptions & plans
-- ----------------------------------------------------------------------------
SELECT 
  u.id AS member_id,
  CONCAT(u.first_name, ' ', u.last_name) AS member_name,
  u.email,
  u.phone,
  mp.date_of_birth,
  mp.gender,
  mp.emergency_contact_name,
  mp.emergency_contact_phone,
  s.id AS subscription_id,
  s.status AS subscription_status,
  pc.name AS category_name,
  p.name AS plan_name,
  s.start_date,
  s.end_date,
  s.price_paid
FROM users u
INNER JOIN member_profiles mp ON u.id = mp.user_id
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status IN ('active', 'queued')
LEFT JOIN plans p ON s.plan_id = p.id
LEFT JOIN plan_categories pc ON p.category_id = pc.id
WHERE u.role = 'member' AND u.is_active = TRUE
ORDER BY u.id, s.start_date;

-- ----------------------------------------------------------------------------
-- 2. Category Overlap Validation Query (Crucial Business Rule)
-- Checks whether a member already holds an active/queued subscription in Category X.
-- In Phase 4, this query runs inside an ACID transaction with FOR UPDATE.
-- Target: Member 6 (Priya) checking Category 1 (Strength Training)
-- ----------------------------------------------------------------------------
SELECT 
  s.id AS conflicting_sub_id,
  s.user_id,
  pc.name AS category_name,
  s.status,
  s.start_date,
  s.end_date
FROM subscriptions s
INNER JOIN plans p ON s.plan_id = p.id
INNER JOIN plan_categories pc ON p.category_id = pc.id
WHERE s.user_id = 6
  AND pc.id = 1
  AND s.status IN ('active', 'queued')
  AND s.end_date >= CURRENT_DATE;

-- ----------------------------------------------------------------------------
-- 3. Queued Renewal Start Date Calculation
-- When a user renews a plan in an active category, calculate the next start date:
-- MAX(end_date) + 1 day. If no active sub exists, returns CURRENT_DATE.
-- ----------------------------------------------------------------------------
SELECT 
  COALESCE(DATE_ADD(MAX(s.end_date), INTERVAL 1 DAY), CURRENT_DATE) AS calculated_start_date
FROM subscriptions s
INNER JOIN plans p ON s.plan_id = p.id
WHERE s.user_id = 6
  AND p.category_id = 1
  AND s.status IN ('active', 'queued');

-- ----------------------------------------------------------------------------
-- 4. Daily Maintenance Status Expiration Query
-- Identifies subscriptions that have expired based on current calendar date.
-- ----------------------------------------------------------------------------
SELECT 
  s.id,
  s.user_id,
  p.name AS plan_name,
  s.end_date,
  s.status
FROM subscriptions s
INNER JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
  AND s.end_date < CURRENT_DATE;

-- ----------------------------------------------------------------------------
-- 5. Daily Maintenance Queued Promotion Query
-- Promotes queued subscriptions to 'active' when their start_date is reached.
-- ----------------------------------------------------------------------------
SELECT 
  s.id,
  s.user_id,
  p.name AS plan_name,
  s.start_date,
  s.status
FROM subscriptions s
INNER JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'queued'
  AND s.start_date <= CURRENT_DATE;

-- ----------------------------------------------------------------------------
-- 6. Monthly Revenue Aggregation by Payment Channel (GROUP BY + SUM)
-- ----------------------------------------------------------------------------
SELECT 
  payment_method,
  COUNT(id) AS total_transactions,
  SUM(amount) AS total_revenue,
  MIN(amount) AS smallest_payment,
  MAX(amount) AS largest_payment,
  ROUND(AVG(amount), 2) AS average_ticket_size
FROM payments
WHERE payment_status = 'COMPLETED'
GROUP BY payment_method
ORDER BY total_revenue DESC;

-- ----------------------------------------------------------------------------
-- 7. Revenue Breakdown by Plan Category (Multi-Table Aggregation)
-- ----------------------------------------------------------------------------
SELECT 
  pc.id AS category_id,
  pc.name AS category_name,
  COUNT(DISTINCT s.id) AS total_subscriptions_sold,
  SUM(py.amount) AS total_category_revenue
FROM plan_categories pc
INNER JOIN plans p ON pc.id = p.category_id
INNER JOIN subscriptions s ON p.id = s.plan_id
INNER JOIN payments py ON s.id = py.subscription_id
WHERE py.payment_status = 'COMPLETED'
GROUP BY pc.id, pc.name
ORDER BY total_category_revenue DESC;

-- ----------------------------------------------------------------------------
-- 8. Active Subscriber Count Grouped by Category
-- ----------------------------------------------------------------------------
SELECT 
  pc.name AS category_name,
  COUNT(DISTINCT s.user_id) AS active_subscribers
FROM plan_categories pc
LEFT JOIN plans p ON pc.id = p.category_id
LEFT JOIN subscriptions s ON p.id = s.plan_id AND s.status = 'active'
GROUP BY pc.id, pc.name
ORDER BY active_subscribers DESC;

-- ----------------------------------------------------------------------------
-- 9. Soft-Delete & Account Deactivation Verification Query
-- Ensures deactivated users cannot log in and are excluded from active operations.
-- ----------------------------------------------------------------------------
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  deleted_at
FROM users
WHERE is_active = FALSE OR deleted_at IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 10. Trainer Roster with 1:1 Profile Details
-- ----------------------------------------------------------------------------
SELECT 
  u.id AS trainer_id,
  CONCAT(u.first_name, ' ', u.last_name) AS trainer_name,
  u.email,
  u.phone,
  tp.specialization,
  tp.experience_years,
  tp.certification,
  tp.monthly_salary
FROM users u
INNER JOIN trainer_profiles tp ON u.id = tp.user_id
WHERE u.role = 'trainer' AND u.is_active = TRUE
ORDER BY tp.experience_years DESC;

-- ----------------------------------------------------------------------------
-- 11. EXPLAIN Plan: Verifying Index Usage on Overlap Check
-- Confirms MySQL utilizes `idx_subscriptions_overlap_check` (or user_status index)
-- ----------------------------------------------------------------------------
EXPLAIN SELECT s.id, s.status, s.end_date
FROM subscriptions s
WHERE s.user_id = 5
  AND s.plan_id = 2
  AND s.status IN ('active', 'queued')
  AND s.end_date >= CURRENT_DATE;

-- ----------------------------------------------------------------------------
-- 12. EXPLAIN Plan: Verifying Unique Index Usage on Email Authentication
-- Confirms MySQL executes a const type lookup via `uq_users_email` (O(1))
-- ----------------------------------------------------------------------------
EXPLAIN SELECT id, email, password_hash, role, is_active
FROM users
WHERE email = 'admin@gympilot.com';

