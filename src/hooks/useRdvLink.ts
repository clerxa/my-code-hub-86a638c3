import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

type RevenueCode = 'RB_sup80' | 'RB_50-80' | 'RB_inf50' | 'RB_NRP' | null;
type AdvisorCategoryKey = 'senior_category' | 'junior_category';

interface RdvLinkData {
  rdvUrl: string | null;
  isLoading: boolean;
}

const REVENUE_SCREEN_ID = 'b4e144a8-7629-4425-9427-19c088851f29';

const RDV_SETTINGS_KEYS = [
  'rdv_assignment_matrix',
  'rdv_category_urls',
  'rdv_expert_url',
  'rdv_senior_url',
  'rdv_junior_url',
  'rdv_all_url',
  'default_expert_booking_url',
  'default_expert_booking_embed',
] as const;

// Default matrix when none configured
const DEFAULT_MATRIX: Record<string, Record<string, AdvisorCategoryKey>> = {
  "1": { "RB_sup80": "senior_category", "RB_50-80": "senior_category", "RB_inf50": "senior_category", "RB_NRP": "senior_category" },
  "2": { "RB_sup80": "senior_category", "RB_50-80": "senior_category", "RB_inf50": "junior_category", "RB_NRP": "junior_category" },
  "3": { "RB_sup80": "senior_category", "RB_50-80": "junior_category", "RB_inf50": "junior_category", "RB_NRP": "junior_category" },
  "4": { "RB_sup80": "senior_category", "RB_50-80": "junior_category", "RB_inf50": "junior_category", "RB_NRP": "junior_category" },
};

export function useRdvLink(): RdvLinkData {
  const { user } = useAuth();
  const [data, setData] = useState<RdvLinkData>({ rdvUrl: null, isLoading: true });

  useEffect(() => {
    if (!user) {
      setData({ rdvUrl: null, isLoading: false });
      return;
    }

    const fetchData = async () => {
      try {
        const [settingsRes, profileRes, revenueRes] = await Promise.all([
          supabase
            .from('settings')
            .select('key, value')
            .in('key', [...RDV_SETTINGS_KEYS]),
          supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single(),
          supabase
            .from('onboarding_responses')
            .select('response_value')
            .eq('user_id', user.id)
            .eq('screen_id', REVENUE_SCREEN_ID)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        const companyId = profileRes.data?.company_id;

        const parseVal = (key: string): string | null => {
          const raw = settingsRes.data?.find(s => s.key === key)?.value;
          if (!raw) return null;
          try {
            const parsed = JSON.parse(raw);
            return typeof parsed === 'string' ? parsed : raw;
          } catch {
            return raw;
          }
        };

        const parseJson = (key: string): any => {
          const raw = settingsRes.data?.find(s => s.key === key)?.value;
          if (!raw) return null;
          try { return JSON.parse(raw); } catch { return null; }
        };

        // New category-based config
        const matrix: Record<string, Record<string, AdvisorCategoryKey>> | null = parseJson('rdv_assignment_matrix');
        const categoryUrls: Record<AdvisorCategoryKey, string> | null = parseJson('rdv_category_urls');

        // Legacy fallbacks
        const legacyExpert = parseVal('rdv_expert_url');
        const legacySenior = parseVal('rdv_senior_url');
        const legacyJunior = parseVal('rdv_junior_url');
        const legacyAll = parseVal('rdv_all_url');
        const defaultUrl = parseVal('default_expert_booking_url');
        const defaultEmbed = parseVal('default_expert_booking_embed');

        // Get company rang
        let rang: number = 4;
        if (companyId) {
          const { data: company } = await supabase
            .from('companies')
            .select('rang')
            .eq('id', companyId)
            .single();
          rang = (company as any)?.rang ?? 4;
        }

        // Parse revenue code
        let revenue: RevenueCode = null;
        if (revenueRes.data?.response_value) {
          const rv = revenueRes.data.response_value;
          const code = Array.isArray(rv) ? rv[0] : rv;
          if (typeof code === 'string' && ['RB_sup80', 'RB_50-80', 'RB_inf50', 'RB_NRP'].includes(code)) {
            revenue = code as RevenueCode;
          }
        }

        // Resolve category from matrix
        const activeMatrix = matrix || DEFAULT_MATRIX;
        const revenueKey = revenue || 'RB_NRP';
        const category: AdvisorCategoryKey = activeMatrix[String(rang)]?.[revenueKey] || 'junior_category';

        // Resolve URL
        let url: string | null = null;

        // 1. New category URLs
        if (categoryUrls?.[category]) {
          url = categoryUrls[category];
        }

        // 2. Legacy URL fallback
        if (!url) {
          if (category === 'senior_category') {
            url = legacyExpert || legacySenior || null;
          } else {
            url = legacyJunior || legacyAll || null;
          }
        }

        // 3. Global fallback
        if (!url) {
          url = defaultUrl || defaultEmbed || null;
        }

        setData({ rdvUrl: url, isLoading: false });
      } catch (error) {
        console.error('Error in useRdvLink:', error);
        setData({ rdvUrl: null, isLoading: false });
      }
    };

    fetchData();
  }, [user]);

  return data;
}
