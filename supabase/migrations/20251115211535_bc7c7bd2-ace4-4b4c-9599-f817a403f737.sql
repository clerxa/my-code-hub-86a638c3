-- Add column for HubSpot meeting embed code
ALTER TABLE companies 
ADD COLUMN expert_booking_hubspot_embed TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN companies.expert_booking_hubspot_embed IS 'HubSpot meeting embed code HTML for calendar integration';