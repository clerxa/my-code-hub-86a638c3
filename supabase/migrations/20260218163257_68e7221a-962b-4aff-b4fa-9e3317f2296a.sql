-- Add CTA conversion block fields to blog_posts
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS cta_text text,
ADD COLUMN IF NOT EXISTS cta_url text,
ADD COLUMN IF NOT EXISTS cta_button_label text DEFAULT 'En savoir plus',
ADD COLUMN IF NOT EXISTS cta_style text DEFAULT 'banner',
ADD COLUMN IF NOT EXISTS cta_position text DEFAULT 'end';

COMMENT ON COLUMN public.blog_posts.cta_text IS 'CTA block text/headline displayed in the article';
COMMENT ON COLUMN public.blog_posts.cta_url IS 'CTA target URL (internal or external)';
COMMENT ON COLUMN public.blog_posts.cta_button_label IS 'CTA button label text';
COMMENT ON COLUMN public.blog_posts.cta_style IS 'CTA visual style: banner, card, inline';
COMMENT ON COLUMN public.blog_posts.cta_position IS 'CTA position in article: end, middle, both';