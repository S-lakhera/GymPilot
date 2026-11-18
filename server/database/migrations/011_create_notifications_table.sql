-- ============================================================================
-- GymPilot Milestone 6.4: Expired Membership Tracking & Automated Notifications
-- Migration: 011_create_notifications_table.sql
-- ============================================================================

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
