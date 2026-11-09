-- ============================================================================
-- GymPilot Realistic Seed Data (seeds.sql)
-- Default test password for all users: Password@123
-- Pre-hashed bcrypt (10 rounds): $2a$10$YDALDg2OP2yChMkxyR8sMOdVjTo4dtHDiUrFOfdeO19aSvks.KW0i
-- ============================================================================

USE gympilot_db;

-- Clear existing data in reverse dependency order (safe for re-seeding)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE refresh_tokens;
TRUNCATE TABLE payments;
TRUNCATE TABLE subscriptions;
TRUNCATE TABLE plans;
TRUNCATE TABLE plan_categories;
TRUNCATE TABLE member_profiles;
TRUNCATE TABLE trainer_profiles;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. Insert Users (Admin, Trainers, Members)
-- ----------------------------------------------------------------------------
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active, created_at, updated_at, deleted_at)
VALUES
  -- 1. Super Admin
  (1, 'admin@gympilot.com', '$2a$10$YDALDg2OP2yChMkxyR8sMOdVjTo4dtHDiUrFOfdeO19aSvks.KW0i', 'Vikramaditya', 'Singhania', '+91-9811100001', 'admin', TRUE, '2026-01-01 08:00:00', '2026-01-01 08:00:00', NULL),

  -- 2-4. Trainers
  (2, 'trainer.alex@gympilot.com', '$2a$10$YDALDg2OP2yChMkxyR8sMOdVjTo4dtHDiUrFOfdeO19aSvks.KW0i', 'Alex', 'Fernandes', '+91-9822200002', 'trainer', TRUE, '2026-01-15 09:00:00', '2026-01-15 09:00:00', NULL),
  (3, 'trainer.sarah@gympilot.com', '$2a$10$YDALDg2OP2yChMkxyR8sMOdVjTo4dtHDiUrFOfdeO19aSvks.KW0i', 'Sarah', 'Khan', '+91-9833300003', 'trainer', TRUE, '2026-02-01 09:30:00', '2026-02-01 09:30:00', NULL),
  (4, 'trainer.marcus@gympilot.com', '$2a$10$YDALDg2OP2yChMkxyR8sMOdVjTo4dtHDiUrFOfdeO19aSvks.KW0i', 'Marcus', 'DSouza', '+91-9844400004', 'trainer', TRUE, '2026-02-15 10:00:00', '2026-02-15 10:00:00', NULL),

  -- 5-10. Members
  (5, 'rahul.sharma@gmail.com', '$2a$10$YDALDg2OP2yChMkxyR8sMOdVjTo4dtHDiUrFOfdeO19aSvks.KW0i', 'Rahul', 'Sharma', '+91-9855500005', 'member', TRUE, '2026-03-01 10:30:00', '2026-03-01 10:30:00', NULL),
  (6, 'priya.patel@gmail.com', '$2a$10$YDALDg2OP2yChMkxyR8sMOdVjTo4dtHDiUrFOfdeO19aSvks.KW0i', 'Priya', 'Patel', '+91-9866600006', 'member', TRUE, '2026-03-10 11:00:00', '2026-03-10 11:00:00', NULL),
  (7, 'amit.verma@gmail.com', '$2a$10$YDALDg2OP2yChMkxyR8sMOdVjTo4dtHDiUrFOfdeO19aSvks.KW0i', 'Amit', 'Verma', '+91-9877700007', 'member', TRUE, '2026-03-15 11:30:00', '2026-03-15 11:30:00', NULL),
  (8, 'sneha.reddy@gmail.com', '$2a$10$YDALDg2OP2yChMkxyR8sMOdVjTo4dtHDiUrFOfdeO19aSvks.KW0i', 'Sneha', 'Reddy', '+91-9888800008', 'member', TRUE, '2026-10-25 14:00:00', '2026-10-25 14:00:00', NULL),
  (9, 'vikram.singh@gmail.com', '$2a$10$YDALDg2OP2yChMkxyR8sMOdVjTo4dtHDiUrFOfdeO19aSvks.KW0i', 'Vikram', 'Singh', '+91-9899900009', 'member', TRUE, '2026-04-01 12:00:00', '2026-04-01 12:00:00', NULL),
  (10, 'karan.mehta@gmail.com', '$2a$10$YDALDg2OP2yChMkxyR8sMOdVjTo4dtHDiUrFOfdeO19aSvks.KW0i', 'Karan', 'Mehta', '+91-9800000010', 'member', FALSE, '2026-04-10 15:00:00', '2026-10-15 11:30:00', '2026-10-15 11:30:00');

