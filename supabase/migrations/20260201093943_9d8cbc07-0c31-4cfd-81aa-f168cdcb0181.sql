-- Add unique constraint on hubspot_meeting_id + meeting_start_time to prevent duplicates
-- but allow different appointments for the same contact

-- First, clean up existing duplicates by keeping only the most recent entry per unique slot
WITH duplicates AS (
  SELECT id, 
    ROW_NUMBER() OVER (
      PARTITION BY hubspot_meeting_id, meeting_start_time 
      ORDER BY created_at DESC
    ) as rn
  FROM hubspot_appointments
  WHERE hubspot_meeting_id IS NOT NULL AND meeting_start_time IS NOT NULL
)
DELETE FROM hubspot_appointments 
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Create unique index to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_hubspot_appointments_unique_slot 
ON hubspot_appointments (hubspot_meeting_id, meeting_start_time) 
WHERE hubspot_meeting_id IS NOT NULL AND meeting_start_time IS NOT NULL;