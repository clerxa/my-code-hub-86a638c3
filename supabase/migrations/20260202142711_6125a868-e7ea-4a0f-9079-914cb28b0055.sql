-- Fix the simulation stats function to use the actual simulation tables
-- instead of simulation_logs which may be empty
CREATE OR REPLACE FUNCTION public.get_company_simulation_stats(
  p_company_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  simulator_type text,
  simulation_count bigint,
  unique_users bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date timestamptz := COALESCE(p_start_date, '1970-01-01'::timestamptz);
  v_end_date timestamptz := COALESCE(p_end_date, now());
BEGIN
  -- Check access
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role) OR
    (has_role(auth.uid(), 'contact_entreprise'::app_role) AND 
     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = p_company_id))
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    sim_type AS simulator_type,
    COUNT(*)::bigint AS simulation_count,
    COUNT(DISTINCT user_id)::bigint AS unique_users
  FROM (
    -- Epargne de précaution simulations
    SELECT 
      'epargne_precaution'::text AS sim_type,
      eps.user_id
    FROM epargne_precaution_simulations eps
    JOIN profiles p ON eps.user_id = p.id
    WHERE p.company_id = p_company_id
      AND eps.created_at >= v_start_date
      AND eps.created_at <= v_end_date
    
    UNION ALL
    
    -- Capacité d'emprunt simulations
    SELECT 
      'capacite_emprunt'::text AS sim_type,
      ces.user_id
    FROM capacite_emprunt_simulations ces
    JOIN profiles p ON ces.user_id = p.id
    WHERE p.company_id = p_company_id
      AND ces.created_at >= v_start_date
      AND ces.created_at <= v_end_date
  ) combined_sims
  GROUP BY sim_type
  ORDER BY simulation_count DESC;
END;
$$;