-- ----------------------------------------------------------------------------
-- 2. Insert Trainer Profiles
-- ----------------------------------------------------------------------------
INSERT INTO trainer_profiles (id, user_id, specialization, experience_years, certification, bio, monthly_salary, created_at, updated_at)
VALUES
  (1, 2, 'Strength & Hypertrophy', 6, 'CSCS, ACE Certified Coach', 'Specializes in barbell compound lifts, power building, and structural progression.', 45000.00, '2026-01-15 09:00:00', '2026-01-15 09:00:00'),
  (2, 3, 'Hatha & Vinyasa Yoga', 4, 'RYT-500 Yoga Alliance', 'Focuses on holistic joint mobility, flexibility, breathing techniques, and posture correction.', 38000.00, '2026-02-01 09:30:00', '2026-02-01 09:30:00'),
  (3, 4, 'CrossFit & Functional HIIT', 5, 'CrossFit Level 2, Kettlebell Coach', 'High-intensity conditioning, gymnastics, Olympic lifts, and metabolic endurance.', 42000.00, '2026-02-15 10:00:00', '2026-02-15 10:00:00');

-- ----------------------------------------------------------------------------
-- 3. Insert Member Profiles
-- ----------------------------------------------------------------------------
INSERT INTO member_profiles (id, user_id, date_of_birth, gender, emergency_contact_name, emergency_contact_phone, health_conditions, created_at, updated_at)
VALUES
  (1, 5, '1995-04-12', 'male', 'Sunita Sharma', '+91-9855599991', 'Mild lower back stiffness on heavy deadlifts', '2026-03-01 10:30:00', '2026-03-01 10:30:00'),
  (2, 6, '1998-08-23', 'female', 'Ramesh Patel', '+91-9866699992', 'None reported', '2026-03-10 11:00:00', '2026-03-10 11:00:00'),
  (3, 7, '1992-11-05', 'male', 'Neha Verma', '+91-9877799993', 'Controlled stage 1 hypertension', '2026-03-15 11:30:00', '2026-03-15 11:30:00'),
  (4, 8, '2001-02-17', 'female', 'Kiran Reddy', '+91-9888899994', 'Asthma (uses inhaler before intense workouts)', '2026-10-25 14:00:00', '2026-10-25 14:00:00'),
  (5, 9, '1996-07-30', 'male', 'Baljeet Singh', '+91-9899999995', 'Rehabilitated ACL reconstruction (2024)', '2026-04-01 12:00:00', '2026-04-01 12:00:00'),
  (6, 10, '1994-09-14', 'male', 'Pooja Mehta', '+91-9800099996', 'None reported', '2026-04-10 15:00:00', '2026-04-10 15:00:00');

-- ----------------------------------------------------------------------------
-- 4. Insert Plan Categories
-- ----------------------------------------------------------------------------
INSERT INTO plan_categories (id, name, description, is_active, created_at, updated_at)
VALUES
  (1, 'Strength Training', 'Comprehensive resistance training, free weights, Olympic barbells, and machine access.', TRUE, '2026-01-05 08:00:00', '2026-01-05 08:00:00'),
  (2, 'Cardio & HIIT', 'Access to treadmills, stationary bikes, rowing machines, and scheduled HIIT circuits.', TRUE, '2026-01-05 08:00:00', '2026-01-05 08:00:00'),
  (3, 'Yoga & Flexibility', 'Guided mat yoga sessions, mobility stretching, and breathwork workshops.', TRUE, '2026-01-05 08:00:00', '2026-01-05 08:00:00'),
  (4, 'CrossFit & Functional', 'CrossFit box access, functional movement rigs, plyometrics, and kettlebell training.', TRUE, '2026-01-05 08:00:00', '2026-01-05 08:00:00');

