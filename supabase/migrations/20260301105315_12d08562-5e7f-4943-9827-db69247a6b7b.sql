
UPDATE sidebar_configurations 
SET menu_items = menu_items || '[{"id":"vega","label":"Vega","icon":"TrendingUp","order":4,"visible":true,"categoryId":"cat-1765899516868","dataCoach":""}]'::jsonb
WHERE sidebar_type = 'employee';
