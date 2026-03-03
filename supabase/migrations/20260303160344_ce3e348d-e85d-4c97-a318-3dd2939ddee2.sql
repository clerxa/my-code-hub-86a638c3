
-- Table for CMS-managed employee questions (for presentations)
CREATE TABLE public.prospect_employee_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon text NOT NULL DEFAULT '❓',
  text text NOT NULL,
  tech_highlight boolean DEFAULT false,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed with current hardcoded questions
INSERT INTO public.prospect_employee_questions (icon, text, tech_highlight, display_order) VALUES
  ('🏦', 'Comment préparer ma retraite ?', false, 1),
  ('📊', 'Quelle fiscalité est applicable à mon PERCO ? PEE ?', false, 2),
  ('🔐', 'Par quoi dois-je commencer pour sécuriser mon avenir ?', false, 3),
  ('📝', 'Comment éviter les erreurs durant ma déclaration de revenus ?', false, 4),
  ('💡', 'J''ai des dispositifs de rémunération particuliers (RSU, ESPP, stock-options) : suis-je sûr de bien les comprendre ?', true, 5),
  ('🛡️', 'À combien doit s''élever mon épargne de précaution ?', false, 6),
  ('🧮', 'Comment sont calculés mes impôts ?', false, 7),
  ('👨‍👩‍👧‍👦', 'Comment est calculé le quotient familial ?', false, 8);

-- Add challenge_bullets column to prospect_presentations
ALTER TABLE public.prospect_presentations
  ADD COLUMN IF NOT EXISTS challenge_bullets jsonb DEFAULT '[]'::jsonb;

-- RLS policies
ALTER TABLE public.prospect_employee_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active questions"
  ON public.prospect_employee_questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage questions"
  ON public.prospect_employee_questions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
