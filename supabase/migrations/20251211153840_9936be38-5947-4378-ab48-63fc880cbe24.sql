-- Add new constraint allowing basic and premium
ALTER TABLE plans ADD CONSTRAINT plans_niveau_check 
CHECK (niveau IN ('basic', 'premium'));