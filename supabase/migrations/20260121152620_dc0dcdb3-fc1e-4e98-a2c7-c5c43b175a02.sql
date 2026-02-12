-- Fix the ambiguous column reference in assign_parcours_from_onboarding
CREATE OR REPLACE FUNCTION public.assign_parcours_from_onboarding()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  session_record RECORD;
  screen_record RECORD;
  option_record RECORD;
  resp_value JSONB;
  parcours_to_assign UUID;
BEGIN
  -- Find onboarding responses for this user's session
  -- We look for responses that have a session_id matching the user's email or a stored session
  FOR session_record IN 
    SELECT DISTINCT or1.session_id 
    FROM onboarding_responses or1
    WHERE or1.user_id IS NULL 
      AND or1.created_at > (NOW() - INTERVAL '24 hours')
      AND or1.session_id IN (
        SELECT or2.session_id FROM onboarding_responses or2
        WHERE or2.response_value::text LIKE '%' || NEW.email || '%'
      )
  LOOP
    -- Update responses to link them to the new user
    UPDATE onboarding_responses 
    SET user_id = NEW.id 
    WHERE session_id = session_record.session_id AND user_id IS NULL;
    
    -- Now find parcours to assign based on selected options
    FOR screen_record IN 
      SELECT or3.screen_id, or3.response_value AS resp_val, os.options
      FROM onboarding_responses or3
      JOIN onboarding_screens os ON os.id = or3.screen_id
      WHERE or3.session_id = session_record.session_id
        AND or3.screen_id IS NOT NULL
    LOOP
      -- Check each option in the screen
      IF screen_record.options IS NOT NULL THEN
        FOR option_record IN SELECT * FROM jsonb_array_elements(screen_record.options::jsonb) AS opt
        LOOP
          -- Check if this option was selected
          IF screen_record.resp_val::text = option_record.value->>'value' 
             OR screen_record.resp_val::jsonb ? (option_record.value->>'value') THEN
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
$function$;