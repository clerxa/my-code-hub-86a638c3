
-- Deduplicate product_rate_tiers
DELETE FROM product_rate_tiers WHERE id NOT IN (
  SELECT DISTINCT ON (product_id, horizon_min_years, horizon_max_years) id
  FROM product_rate_tiers
  ORDER BY product_id, horizon_min_years, horizon_max_years, created_at ASC
);

-- Deduplicate product_category_links
DELETE FROM product_category_links WHERE id NOT IN (
  SELECT DISTINCT ON (product_id, category_id) id
  FROM product_category_links
  ORDER BY product_id, category_id, created_at ASC
);

-- Add unique constraints to prevent future duplicates
ALTER TABLE product_rate_tiers ADD CONSTRAINT product_rate_tiers_unique UNIQUE (product_id, horizon_min_years, horizon_max_years);
ALTER TABLE product_category_links ADD CONSTRAINT product_category_links_unique UNIQUE (product_id, category_id);
