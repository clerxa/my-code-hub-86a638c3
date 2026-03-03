UPDATE sidebar_configurations
SET menu_items = menu_items::jsonb || '[{"id":"presentations","label":"Présentations Prospects","url":"/admin/presentations","icon":"FileText","order":12,"visible":true,"categoryId":"cat-1765902968568"}]'::jsonb
WHERE sidebar_type = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM jsonb_array_elements(menu_items::jsonb) elem WHERE elem->>'id' = 'presentations'
);