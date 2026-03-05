
UPDATE sidebar_configurations
SET menu_items = menu_items || '[{"id": "pension-tracker", "icon": "Search", "label": "PensionTracker", "order": 6, "visible": true, "dataCoach": "", "categoryId": "cat-1765899516868"}]'::jsonb,
    updated_at = now()
WHERE sidebar_type = 'employee';
