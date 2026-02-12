-- Remove foreign key constraint on profiles.id to allow creating profiles without auth accounts
-- This is needed for CSV import where we create profiles before users sign up

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Keep the id field as primary key but remove the auth.users reference
-- This allows creating profiles for invitation purposes before actual signup

-- Add a comment to explain this design decision
COMMENT ON TABLE public.profiles IS 'User profiles can exist before auth account creation to support CSV imports and invitations. The id field is a UUID that will match auth.users.id once the user signs up.';