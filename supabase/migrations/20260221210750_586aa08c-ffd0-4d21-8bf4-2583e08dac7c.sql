
-- Add rich content columns to landing_pages (JSONB for flexible section data)
ALTER TABLE public.landing_pages
  ADD COLUMN IF NOT EXISTS problems JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS solution JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cta_final JSONB DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.landing_pages.problems IS 'Array of {title, description, icon} for the problems section';
COMMENT ON COLUMN public.landing_pages.solution IS '{title, description, pillars: [{title, description, icon}]}';
COMMENT ON COLUMN public.landing_pages.benefits IS '{title, items: [{title, description, icon}]}';
COMMENT ON COLUMN public.landing_pages.faq IS 'Array of {question, answer}';
COMMENT ON COLUMN public.landing_pages.cta_final IS '{title, subtitle, cta}';
