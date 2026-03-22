
-- Add unique constraint on user_id for risk_profile table
ALTER TABLE public.risk_profile ADD CONSTRAINT risk_profile_user_id_key UNIQUE (user_id);

-- Add unique constraint on user_id + question_id for user_risk_responses table
ALTER TABLE public.user_risk_responses ADD CONSTRAINT user_risk_responses_user_id_question_id_key UNIQUE (user_id, question_id);
