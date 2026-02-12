-- 1. Create user_parcours table to assign parcours directly to users
CREATE TABLE public.user_parcours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parcours_id UUID NOT NULL REFERENCES public.parcours(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'onboarding', -- 'onboarding', 'admin', 'manual'
  onboarding_session_id TEXT, -- Link to the onboarding session that triggered this
  UNIQUE(user_id, parcours_id)
);

-- Enable RLS
ALTER TABLE public.user_parcours ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own parcours" 
ON public.user_parcours 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user parcours" 
ON public.user_parcours 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Create function to assign parcours from onboarding responses
CREATE OR REPLACE FUNCTION public.assign_parcours_from_onboarding()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_record RECORD;
  screen_record RECORD;
  option_record RECORD;
  response_value JSONB;
  parcours_to_assign UUID;
BEGIN
  -- Find onboarding responses for this user's session
  -- We look for responses that have a session_id matching the user's email or a stored session
  FOR session_record IN 
    SELECT DISTINCT session_id 
    FROM onboarding_responses 
    WHERE user_id IS NULL 
      AND created_at > (NOW() - INTERVAL '24 hours')
      AND session_id IN (
        SELECT session_id FROM onboarding_responses 
        WHERE response_value::text LIKE '%' || NEW.email || '%'
      )
  LOOP
    -- Update responses to link them to the new user
    UPDATE onboarding_responses 
    SET user_id = NEW.id 
    WHERE session_id = session_record.session_id AND user_id IS NULL;
    
    -- Now find parcours to assign based on selected options
    FOR screen_record IN 
      SELECT or2.screen_id, or2.response_value, os.options
      FROM onboarding_responses or2
      JOIN onboarding_screens os ON os.id = or2.screen_id
      WHERE or2.session_id = session_record.session_id
        AND or2.screen_id IS NOT NULL
    LOOP
      -- Check each option in the screen
      IF screen_record.options IS NOT NULL THEN
        FOR option_record IN SELECT * FROM jsonb_array_elements(screen_record.options::jsonb) AS opt
        LOOP
          -- Check if this option was selected
          IF screen_record.response_value::text = option_record.value->>'value' 
             OR screen_record.response_value::jsonb ? (option_record.value->>'value') THEN
            -- Check if option has a parcours_id
            parcours_to_assign := (option_record.value->>'parcoursId')::UUID;
            IF parcours_to_assign IS NOT NULL THEN
              INSERT INTO user_parcours (user_id, parcours_id, source, onboarding_session_id)
              VALUES (NEW.id, parcours_to_assign, 'onboarding', session_record.session_id)
              ON CONFLICT (user_id, parcours_id) DO NOTHING;
            END IF;
          END IF;
        END LOOP;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- 3. Create trigger on profiles table (runs after handle_new_user creates the profile)
CREATE TRIGGER assign_parcours_after_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_parcours_from_onboarding();