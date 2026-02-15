UPDATE sidebar_configurations 
SET menu_items = jsonb_set(
  menu_items::jsonb,
  '{13}',
  '{"id": "horizon", "icon": "Compass", "label": "Horizon Patrimonial", "order": 5, "visible": true, "dataCoach": "", "categoryId": "cat-1765899516868"}'::jsonb
)
|| '[]'::jsonb
WHERE id = '1b517eaf-b239-415d-836b-f8c8b9c3eaf7';

-- Actually, let's use a proper approach: append to the array
UPDATE sidebar_configurations 
SET menu_items = (menu_items::jsonb || '[{"id": "horizon", "icon": "Compass", "label": "Horizon Patrimonial", "order": 5, "visible": true, "dataCoach": "", "categoryId": "cat-1765899516868"}]'::jsonb)
WHERE id = '1b517eaf-b239-415d-836b-f8c8b9c3eaf7';