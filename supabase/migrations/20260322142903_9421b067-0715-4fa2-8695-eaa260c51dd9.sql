
UPDATE sidebar_configurations
SET menu_items = (
  SELECT jsonb_agg(
    CASE 
      WHEN item->>'id' = 'panorama' THEN item
      ELSE item
    END
  )
  FROM (
    SELECT unnest(
      ARRAY(
        SELECT jsonb_array_elements(menu_items::jsonb)
        FROM sidebar_configurations
        WHERE sidebar_type = 'employee'
      )
    ) AS item
    UNION ALL
    SELECT '{"id":"panorama","label":"PANORAMA","icon":"LayoutDashboard","order":0,"visible":true,"categoryId":"cat-1772963756679","dataCoach":""}'::jsonb
    WHERE NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(
        (SELECT menu_items::jsonb FROM sidebar_configurations WHERE sidebar_type = 'employee')
      ) AS el WHERE el->>'id' = 'panorama'
    )
  ) sub
)
WHERE sidebar_type = 'employee'
