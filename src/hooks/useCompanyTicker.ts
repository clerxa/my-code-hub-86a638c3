/**
 * Hook to fetch the current user's company ticker from the companies table.
 * Returns { ticker, companyName, loading }.
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface CompanyTickerData {
  ticker: string | null;
  companyName: string | null;
  loading: boolean;
}

export function useCompanyTicker(): CompanyTickerData {
  const { user } = useAuth();
  const [ticker, setTicker] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchTicker = async () => {
      setLoading(true);
      try {
        // Get user's company_id from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile?.company_id) {
          setLoading(false);
          return;
        }

        // Get company ticker
        const { data: company } = await supabase
          .from('companies')
          .select('ticker, name')
          .eq('id', profile.company_id)
          .maybeSingle();

        setTicker(company?.ticker ?? null);
        setCompanyName(company?.name ?? null);
      } catch (err) {
        console.error('Failed to fetch company ticker:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTicker();
  }, [user?.id]);

  return { ticker, companyName, loading };
}
