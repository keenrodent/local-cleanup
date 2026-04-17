-- Add claimed_at to tasks for expiry tracking
ALTER TABLE tasks ADD COLUMN claimed_at TEXT;
