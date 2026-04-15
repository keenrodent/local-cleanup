-- Sample locations in Saint Paul, MN for development

INSERT INTO locations (latitude, longitude, title, description, location_type, cleanup_type, reported_by, status) VALUES
  (44.9537, -93.0900, 'Rice Park sidewalk', 'Litter and fast food wrappers along the west sidewalk. A few bags worth.', 'park', 'litter', 'seed@example.com', 'reported'),
  (44.9485, -93.1040, 'Summit Ave median weeds', 'Overgrown weeds pushing through cracks in the median near Lexington. Looks rough.', 'roadside', 'weeding', 'seed@example.com', 'reported'),
  (44.9630, -93.0990, 'Trout Brook trail debris', 'Brush and fallen branches blocking parts of the trail. Some plastic bags caught in trees along the creek.', 'waterway', 'brush_clearing', 'seed@example.com', 'reported'),
  (44.9390, -93.1265, 'Highland Park playground', 'Thick layer of leaves piled up around the swings and slides. Kids can barely use the equipment.', 'playground', 'leaf_removal', 'seed@example.com', 'claimed'),
  (44.9720, -93.0855, 'Payne Ave vacant lot', 'Trash accumulating in the empty lot -- bottles, cans, a few tires. Needs a solid cleanup crew.', 'lot', 'litter', 'seed@example.com', 'reported'),
  (44.9445, -93.1560, 'Mississippi River Blvd', 'Litter along the shoulder for about a quarter mile. Mostly cans and plastic.', 'roadside', 'litter', 'seed@example.com', 'reported'),
  (44.9560, -93.1150, 'Selby Ave tree wells', 'Weeds completely overtaking the tree wells between Snelling and Lexington. Could use weeding and fresh mulch.', 'roadside', 'weeding', 'seed@example.com', 'reported'),
  (44.9340, -93.0780, 'Kaposia Landing brush', 'Overgrown brush near the parking area. About 20 sq ft cleared.', 'park', 'brush_clearing', 'seed@example.com', 'cleaned');

-- One signup for the claimed location
INSERT INTO signups (location_id, volunteer_name, volunteer_email, planned_date) VALUES
  (4, 'Jane Doe', 'jane@example.com', '2026-04-20');

-- One completion for the cleaned location
INSERT INTO completions (location_id, notes) VALUES
  (8, 'Cleared about 20 square feet of brush. Looks great now!');
