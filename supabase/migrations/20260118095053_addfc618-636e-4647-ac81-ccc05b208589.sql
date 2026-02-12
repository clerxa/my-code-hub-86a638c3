-- Add anonymous columns to forum_comments table
ALTER TABLE public.forum_comments 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS display_pseudo TEXT,
ADD COLUMN IF NOT EXISTS display_avatar_url TEXT;