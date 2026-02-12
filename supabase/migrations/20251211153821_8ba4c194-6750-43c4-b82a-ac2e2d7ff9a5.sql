-- Drop the existing check constraint on niveau
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_niveau_check;