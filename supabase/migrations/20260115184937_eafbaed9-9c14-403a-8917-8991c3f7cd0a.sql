CREATE OR REPLACE FUNCTION public.get_company_employee_stats(
  p_company_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
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
      SELECT COALESCE(c.company_size, 0) FROM companies c WHERE c.id = p_company_id
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