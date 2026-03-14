
-- Table to track declared share sales (cessions) with FIFO logic
CREATE TABLE public.vega_cessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  simulation_id text NOT NULL,
  plan_id text NOT NULL,
  nb_actions integer NOT NULL CHECK (nb_actions > 0),
  date_cession date NOT NULL DEFAULT current_date,
  prix_cession_unitaire numeric,
  devise text DEFAULT 'EUR',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.vega_cessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cessions"
  ON public.vega_cessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_vega_cessions_user_plan ON public.vega_cessions(user_id, simulation_id, plan_id);
