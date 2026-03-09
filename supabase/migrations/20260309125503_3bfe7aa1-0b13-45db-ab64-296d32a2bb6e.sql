
UPDATE sidebar_configurations
SET menu_items = menu_items::jsonb || '[{"id":"budget","label":"ZENITH by FinCare","icon":"PiggyBank","order":6,"visible":true,"categoryId":"cat-1772963756679","dataCoach":""}]'::jsonb,
    updated_at = now()
WHERE id = '1b517eaf-b239-415d-836b-f8c8b9c3eaf7';
