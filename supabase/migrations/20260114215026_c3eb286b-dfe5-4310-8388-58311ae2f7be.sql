-- Create table to track ALL simulation validations (before user saves)
CREATE TABLE public.simulation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text, -- For anonymous tracking if needed
  simulator_type text NOT NULL, -- per, lmnp, capacite_emprunt, etc.
  simulation_data jsonb NOT NULL, -- All input data
  results_data jsonb NOT NULL, -- All calculated results
  is_saved_to_history boolean DEFAULT false, -- User clicked "Save"
  cta_clicked text[], -- Array of CTA ids clicked
  appointment_cta_clicked boolean DEFAULT false, -- Specifically track appointment CTAs
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.simulation_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all simulation logs
CREATE POLICY "Admins can view all simulation logs"
ON public.simulation_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Users can view their own logs
CREATE POLICY "Users can view own simulation logs"
ON public.simulation_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own logs
CREATE POLICY "Users can insert simulation logs"
ON public.simulation_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own logs
CREATE POLICY "Users can update own simulation logs"
ON public.simulation_logs
FOR UPDATE
USING (auth.uid() = user_id);

-- Index for fast queries
CREATE INDEX idx_simulation_logs_user_id ON public.simulation_logs(user_id);
CREATE INDEX idx_simulation_logs_simulator_type ON public.simulation_logs(simulator_type);
CREATE INDEX idx_simulation_logs_created_at ON public.simulation_logs(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_simulation_logs_updated_at
BEFORE UPDATE ON public.simulation_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();