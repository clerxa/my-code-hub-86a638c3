UPDATE sidebar_configurations
SET menu_items = menu_items || '[{"id": "decryptez-per", "icon": "FileText", "label": "Décryptez votre PER", "order": 7, "visible": true, "dataCoach": "", "categoryId": "cat-1765899516868"}]'::jsonb,
    updated_at = now()
WHERE sidebar_type = 'employee';