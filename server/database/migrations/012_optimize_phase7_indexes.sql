-- ============================================================================
-- GymPilot Phase 7: Database Query Analysis & Index Optimization
-- Migration: 012_optimize_phase7_indexes.sql
-- ============================================================================

-- 1. Optimize revenue calculations and status-filtered financial queries
-- Eliminates full table scans on payments table when aggregating completed revenue or filtering by status
ALTER TABLE payments
  ADD INDEX idx_payments_status_date (payment_status, payment_date);

-- 2. Optimize member-specific payment history ordered by date
-- Covers user ledger pagination without requiring filesort
ALTER TABLE payments
  ADD INDEX idx_payments_user_date (user_id, payment_date);

-- 3. Optimize trainer athlete roster queries filtered by status and sorted by assignment creation
-- Accelerates trainer workspace athlete roster queries
ALTER TABLE trainer_member_assignments
  ADD INDEX idx_tma_trainer_status_created (trainer_id, status, created_at);
