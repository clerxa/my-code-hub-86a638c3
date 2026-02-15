
-- Remove duplicates and keep clean array
UPDATE sidebar_configurations 
SET menu_items = (
  SELECT jsonb_agg(item)
  FROM (
    SELECT DISTINCT ON ((item->>'id')) item
    FROM jsonb_array_elements(menu_items::jsonb) AS item
    ORDER BY (item->>'id'), (item->>'order')::int
  ) sub
)
WHERE id = '1b517eaf-b239-415d-836b-f8c8b9c3eaf7';
