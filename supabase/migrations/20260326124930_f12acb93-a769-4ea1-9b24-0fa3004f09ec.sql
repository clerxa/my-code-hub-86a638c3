
UPDATE sidebar_configurations
SET menu_items = menu_items || '[{"id":"webinar-reminders","label":"Rappels Webinar","url":"/admin/webinar-reminders","icon":"Bell","order":1,"visible":true,"categoryId":"cat-1765902648977"}]'::jsonb
WHERE sidebar_type = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(menu_items) elem
    WHERE elem->>'id' = 'webinar-reminders'
  );
