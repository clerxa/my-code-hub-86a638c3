ALTER TABLE user_financial_profiles
  ADD COLUMN IF NOT EXISTS charges_courses_alimentaires numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS charges_loisirs numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS charges_shopping numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS charges_variables_autres numeric DEFAULT 0;