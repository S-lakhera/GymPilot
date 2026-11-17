-- ============================================================================
-- GymPilot Relational Database Schema (MySQL 8)
-- Timezone Standard: Asia/Kolkata (+05:30)
-- Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- Clustered Index: BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY across all tables
-- ============================================================================

CREATE DATABASE IF NOT EXISTS gympilot_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE gympilot_db;

-- ----------------------------------------------------------------------------
-- 1. Table: users
-- Core identity table storing authentication credentials, role, and contact.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(60) NOT NULL,
  last_name VARCHAR(60) NOT NULL,
  phone VARCHAR(20) NULL,
  role ENUM('admin', 'trainer', 'member') NOT NULL DEFAULT 'member',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  -- Index optimizes administrative queries filtering members or trainers by active status
  INDEX idx_users_role_status (role, is_active)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2. Table: member_profiles
-- 1:1 extension table storing member health notes, emergency contact, and DOB.
-- Referential Action: ON DELETE CASCADE (applies only upon physical user purge)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  date_of_birth DATE NULL,
  gender ENUM('male', 'female', 'other') NULL,
  emergency_contact_name VARCHAR(100) NULL,
  emergency_contact_phone VARCHAR(20) NULL,
  health_conditions TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_member_profiles_user_id (user_id),
  CONSTRAINT fk_member_profiles_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 3. Table: trainer_profiles
-- 1:1 extension table storing trainer certifications, specialization, and salary.
-- Referential Action: ON DELETE CASCADE (applies only upon physical user purge)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trainer_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  gender ENUM('male', 'female', 'other') NOT NULL DEFAULT 'male',
  specialization VARCHAR(100) NOT NULL,
  experience_years INT UNSIGNED NOT NULL DEFAULT 0,
  certification VARCHAR(200) NULL,
  bio TEXT NULL,
  monthly_salary DECIMAL(10, 2) NULL,
  max_clients INT UNSIGNED NOT NULL DEFAULT 10,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_trainer_profiles_user_id (user_id),
  CONSTRAINT fk_trainer_profiles_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 4. Table: plan_categories
