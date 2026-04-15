-- Sample spots and tasks in Saint Paul, MN for development

-- Multi-task spot: park with several things to do
INSERT INTO spots (latitude, longitude, title, location_type, created_by) VALUES
  (44.9537, -93.0900, 'Rice Park sidewalk', 'park', 'seed@example.com');
INSERT INTO tasks (spot_id, description, cleanup_type, added_by) VALUES
  (1, 'Litter and fast food wrappers along the west sidewalk', 'litter', 'seed@example.com'),
  (1, 'Weeds pushing through cracks near the benches', 'weeding', 'seed@example.com');

-- Single-task spot
INSERT INTO spots (latitude, longitude, title, location_type, created_by) VALUES
  (44.9485, -93.1040, 'Summit Ave median weeds', 'roadside', 'seed@example.com');
INSERT INTO tasks (spot_id, description, cleanup_type, added_by) VALUES
  (2, 'Overgrown weeds on the median near Lexington', 'weeding', 'seed@example.com');

-- Spot with mixed task statuses (some open, one claimed)
INSERT INTO spots (latitude, longitude, title, location_type, created_by) VALUES
  (44.9630, -93.0990, 'Trout Brook trail', 'waterway', 'seed@example.com');
INSERT INTO tasks (spot_id, description, cleanup_type, status, added_by) VALUES
  (3, 'Brush and fallen branches blocking the trail', 'brush_clearing', 'claimed', 'seed@example.com'),
  (3, 'Plastic bags caught in trees along the creek', 'litter', 'open', 'seed@example.com');
INSERT INTO signups (task_id, volunteer_name, volunteer_email, planned_date) VALUES
  (4, 'Jane Doe', 'jane@example.com', '2026-04-20');

-- Spot with a claimed task (playground)
INSERT INTO spots (latitude, longitude, title, location_type, created_by) VALUES
  (44.9390, -93.1265, 'Highland Park playground', 'playground', 'seed@example.com');
INSERT INTO tasks (spot_id, description, cleanup_type, status, added_by) VALUES
  (4, 'Thick layer of leaves around swings and slides', 'leaf_removal', 'claimed', 'seed@example.com');
INSERT INTO signups (task_id, volunteer_name, volunteer_email, planned_date) VALUES
  (6, 'Bob Smith', 'bob@example.com', '2026-04-19');

-- Single-task spot
INSERT INTO spots (latitude, longitude, title, location_type, created_by) VALUES
  (44.9720, -93.0855, 'Payne Ave vacant lot', 'lot', 'seed@example.com');
INSERT INTO tasks (spot_id, description, cleanup_type, added_by) VALUES
  (5, 'Bottles, cans, a few tires. Needs a solid cleanup crew.', 'litter', 'seed@example.com');

-- Single-task spot
INSERT INTO spots (latitude, longitude, title, location_type, created_by) VALUES
  (44.9445, -93.1560, 'Mississippi River Blvd', 'roadside', 'seed@example.com');
INSERT INTO tasks (spot_id, description, cleanup_type, added_by) VALUES
  (6, 'Litter along the shoulder for about a quarter mile', 'litter', 'seed@example.com');

-- Multi-task spot with mixed status
INSERT INTO spots (latitude, longitude, title, location_type, created_by) VALUES
  (44.9560, -93.1150, 'Selby Ave tree wells', 'roadside', 'seed@example.com');
INSERT INTO tasks (spot_id, description, cleanup_type, status, added_by) VALUES
  (7, 'Weeds overtaking the tree wells between Snelling and Lexington', 'weeding', 'done', 'seed@example.com'),
  (7, 'Fresh mulch needed around the trees', 'other', 'open', 'seed@example.com');
UPDATE tasks SET completed_at = datetime('now', '-3 days'), completion_notes = 'Pulled all the weeds, looking good!' WHERE id = 10;

-- All-done spot
INSERT INTO spots (latitude, longitude, title, location_type, created_by) VALUES
  (44.9340, -93.0780, 'Kaposia Landing brush', 'park', 'seed@example.com');
INSERT INTO tasks (spot_id, description, cleanup_type, status, added_by, completed_at, completion_notes) VALUES
  (8, 'Overgrown brush near the parking area', 'brush_clearing', 'done', 'seed@example.com', datetime('now', '-7 days'), 'Cleared about 20 square feet of brush. Looks great now!');
