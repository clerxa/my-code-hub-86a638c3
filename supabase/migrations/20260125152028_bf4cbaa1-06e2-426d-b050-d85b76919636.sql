-- Add host_name column to hubspot_appointments
ALTER TABLE public.hubspot_appointments
ADD COLUMN IF NOT EXISTS host_name TEXT;