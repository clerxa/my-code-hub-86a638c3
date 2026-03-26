-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create a cron job that runs every day at 8:00 AM (Paris time = 7:00 UTC in summer, 6:00 UTC in winter)
-- Using 7:00 UTC as a good middle ground
SELECT cron.schedule(
  'send-webinar-reminders-daily',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gbotqqeirtbmmyxqwtzl.supabase.co/functions/v1/send-webinar-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdib3RxcWVpcnRibW15eHF3dHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDkyMDcsImV4cCI6MjA4NjQ4NTIwN30.Hq0hL5OjFcWuUeVMFVLnzPd3CsDSOEh2hI4ED4ekWUU"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
