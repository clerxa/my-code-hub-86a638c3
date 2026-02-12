-- Create a secure RPC function to get registration trends for a company
-- This uses SECURITY DEFINER to bypass RLS while only returning aggregated data
CREATE OR REPLACE FUNCTION public.get_company_registration_trends(p_company_id uuid)
RETURNS TABLE (
  month_key text,
  month_label text,
  registrations bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  month_names text[] := ARRAY['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
BEGIN
  RETURN QUERY
  SELECT 
    to_char(p.created_at AT TIME ZONE 'UTC', 'YYYY-MM') AS month_key,
    month_names[EXTRACT(MONTH FROM p.created_at AT TIME ZONE 'UTC')::int] || ' ' || 
      SUBSTRING(EXTRACT(YEAR FROM p.created_at AT TIME ZONE 'UTC')::text FROM 3 FOR 2) AS month_label,
    COUNT(*)::bigint AS registrations
  FROM profiles p
  WHERE p.company_id = p_company_id
    AND p.created_at IS NOT NULL
  GROUP BY 
    to_char(p.created_at AT TIME ZONE 'UTC', 'YYYY-MM'),
    EXTRACT(MONTH FROM p.created_at AT TIME ZONE 'UTC'),
    EXTRACT(YEAR FROM p.created_at AT TIME ZONE 'UTC')
  ORDER BY month_key ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_company_registration_trends(uuid) TO authenticated;