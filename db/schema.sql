-- local-cleanup D1 schema (spots + tasks model)

CREATE TABLE IF NOT EXISTS spots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  title TEXT NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('roadside', 'park', 'lot', 'playground', 'waterway', 'other')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  hidden INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_spots_created_at ON spots (created_at);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spot_id INTEGER NOT NULL REFERENCES spots(id),
  description TEXT,
  cleanup_type TEXT NOT NULL CHECK (cleanup_type IN ('litter', 'leaf_removal', 'brush_clearing', 'weeding', 'other')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'done')),
  added_by TEXT NOT NULL,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  claimed_at TEXT,
  completed_at TEXT,
  completion_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_tasks_spot_id ON tasks (spot_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);

CREATE TABLE IF NOT EXISTS signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id),
  volunteer_name TEXT NOT NULL,
  volunteer_email TEXT NOT NULL,
  signed_up_at TEXT NOT NULL DEFAULT (datetime('now')),
  planned_date TEXT
);

CREATE INDEX IF NOT EXISTS idx_signups_task_id ON signups (task_id);

CREATE TABLE IF NOT EXISTS spot_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spot_id INTEGER NOT NULL REFERENCES spots(id),
  note TEXT NOT NULL,
  added_by TEXT NOT NULL,
  added_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_spot_notes_spot_id ON spot_notes (spot_id);