-- ----------------------------------------------------------------------------
-- 5. Insert Membership Plans (Affordable Indian Gym Pricing)
-- ----------------------------------------------------------------------------
INSERT INTO plans (id, category_id, name, description, duration_days, price, is_active, created_at, updated_at)
VALUES
  -- Category 1: Strength
  (1, 1, 'Strength Monthly Pass', '30-day full access to free weights, racks, and resistance machines.', 30, 899.00, TRUE, '2026-01-10 09:00:00', '2026-01-10 09:00:00'),
  (2, 1, 'Strength Quarterly Pass', '90-day comprehensive strength training with discounted quarterly rate.', 90, 2299.00, TRUE, '2026-01-10 09:00:00', '2026-01-10 09:00:00'),
  (3, 1, 'Strength Annual Elite', '365-day full year strength access with locker priority.', 365, 6999.00, TRUE, '2026-01-10 09:00:00', '2026-01-10 09:00:00'),

  -- Category 2: Cardio & HIIT
  (4, 2, 'Cardio Monthly Kickstart', '30-day unlimited cardio deck and spinning bike access.', 30, 699.00, TRUE, '2026-01-10 09:00:00', '2026-01-10 09:00:00'),
  (5, 2, 'Cardio Quarterly Pro', '90-day cardio endurance and circuit training package.', 90, 1799.00, TRUE, '2026-01-10 09:00:00', '2026-01-10 09:00:00'),

  -- Category 3: Yoga & Flexibility
  (6, 3, 'Yoga Monthly Zen', '30-day access to daily morning and evening guided yoga sessions.', 30, 749.00, TRUE, '2026-01-10 09:00:00', '2026-01-10 09:00:00'),
  (7, 3, 'Yoga Annual Serenity', '365-day annual yoga, meditation, and pranayama membership.', 365, 5999.00, TRUE, '2026-01-10 09:00:00', '2026-01-10 09:00:00'),

  -- Category 4: CrossFit & Functional
  (8, 4, 'CrossFit Quarterly Warrior', '90-day intense functional fitness and WOD sessions.', 90, 2499.00, TRUE, '2026-01-10 09:00:00', '2026-01-10 09:00:00');