-- Normalized table defining workout/access disciplines (Strength, Cardio, Yoga).
-- Ensures dynamic category management by Admin without DDL schema alterations.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_plan_categories_name (name)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 5. Table: plans
-- Membership packages belonging to specific categories with duration and pricing.
-- Referential Action: ON DELETE RESTRICT (cannot delete category with active plans)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  duration_days INT UNSIGNED NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_plans_category
    FOREIGN KEY (category_id) REFERENCES plan_categories (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  -- Index optimizes catalog browsing by active plans within a category
  INDEX idx_plans_category_status (category_id, is_active)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 6. Table: discounts
-- Promotional discount codes, coupons, and seasonal pricing offers.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS discounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  discount_type ENUM('PERCENTAGE', 'FIXED') NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  max_discount_amount DECIMAL(10, 2) NULL,
  min_purchase_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  usage_limit INT UNSIGNED NULL,
  per_user_limit INT UNSIGNED NOT NULL DEFAULT 1,
  times_used INT UNSIGNED NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_discounts_code (code),
  INDEX idx_discounts_active_dates (is_active, start_date, end_date)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 7. Table: discount_plans
-- Mapping table for plan-specific promotional eligibility.
-- If a discount has no rows here, it applies universally to all plans.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS discount_plans (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  discount_id BIGINT UNSIGNED NOT NULL,
  plan_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_discount_plan (discount_id, plan_id),
  CONSTRAINT fk_discount_plans_discount
    FOREIGN KEY (discount_id) REFERENCES discounts (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_discount_plans_plan
    FOREIGN KEY (plan_id) REFERENCES plans (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 8. Table: subscriptions
-- Manages membership contracts, start/end dates, renewal states, and pricing snapshots.
-- Referential Actions: ON DELETE RESTRICT (preserves historical memberships)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  plan_id BIGINT UNSIGNED NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  base_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  discount_id BIGINT UNSIGNED NULL,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  final_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  price_paid DECIMAL(10, 2) NOT NULL,
  status ENUM('pending_payment', 'queued', 'active', 'expired', 'cancelled') NOT NULL DEFAULT 'pending_payment',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_subscriptions_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_subscriptions_plan
    FOREIGN KEY (plan_id) REFERENCES plans (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_subscriptions_discount
    FOREIGN KEY (discount_id) REFERENCES discounts (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  -- Index optimizes lookup of a member's active, queued and pending subscriptions
  INDEX idx_subscriptions_user_status (user_id, status),
  -- Composite index used by the transaction row-lock query during overlap validation
  INDEX idx_subscriptions_overlap_check (user_id, plan_id, status, end_date),
  -- Index optimizes daily midnight batch processing to expire completed subscriptions
  INDEX idx_subscriptions_status_end_date (status, end_date)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 9. Table: payments
-- Immutable financial audit log of subscription transactions.
-- Referential Actions: ON DELETE RESTRICT (preserves financial records)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  subscription_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  recorded_by_id BIGINT UNSIGNED NULL,
  amount DECIMAL(10, 2) NOT NULL,
  base_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  payment_method ENUM('CASH', 'CARD', 'UPI', 'NET_BANKING') NOT NULL,
  payment_status ENUM('PENDING', 'COMPLETED', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'PENDING',
  transaction_reference VARCHAR(100) NOT NULL,
  gateway_reference VARCHAR(100) NULL,
  payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_transaction_reference (transaction_reference),
  CONSTRAINT fk_payments_subscription
    FOREIGN KEY (subscription_id) REFERENCES subscriptions (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_payments_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_payments_recorded_by
    FOREIGN KEY (recorded_by_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  -- Index optimizes date-range financial reporting and revenue aggregations
  INDEX idx_payments_date_status (payment_date, payment_status)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 10. Table: refunds
-- Dedicated, immutable audit log for payment refunds and partial returns.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refunds (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_id BIGINT UNSIGNED NOT NULL,
  subscription_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  refunded_by_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  refund_status ENUM('PENDING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'COMPLETED',
  refund_reference VARCHAR(100) NOT NULL,
  gateway_refund_reference VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refunds_reference (refund_reference),
  CONSTRAINT fk_refunds_payment
    FOREIGN KEY (payment_id) REFERENCES payments (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_refunds_subscription
    FOREIGN KEY (subscription_id) REFERENCES subscriptions (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_refunds_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_refunds_admin
    FOREIGN KEY (refunded_by_id) REFERENCES users (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  INDEX idx_refunds_payment (payment_id),
  INDEX idx_refunds_user (user_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 11. Table: refresh_tokens
-- Stores cryptographic SHA-256 hashes of issued JWT refresh tokens.
-- Supports multi-device login sessions, token rotation, and reuse detection.
-- Referential Action: ON DELETE CASCADE (sessions purged if user account is deleted)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL DEFAULT NULL,
  replaced_by_hash VARCHAR(64) NULL DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_tokens_hash (token_hash),
  INDEX idx_refresh_tokens_user (user_id),
  INDEX idx_refresh_tokens_expires (expires_at),
  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 12. Table: trainer_assignment_requests
-- Tracks member-initiated coaching requests for Admin review and approval.
-- Enforces: Member must have active subscription to submit; Admin review required.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trainer_assignment_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  member_id BIGINT UNSIGNED NOT NULL,
  trainer_id BIGINT UNSIGNED NOT NULL,
  notes TEXT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by_id BIGINT UNSIGNED NULL,
  reviewed_at DATETIME NULL DEFAULT NULL,
  rejection_reason TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_tar_member
    FOREIGN KEY (member_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_tar_trainer
    FOREIGN KEY (trainer_id) REFERENCES users (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_tar_reviewer
    FOREIGN KEY (reviewed_by_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  INDEX idx_tar_member_status (member_id, status),
  INDEX idx_tar_trainer_status (trainer_id, status),
  INDEX idx_tar_status_created (status, created_at)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 13. Table: trainer_member_assignments
-- Tracks formal coach-to-client assignments, active coaching periods,
-- 10-day subscription-expiration grace pauses, and historical terminations.
-- Cardinality: A member has at most ONE active or paused coach assignment.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trainer_member_assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  member_id BIGINT UNSIGNED NOT NULL,
  trainer_id BIGINT UNSIGNED NOT NULL,
  request_id BIGINT UNSIGNED NULL,
  assigned_by_id BIGINT UNSIGNED NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL DEFAULT NULL,
  status ENUM('ACTIVE', 'PAUSED', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
  paused_at DATETIME NULL DEFAULT NULL,
  grace_period_ends_at DATETIME NULL DEFAULT NULL,
  terminated_at DATETIME NULL DEFAULT NULL,
  termination_reason ENUM('ADMIN_TERMINATED', 'GRACE_PERIOD_EXPIRED', 'MEMBER_REASSIGNED', 'MANUAL_RELEASE') NULL DEFAULT NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_tma_member
    FOREIGN KEY (member_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_tma_trainer
    FOREIGN KEY (trainer_id) REFERENCES users (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_tma_assigned_by
    FOREIGN KEY (assigned_by_id) REFERENCES users (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_tma_request
    FOREIGN KEY (request_id) REFERENCES trainer_assignment_requests (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  INDEX idx_tma_member_status (member_id, status),
  INDEX idx_tma_trainer_status (trainer_id, status),
  INDEX idx_tma_grace_period (status, grace_period_ends_at)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 12. Attendance Records Table (Milestone 6.2)
-- Tracks gym member check-in, optional check-out, duration, and pass status.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  member_id BIGINT UNSIGNED NOT NULL,
  subscription_id BIGINT UNSIGNED NULL DEFAULT NULL,
  check_in_time DATETIME NOT NULL,
  check_out_time DATETIME NULL DEFAULT NULL,
  duration_minutes INT UNSIGNED NULL DEFAULT NULL,
  recorded_by_id BIGINT UNSIGNED NOT NULL,
  status ENUM('CHECKED_IN', 'CHECKED_OUT') NOT NULL DEFAULT 'CHECKED_IN',
  pass_status_at_checkin ENUM('ACTIVE_PASS', 'EXPIRED_PASS', 'NO_PASS') NOT NULL DEFAULT 'ACTIVE_PASS',
  override_note TEXT NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_att_member
    FOREIGN KEY (member_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_att_subscription
    FOREIGN KEY (subscription_id) REFERENCES subscriptions (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_att_recorded_by
    FOREIGN KEY (recorded_by_id) REFERENCES users (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  INDEX idx_att_member_date (member_id, check_in_time),
  INDEX idx_att_status_checkin (status, check_in_time),
  INDEX idx_att_checkin_date (check_in_time)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 13. Exercises Catalog Table (Milestone 6.3)
-- Standard gym exercise directory + custom trainer movements.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exercises (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  muscle_group ENUM('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body', 'cardio') NOT NULL,
  equipment VARCHAR(100) NULL DEFAULT NULL,
  category VARCHAR(100) NULL DEFAULT NULL,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_trainer_id BIGINT UNSIGNED NULL DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_exercise_trainer
    FOREIGN KEY (created_by_trainer_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  INDEX idx_exercise_muscle (muscle_group),
  INDEX idx_exercise_custom_trainer (is_custom, created_by_trainer_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 14. Workout Plans Table (Milestone 6.3)
-- Workout regimen header created by trainers and assigned to athletes.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workout_plans (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  trainer_id BIGINT UNSIGNED NOT NULL,
  member_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  goal VARCHAR(255) NULL DEFAULT NULL,
  difficulty ENUM('beginner', 'intermediate', 'advanced') NOT NULL DEFAULT 'intermediate',
  notes TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_plan_trainer
    FOREIGN KEY (trainer_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_plan_member
    FOREIGN KEY (member_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  INDEX idx_plan_member_active (member_id, is_active),
  INDEX idx_plan_trainer (trainer_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 15. Workout Plan Days Table (Milestone 6.3)
-- Multi-day split segments belonging to a workout plan.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workout_plan_days (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  plan_id BIGINT UNSIGNED NOT NULL,
  day_number INT UNSIGNED NOT NULL DEFAULT 1,
  day_name VARCHAR(150) NOT NULL,
  warmup_notes TEXT NULL,
  order_index INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_day_plan
    FOREIGN KEY (plan_id) REFERENCES workout_plans (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  INDEX idx_day_plan_order (plan_id, order_index)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 16. Workout Plan Exercises Table (Milestone 6.3)
-- Specific exercise prescriptions with sets, reps, rest, and notes.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workout_plan_exercises (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  day_id BIGINT UNSIGNED NOT NULL,
  exercise_id BIGINT UNSIGNED NULL DEFAULT NULL,
  custom_name VARCHAR(150) NULL DEFAULT NULL,
  sets INT UNSIGNED NOT NULL DEFAULT 3,
  reps VARCHAR(50) NOT NULL DEFAULT '10-12',
  rest_seconds INT UNSIGNED NOT NULL DEFAULT 60,
  notes VARCHAR(255) NULL DEFAULT NULL,
  order_index INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_wpe_day
    FOREIGN KEY (day_id) REFERENCES workout_plan_days (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_wpe_exercise
    FOREIGN KEY (exercise_id) REFERENCES exercises (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  INDEX idx_wpe_day_order (day_id, order_index)
) ENGINE=InnoDB;



