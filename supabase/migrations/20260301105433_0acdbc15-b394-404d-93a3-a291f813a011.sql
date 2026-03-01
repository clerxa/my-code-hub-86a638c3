
UPDATE sidebar_configurations 
SET menu_items = (
  SELECT jsonb_agg(
    CASE 
      WHEN item->>'id' = 'vega' 
      THEN jsonb_set(item, '{label}', '"VEGA by FinCare"')
      ELSE item 
    END
  )
  FROM jsonb_array_elements(menu_items) AS item
)
WHERE sidebar_type = 'employee';