-- ----------------------------------------------------------------------------
-- 6. Insert Discounts
-- ----------------------------------------------------------------------------
INSERT INTO discounts (id, code, name, description, discount_type, discount_value, max_discount_amount, min_purchase_amount, start_date, end_date, usage_limit, per_user_limit, times_used, is_active, created_at, updated_at)
VALUES
  (1, 'WELCOME10', 'Welcome New Member Discount', '10% off any membership plan on first registration.', 'PERCENTAGE', 10.00, 150.00, 500.00, '2026-01-01', '2026-12-31', 500, 1, 2, TRUE, '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
  (2, 'NEWYEAR2026', 'New Year 2026 Fitness Offer', 'Flat ₹200 off on quarterly or annual packages.', 'FIXED', 200.00, NULL, 1500.00, '2026-01-01', '2026-12-31', 100, 1, 0, TRUE, '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
  (3, 'STRENGTH50', 'Strength Discipline Promo', 'Flat ₹50 off dedicated strength training passes.', 'FIXED', 50.00, NULL, 700.00, '2026-01-01', '2026-12-31', NULL, 2, 0, TRUE, '2026-01-01 00:00:00', '2026-01-01 00:00:00');

-- ----------------------------------------------------------------------------
-- 7. Insert Discount Plan Mappings (Plan-Specific Eligibility)
-- STRENGTH50 is eligible only for Strength plans (Plan IDs: 1, 2, 3)
-- ----------------------------------------------------------------------------
INSERT INTO discount_plans (id, discount_id, plan_id, created_at)
VALUES
  (1, 3, 1, '2026-01-01 00:00:00'),
  (2, 3, 2, '2026-01-01 00:00:00'),
  (3, 3, 3, '2026-01-01 00:00:00');

-- ----------------------------------------------------------------------------
-- 8. Insert Subscriptions
-- Covering: Multi-category concurrent active, queued renewal, expired, and pricing snapshots.
-- ----------------------------------------------------------------------------
INSERT INTO subscriptions (id, user_id, plan_id, start_date, end_date, base_amount, discount_id, discount_amount, final_amount, currency, price_paid, status, created_at, updated_at)
VALUES
  -- Member 1 (Rahul Sharma): Holds 2 concurrent active subscriptions in DIFFERENT categories
  (1, 5, 2, '2026-10-01', '2026-12-30', 2299.00, NULL, 0.00, 2299.00, 'INR', 2299.00, 'active', '2026-10-01 10:00:00', '2026-10-01 10:00:00'), -- Strength Quarterly
  (2, 5, 6, '2026-10-15', '2026-11-14', 749.00, NULL, 0.00, 749.00, 'INR', 749.00, 'active', '2026-10-15 10:30:00', '2026-10-15 10:30:00'),  -- Yoga Monthly

  -- Member 2 (Priya Patel): Holds 1 active subscription + 1 queued renewal in the SAME category
  (3, 6, 1, '2026-10-10', '2026-11-09', 899.00, NULL, 0.00, 899.00, 'INR', 899.00, 'active', '2026-10-10 11:00:00', '2026-10-10 11:00:00'),  -- Current Strength Monthly
  (4, 6, 2, '2026-11-10', '2027-02-08', 2299.00, NULL, 0.00, 2299.00, 'INR', 2299.00, 'queued', '2026-10-28 16:45:00', '2026-10-28 16:45:00'), -- Queued Strength Quarterly

  -- Member 3 (Amit Verma): Expired historical subscription
  (5, 7, 4, '2026-08-01', '2026-08-31', 699.00, NULL, 0.00, 699.00, 'INR', 699.00, 'expired', '2026-08-01 09:15:00', '2026-09-01 00:01:00'), -- Cardio Monthly

  -- Member 5 (Vikram Singh): Active CrossFit subscription
  (6, 9, 8, '2026-09-15', '2026-12-14', 2499.00, NULL, 0.00, 2499.00, 'INR', 2499.00, 'active', '2026-09-15 12:30:00', '2026-09-15 12:30:00'), -- CrossFit Quarterly

  -- Member 6 (Karan Mehta - Deactivated user): Historical expired subscription
  (7, 10, 1, '2026-09-01', '2026-10-01', 899.00, NULL, 0.00, 899.00, 'INR', 899.00, 'expired', '2026-09-01 15:30:00', '2026-10-02 00:01:00');

-- ----------------------------------------------------------------------------
-- 9. Insert Payments (Matching subscription transactions with IST timestamps)
-- ----------------------------------------------------------------------------
INSERT INTO payments (id, subscription_id, user_id, recorded_by_id, amount, base_amount, discount_amount, currency, payment_method, payment_status, transaction_reference, gateway_reference, payment_date, created_at)
VALUES
  (1, 1, 5, 1, 2299.00, 2299.00, 0.00, 'INR', 'UPI', 'COMPLETED', 'TXN-20261001-RAHUL-STR', 'GW_UPI_1001', '2026-10-01 10:02:15', '2026-10-01 10:02:15'),
  (2, 2, 5, 1, 749.00, 749.00, 0.00, 'INR', 'CARD', 'COMPLETED', 'TXN-20261015-RAHUL-YOG', 'GW_CRD_1015', '2026-10-15 10:32:40', '2026-10-15 10:32:40'),
  (3, 3, 6, 1, 899.00, 899.00, 0.00, 'INR', 'UPI', 'COMPLETED', 'TXN-20261010-PRIYA-STR', 'GW_UPI_1010', '2026-10-10 11:01:50', '2026-10-10 11:01:50'),
  (4, 4, 6, 1, 2299.00, 2299.00, 0.00, 'INR', 'NET_BANKING', 'COMPLETED', 'TXN-20261028-PRIYA-RNW', 'GW_NB_1028', '2026-10-28 16:46:12', '2026-10-28 16:46:12'),
  (5, 5, 7, 1, 699.00, 699.00, 0.00, 'INR', 'CASH', 'COMPLETED', 'TXN-20260801-AMIT-CRD', NULL, '2026-08-01 09:16:00', '2026-08-01 09:16:00'),
  (6, 6, 9, 1, 2499.00, 2499.00, 0.00, 'INR', 'UPI', 'COMPLETED', 'TXN-20260915-VIKRAM-CF', 'GW_UPI_0915', '2026-09-15 12:31:05', '2026-09-15 12:31:05'),
  (7, 7, 10, 1, 899.00, 899.00, 0.00, 'INR', 'CASH', 'COMPLETED', 'TXN-20260901-KARAN-STR', NULL, '2026-09-01 15:31:20', '2026-09-01 15:31:20');

