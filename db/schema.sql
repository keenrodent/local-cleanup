-- local-cleanup D1 schema

CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  description TEXT NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('roadside', 'park', 'lot', 'playground', 'waterway', 'other')),
  cleanup_type TEXT NOT NULL CHECK (cleanup_type IN ('litter', 'leaf_removal', 'brush_clearing', 'weeding', 'other')),
  reported_by TEXT NOT NULL,
  reported_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'claimed', 'cleaned')),
  photo_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_locations_status ON locations (status);
CREATE INDEX IF NOT EXISTS idx_locations_reported_at ON locations (reported_at);

CREATE TABLE IF NOT EXISTS signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL REFERENCES locations(id),
  volunteer_name TEXT NOT NULL,
  volunteer_email TEXT NOT NULL,
  signed_up_at TEXT NOT NULL DEFAULT (datetime('now')),
  planned_date TEXT
);

CREATE INDEX IF NOT EXISTS idx_signups_location_id ON signups (location_id);

CREATE TABLE IF NOT EXISTS completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL REFERENCES locations(id),
  signup_id INTEGER REFERENCES signups(id),
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  photo_url TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_completions_location_id ON completions (location_id);
