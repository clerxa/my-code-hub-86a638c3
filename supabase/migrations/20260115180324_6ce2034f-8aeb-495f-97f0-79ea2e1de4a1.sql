-- Create a function for company contacts to get employee stats (non-financial data only)
-- This function returns aggregated statistics without exposing individual financial information

CREATE OR REPLACE FUNCTION public.get_company_employee_stats(p_company_id uuid, p_start_date timestamptz DEFAULT NULL, p_end_date timestamptz DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  v_start_date timestamptz := COALESCE(p_start_date, '1970-01-01'::timestamptz);
  v_end_date timestamptz := COALESCE(p_end_date, now());
BEGIN
  -- Check if user is admin or company contact for this company
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role) OR
    (has_role(auth.uid(), 'contact_entreprise'::app_role) AND 
     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = p_company_id))
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT json_build_object(
    'total_employees', (
      SELECT COUNT(*) FROM profiles WHERE company_id = p_company_id
    ),
    'registered_employees', (
      SELECT COUNT(*) FROM profiles 
      WHERE company_id = p_company_id 
        AND last_login IS NOT NULL
        AND (p_start_date IS NULL OR last_login >= v_start_date)
        AND (p_end_date IS NULL OR last_login <= v_end_date)
    ),
    'modules_completed_count', (
      SELECT COALESCE(SUM(array_length(completed_modules, 1)), 0)::int 
      FROM profiles 
      WHERE company_id = p_company_id
    ),
    'average_modules_per_employee', (
      SELECT COALESCE(ROUND(AVG(COALESCE(array_length(completed_modules, 1), 0)), 1), 0)
      FROM profiles 
      WHERE company_id = p_company_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to get detailed module completion by employees (for expandable tables)
CREATE OR REPLACE FUNCTION public.get_company_module_details(p_company_id uuid)
RETURNS TABLE(
  module_id int,
  module_title text,
  module_type text,
  completed_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    m.id,
    m.title,
    m.type,
    COUNT(DISTINCT p.id) as completed_count
  FROM modules m
  LEFT JOIN profiles p ON m.id = ANY(p.completed_modules) AND p.company_id = p_company_id
  GROUP BY m.id, m.title, m.type
  HAVING COUNT(DISTINCT p.id) > 0
  ORDER BY completed_count DESC;
END;
$$;

-- Function to get parcours progress for company employees
CREATE OR REPLACE FUNCTION public.get_company_parcours_stats(p_company_id uuid)
RETURNS TABLE(
  parcours_id uuid,
  parcours_title text,
  not_started_count bigint,
  in_progress_count bigint,
  completed_count bigint,
  total_modules int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  WITH company_parcours AS (
    -- Get parcours linked to this company or generic (not linked to any company)
    SELECT DISTINCT pc.parcours_id
    FROM parcours_companies pc
    WHERE pc.company_id = p_company_id
    UNION
    SELECT p.id as parcours_id
    FROM parcours p
    WHERE NOT EXISTS (SELECT 1 FROM parcours_companies pc2 WHERE pc2.parcours_id = p.id)
  ),
  parcours_modules_agg AS (
    SELECT 
      pm.parcours_id,
      array_agg(pm.module_id) as module_ids,
      COUNT(*)::int as total_modules
    FROM parcours_modules pm
    WHERE pm.parcours_id IN (SELECT parcours_id FROM company_parcours)
    GROUP BY pm.parcours_id
  ),
  employee_progress AS (
    SELECT 
      pma.parcours_id,
      prof.id as employee_id,
      pma.module_ids,
      pma.total_modules,
      COALESCE(
        (SELECT COUNT(*) 
         FROM unnest(pma.module_ids) AS mid 
         WHERE mid = ANY(prof.completed_modules)),
        0
      )::int as completed_modules_count
    FROM parcours_modules_agg pma
    CROSS JOIN profiles prof
    WHERE prof.company_id = p_company_id
  )
  SELECT 
    pa.id,
    pa.title,
    COUNT(CASE WHEN ep.completed_modules_count = 0 THEN 1 END),
    COUNT(CASE WHEN ep.completed_modules_count > 0 AND ep.completed_modules_count < ep.total_modules THEN 1 END),
    COUNT(CASE WHEN ep.completed_modules_count = ep.total_modules AND ep.total_modules > 0 THEN 1 END),
    COALESCE(pma.total_modules, 0)
  FROM parcours pa
  JOIN company_parcours cp ON pa.id = cp.parcours_id
  LEFT JOIN parcours_modules_agg pma ON pa.id = pma.parcours_id
  LEFT JOIN employee_progress ep ON pa.id = ep.parcours_id
  GROUP BY pa.id, pa.title, pma.total_modules
  ORDER BY pa.title;
END;
$$;

-- Function to get simulation stats for company (counts only, no financial data)
CREATE OR REPLACE FUNCTION public.get_company_simulation_stats(p_company_id uuid, p_start_date timestamptz DEFAULT NULL, p_end_date timestamptz DEFAULT NULL)
RETURNS TABLE(
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
    sl.simulator_type,
    COUNT(*)::bigint as simulation_count,
    COUNT(DISTINCT sl.user_id)::bigint as unique_users
  FROM simulation_logs sl
  JOIN profiles p ON sl.user_id = p.id
  WHERE p.company_id = p_company_id
    AND sl.created_at >= v_start_date
    AND sl.created_at <= v_end_date
  GROUP BY sl.simulator_type
  ORDER BY simulation_count DESC;
END;
$$;