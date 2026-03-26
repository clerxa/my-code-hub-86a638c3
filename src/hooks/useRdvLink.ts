import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

type RevenueCode = 'RB_sup80' | 'RB_50-80' | 'RB_inf50' | 'RB_NRP' | null;
type AdvisorTypeKey = 'managers' | 'experts' | 'seniors_plus' | 'seniors' | 'intermediaires' | 'juniors';

interface RdvLinkData {
  rdvUrl: string | null;
  isLoading: boolean;
}

const REVENUE_SCREEN_ID = 'b4e144a8-7629-4425-9427-19c088851f29';

const RDV_SETTINGS_KEYS = [
  'rdv_expert_url',
  'rdv_senior_url',
  'rdv_junior_url',
  'rdv_all_url',
  'rdv_assignment_matrix',
  'rdv_advisor_urls',
  'default_expert_booking_url',
  'default_expert_booking_embed',
] as const;

// Legacy fallback matrix (used when no matrix is configured)
const LEGACY_MATRIX: Record<string, Record<string, AdvisorTypeKey>> = {
  "1": { "RB_sup80": "experts", "RB_50-80": "experts", "RB_inf50": "experts", "RB_NRP": "experts" },
  "2": { "RB_sup80": "experts", "RB_50-80": "seniors", "RB_inf50": "seniors", "RB_NRP": "seniors" },
  "3": { "RB_sup80": "experts", "RB_50-80": "seniors", "RB_inf50": "juniors", "RB_NRP": "juniors" },
  "4": { "RB_sup80": "seniors", "RB_50-80": "juniors", "RB_inf50": "juniors", "RB_NRP": "juniors" },
};

// Map legacy 4-URL keys to advisor types for backward compatibility
const LEGACY_URL_MAP: Record<string, AdvisorTypeKey> = {
  rdv_expert_url: 'experts',
  rdv_senior_url: 'seniors',
  rdv_junior_url: 'juniors',
  rdv_all_url: 'juniors',
};

export function useRdvLink(): RdvLinkData {
  const { user } = useAuth();
  const [data, setData] = useState<RdvLinkData>({ rdvUrl: null, isLoading: true });

  useEffect(() => {
    if (!user) {
      setData({ rdvUrl: null, isLoading: false });
      return;
    }

    const fetch = async () => {
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

        // Parse settings
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

        // Read matrix config
        const matrix: Record<string, Record<string, AdvisorTypeKey>> | null = parseJson('rdv_assignment_matrix');
        const advisorUrls: Record<AdvisorTypeKey, string> | null = parseJson('rdv_advisor_urls');

        // Legacy URLs as fallback
        const legacyUrls: Partial<Record<AdvisorTypeKey, string>> = {};
        for (const [settingsKey, advisorType] of Object.entries(LEGACY_URL_MAP)) {
          const val = parseVal(settingsKey);
          if (val) legacyUrls[advisorType] = val;
        }

        // Fallback
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

        // Resolve advisor type from matrix
        const activeMatrix = matrix || LEGACY_MATRIX;
        const revenueKey = revenue || 'RB_NRP';
        const advisorType: AdvisorTypeKey = activeMatrix[String(rang)]?.[revenueKey] || 'juniors';

        // Resolve URL: new advisor URLs → legacy URLs → fallback
        let url: string | null = null;
        if (advisorUrls?.[advisorType]) {
          url = advisorUrls[advisorType];
        } else if (legacyUrls[advisorType]) {
          url = legacyUrls[advisorType] || null;
        }

        if (!url) {
          url = defaultUrl || defaultEmbed || null;
        }

        setData({ rdvUrl: url, isLoading: false });
      } catch (error) {
        console.error('Error in useRdvLink:', error);
        setData({ rdvUrl: null, isLoading: false });
      }
    };

    fetch();
  }, [user]);

  return data;
}
