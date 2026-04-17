-- Spot notes: sticky facts about a place (not tasks)
CREATE TABLE IF NOT EXISTS spot_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spot_id INTEGER NOT NULL REFERENCES spots(id),
  note TEXT NOT NULL,
  added_by TEXT NOT NULL,
  added_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_spot_notes_spot_id ON spot_notes (spot_id);
