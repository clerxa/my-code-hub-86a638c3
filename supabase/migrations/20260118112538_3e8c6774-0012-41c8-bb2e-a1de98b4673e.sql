-- Function to get company extended stats including appointments and webinars
CREATE OR REPLACE FUNCTION public.get_company_extended_stats(
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
    -- Connection rate
    'active_users_count', (
      SELECT COUNT(*) FROM profiles 
      WHERE company_id = p_company_id 
        AND last_login IS NOT NULL
        AND last_login >= v_start_date
        AND last_login <= v_end_date
    ),
    'total_registered', (
      SELECT COUNT(*) FROM profiles 
      WHERE company_id = p_company_id
    ),
    -- Appointments count
    'appointments_count', (
      SELECT COUNT(*) FROM appointments a
      JOIN profiles p ON a.user_id = p.id
      WHERE p.company_id = p_company_id
        AND a.created_at >= v_start_date
        AND a.created_at <= v_end_date
    ),
    'appointments_completed', (
      SELECT COUNT(*) FROM appointments a
      JOIN profiles p ON a.user_id = p.id
      WHERE p.company_id = p_company_id
        AND a.status = 'completed'
        AND a.created_at >= v_start_date
        AND a.created_at <= v_end_date
    ),
    -- Webinar stats
    'webinar_registrations', (
      SELECT COUNT(*) FROM webinar_registrations wr
      JOIN profiles p ON wr.user_id = p.id
      WHERE p.company_id = p_company_id
        AND wr.registered_at >= v_start_date
        AND wr.registered_at <= v_end_date
    ),
    'webinar_participants', (
      SELECT COUNT(*) FROM webinar_registrations wr
      JOIN profiles p ON wr.user_id = p.id
      WHERE p.company_id = p_company_id
        AND wr.joined_at IS NOT NULL
        AND wr.registered_at >= v_start_date
        AND wr.registered_at <= v_end_date
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to get engagement trends over time
CREATE OR REPLACE FUNCTION public.get_company_engagement_trends(
  p_company_id uuid,
  p_period text DEFAULT 'month' -- 'week', 'month', 'quarter'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  interval_days int;
BEGIN
  -- Check if user is admin or company contact for this company
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role) OR
    (has_role(auth.uid(), 'contact_entreprise'::app_role) AND 
     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = p_company_id))
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Determine interval
  interval_days := CASE p_period
    WHEN 'week' THEN 7
    WHEN 'month' THEN 30
    WHEN 'quarter' THEN 90
    ELSE 30
  END;

  SELECT json_build_object(
    'current_period', json_build_object(
      'modules_completed', (
        SELECT COALESCE(COUNT(*), 0) FROM module_validations mv
        JOIN profiles p ON mv.user_id = p.id
        WHERE p.company_id = p_company_id
          AND mv.validated_at >= (now() - (interval_days || ' days')::interval)
      ),
      'simulations', (
        SELECT COALESCE(COUNT(*), 0) FROM simulation_logs sl
        JOIN profiles p ON sl.user_id = p.id
        WHERE p.company_id = p_company_id
          AND sl.created_at >= (now() - (interval_days || ' days')::interval)
      ),
      'connections', (
        SELECT COUNT(*) FROM profiles 
        WHERE company_id = p_company_id 
          AND last_login >= (now() - (interval_days || ' days')::interval)
      )
    ),
    'previous_period', json_build_object(
      'modules_completed', (
        SELECT COALESCE(COUNT(*), 0) FROM module_validations mv
        JOIN profiles p ON mv.user_id = p.id
        WHERE p.company_id = p_company_id
          AND mv.validated_at >= (now() - (interval_days * 2 || ' days')::interval)
          AND mv.validated_at < (now() - (interval_days || ' days')::interval)
      ),
      'simulations', (
        SELECT COALESCE(COUNT(*), 0) FROM simulation_logs sl
        JOIN profiles p ON sl.user_id = p.id
        WHERE p.company_id = p_company_id
          AND sl.created_at >= (now() - (interval_days * 2 || ' days')::interval)
          AND sl.created_at < (now() - (interval_days || ' days')::interval)
      ),
      'connections', (
        SELECT COUNT(*) FROM profiles 
        WHERE company_id = p_company_id 
          AND last_login >= (now() - (interval_days * 2 || ' days')::interval)
          AND last_login < (now() - (interval_days || ' days')::interval)
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to get module completion data for charts
CREATE OR REPLACE FUNCTION public.get_company_module_chart_data(
  p_company_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Check if user is admin or company contact for this company
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role) OR
    (has_role(auth.uid(), 'contact_entreprise'::app_role) AND 
     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = p_company_id))
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT json_agg(
    json_build_object(
      'type', m.type,
      'count', COALESCE(counts.completed_count, 0)
    )
  )
  FROM (SELECT DISTINCT type FROM modules WHERE type IS NOT NULL) m
  LEFT JOIN (
    SELECT 
      mod.type,
      COUNT(*) as completed_count
    FROM module_validations mv
    JOIN profiles p ON mv.user_id = p.id
    JOIN modules mod ON mv.module_id = mod.id
    WHERE p.company_id = p_company_id
    GROUP BY mod.type
  ) counts ON m.type = counts.type
  INTO result;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;