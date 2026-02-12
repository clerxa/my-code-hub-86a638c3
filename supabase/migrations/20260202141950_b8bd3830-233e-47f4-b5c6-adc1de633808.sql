-- Corriger la fonction get_company_employee_stats pour compter correctement les utilisateurs
-- registered_employees = tous les utilisateurs inscrits (pas seulement ceux avec last_login)
-- active_users = utilisateurs ayant au moins une connexion dans daily_logins sur la période

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
      -- Compter TOUS les utilisateurs inscrits pour cette entreprise (pas seulement ceux avec last_login)
      SELECT COUNT(*) FROM profiles 
      WHERE company_id = p_company_id
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

-- Corriger la fonction get_company_extended_stats pour utiliser daily_logins
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
  v_start_date date := COALESCE(p_start_date::date, '1970-01-01'::date);
  v_end_date date := COALESCE(p_end_date::date, CURRENT_DATE);
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
    'total_registered', (
      SELECT COUNT(*) FROM profiles WHERE company_id = p_company_id
    ),
    'active_users_count', (
      -- Utilisateurs actifs = ceux qui ont au moins une connexion dans daily_logins sur la période
      SELECT COUNT(DISTINCT dl.user_id) 
      FROM daily_logins dl
      INNER JOIN profiles p ON p.id = dl.user_id
      WHERE p.company_id = p_company_id
        AND dl.login_date >= v_start_date
        AND dl.login_date <= v_end_date
    ),
    'appointments_count', (
      SELECT COUNT(*) FROM appointments a
      INNER JOIN profiles p ON p.id = a.user_id
      WHERE p.company_id = p_company_id
        AND (p_start_date IS NULL OR a.created_at >= p_start_date)
        AND (p_end_date IS NULL OR a.created_at <= p_end_date)
    ),
    'appointments_completed', (
      SELECT COUNT(*) FROM appointments a
      INNER JOIN profiles p ON p.id = a.user_id
      WHERE p.company_id = p_company_id
        AND a.status = 'completed'
        AND (p_start_date IS NULL OR a.created_at >= p_start_date)
        AND (p_end_date IS NULL OR a.created_at <= p_end_date)
    ),
    'webinar_registrations', 0,
    'webinar_participants', 0
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Améliorer la fonction get_company_engagement_trends pour utiliser daily_logins
CREATE OR REPLACE FUNCTION public.get_company_engagement_trends(
  p_company_id uuid,
  p_period text DEFAULT 'month'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  current_start date;
  current_end date;
  previous_start date;
  previous_end date;
  interval_length interval;
BEGIN
  -- Check access
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role) OR
    (has_role(auth.uid(), 'contact_entreprise'::app_role) AND 
     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = p_company_id))
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Calculer les périodes
  current_end := CURRENT_DATE;
  
  CASE p_period
    WHEN 'week' THEN
      current_start := current_end - INTERVAL '7 days';
      previous_start := current_start - INTERVAL '7 days';
      previous_end := current_start - INTERVAL '1 day';
    WHEN 'quarter' THEN
      current_start := current_end - INTERVAL '3 months';
      previous_start := current_start - INTERVAL '3 months';
      previous_end := current_start - INTERVAL '1 day';
    ELSE -- month by default
      current_start := current_end - INTERVAL '1 month';
      previous_start := current_start - INTERVAL '1 month';
      previous_end := current_start - INTERVAL '1 day';
  END CASE;

  SELECT json_build_object(
    'current_period', json_build_object(
      'modules_completed', (
        SELECT COALESCE(SUM(array_length(completed_modules, 1)), 0)::int 
        FROM profiles WHERE company_id = p_company_id
      ),
      'simulations', (
        SELECT COUNT(*) FROM (
          SELECT user_id FROM epargne_precaution_simulations WHERE user_id IN (SELECT id FROM profiles WHERE company_id = p_company_id) AND created_at >= current_start AND created_at <= current_end
          UNION ALL
          SELECT user_id FROM capacite_emprunt_simulations WHERE user_id IN (SELECT id FROM profiles WHERE company_id = p_company_id) AND created_at >= current_start AND created_at <= current_end
        ) sims
      ),
      'connections', (
        SELECT COUNT(DISTINCT dl.user_id)
        FROM daily_logins dl
        INNER JOIN profiles p ON p.id = dl.user_id
        WHERE p.company_id = p_company_id
          AND dl.login_date >= current_start
          AND dl.login_date <= current_end
      )
    ),
    'previous_period', json_build_object(
      'modules_completed', (
        SELECT COALESCE(SUM(array_length(completed_modules, 1)), 0)::int 
        FROM profiles WHERE company_id = p_company_id
      ),
      'simulations', (
        SELECT COUNT(*) FROM (
          SELECT user_id FROM epargne_precaution_simulations WHERE user_id IN (SELECT id FROM profiles WHERE company_id = p_company_id) AND created_at >= previous_start AND created_at <= previous_end
          UNION ALL
          SELECT user_id FROM capacite_emprunt_simulations WHERE user_id IN (SELECT id FROM profiles WHERE company_id = p_company_id) AND created_at >= previous_start AND created_at <= previous_end
        ) sims
      ),
      'connections', (
        SELECT COUNT(DISTINCT dl.user_id)
        FROM daily_logins dl
        INNER JOIN profiles p ON p.id = dl.user_id
        WHERE p.company_id = p_company_id
          AND dl.login_date >= previous_start
          AND dl.login_date <= previous_end
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$$;