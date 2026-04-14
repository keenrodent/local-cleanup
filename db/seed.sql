-- Sample locations in Saint Paul, MN for development

INSERT INTO locations (latitude, longitude, description, location_type, cleanup_type, reported_by, status) VALUES
  (44.9537, -93.0900, 'Litter along the sidewalk near Rice Park', 'park', 'litter', 'seed@example.com', 'reported'),
  (44.9485, -93.1040, 'Overgrown weeds on Summit Ave median', 'roadside', 'weeding', 'seed@example.com', 'reported'),
  (44.9630, -93.0990, 'Brush and debris along Trout Brook trail', 'waterway', 'brush_clearing', 'seed@example.com', 'reported'),
  (44.9390, -93.1265, 'Leaves piled up in Highland Park playground', 'playground', 'leaf_removal', 'seed@example.com', 'claimed'),
  (44.9720, -93.0855, 'Trash in vacant lot on Payne Ave', 'lot', 'litter', 'seed@example.com', 'reported'),
  (44.9445, -93.1560, 'Litter along Mississippi River Blvd', 'roadside', 'litter', 'seed@example.com', 'reported'),
  (44.9560, -93.1150, 'Weeds overtaking Selby Ave tree wells', 'roadside', 'weeding', 'seed@example.com', 'reported'),
  (44.9340, -93.0780, 'Brush clearing needed at Kaposia Landing', 'park', 'brush_clearing', 'seed@example.com', 'cleaned');

-- One signup for the claimed location
INSERT INTO signups (location_id, volunteer_name, volunteer_email, planned_date) VALUES
  (4, 'Jane Doe', 'jane@example.com', '2026-04-20');

-- One completion for the cleaned location
INSERT INTO completions (location_id, notes) VALUES
  (8, 'Cleared about 20 square feet of brush. Looks great now!');
