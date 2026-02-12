-- Add button_text column to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS button_text TEXT DEFAULT 'Voir plus';