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
  specialization VARCHAR(100) NOT NULL,
  experience_years INT UNSIGNED NOT NULL DEFAULT 0,
  certification VARCHAR(200) NULL,
  bio TEXT NULL,
  monthly_salary DECIMAL(10, 2) NULL,
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
-- 6. Table: subscriptions
-- Manages membership contracts, start/end dates, renewal states, and pricing snapshots.
-- Referential Actions: ON DELETE RESTRICT (preserves historical memberships)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  plan_id BIGINT UNSIGNED NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price_paid DECIMAL(10, 2) NOT NULL,
  status ENUM('queued', 'active', 'expired', 'cancelled') NOT NULL DEFAULT 'active',
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
  -- Index optimizes lookup of a member's active and queued subscriptions
  INDEX idx_subscriptions_user_status (user_id, status),
  -- Composite index used by the transaction row-lock query during overlap validation
  INDEX idx_subscriptions_overlap_check (user_id, plan_id, status, end_date),
  -- Index optimizes daily midnight batch processing to expire completed subscriptions
  INDEX idx_subscriptions_status_end_date (status, end_date)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 7. Table: payments
-- Immutable financial audit log of subscription transactions.
-- Referential Actions: ON DELETE RESTRICT (preserves financial records)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  subscription_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  recorded_by_id BIGINT UNSIGNED NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('CASH', 'CARD', 'UPI', 'NET_BANKING') NOT NULL,
  payment_status ENUM('COMPLETED', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'COMPLETED',
  transaction_reference VARCHAR(100) NOT NULL,
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

