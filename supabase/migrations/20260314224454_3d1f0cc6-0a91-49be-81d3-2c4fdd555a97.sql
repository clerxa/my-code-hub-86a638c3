
UPDATE sidebar_configurations 
SET menu_items = (
  SELECT jsonb_agg(item) 
  FROM jsonb_array_elements(menu_items::jsonb) AS item 
  WHERE item->>'id' != 'profile-info'
),
updated_at = now()
WHERE id = '1b517eaf-b239-415d-836b-f8c8b9c3eaf7';
