-- Add soft delete support to spots
ALTER TABLE spots ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0;
