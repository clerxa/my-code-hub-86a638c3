-- Drop the existing check constraint and add a new one that allows rang 4
ALTER TABLE companies DROP CONSTRAINT IF EXISTS check_rang_value;
ALTER TABLE companies ADD CONSTRAINT check_rang_value CHECK (rang >= 1 AND rang <= 4);