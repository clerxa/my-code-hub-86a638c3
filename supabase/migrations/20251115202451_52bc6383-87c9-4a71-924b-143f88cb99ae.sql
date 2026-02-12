-- Add total_connections column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_connections integer DEFAULT 0;