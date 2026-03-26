import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

type RevenueCode = 'RB_sup80' | 'RB_50-80' | 'RB_inf50' | 'RB_NRP' | null;

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
  'default_expert_booking_url',
  'default_expert_booking_embed',
] as const;

/**
 * Hook that returns the appropriate RDV booking URL based on:
 * - Company rang (1–4)
 * - User revenue profile from onboarding
 *
 * Matrix:
 * Rang 1 → always expert
 * Rang 2 → expert if RB_sup80, else senior
 * Rang 3 → expert if RB_sup80, senior if RB_50-80, else junior
 * Rang 4 → senior if RB_sup80, else all
 */
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
        // Fetch all needed data in parallel
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

        const links = {
          expert: parseVal('rdv_expert_url'),
          senior: parseVal('rdv_senior_url'),
          junior: parseVal('rdv_junior_url'),
          all: parseVal('rdv_all_url'),
        };

        // Fallback chain: default embed → default url
        const defaultEmbed = parseVal('default_expert_booking_embed');
        const defaultUrl = parseVal('default_expert_booking_url');

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

        // Parse revenue code from onboarding response
        let revenue: RevenueCode = null;
        if (revenueRes.data?.response_value) {
          const rv = revenueRes.data.response_value;
          // response_value is stored as ["RB_sup80"] (JSON array)
          const code = Array.isArray(rv) ? rv[0] : rv;
          if (typeof code === 'string' && ['RB_sup80', 'RB_50-80', 'RB_inf50', 'RB_NRP'].includes(code)) {
            revenue = code as RevenueCode;
          }
        }

        // Apply matrix
        let url: string | null = null;

        if (rang === 1) {
          url = links.expert;
        } else if (rang === 2) {
          url = revenue === 'RB_sup80' ? links.expert : links.senior;
        } else if (rang === 3) {
          if (revenue === 'RB_sup80') url = links.expert;
          else if (revenue === 'RB_50-80') url = links.senior;
          else url = links.junior;
        } else {
          // Rang 4
          url = revenue === 'RB_sup80' ? links.senior : links.all;
        }

        // Fallback if no URL resolved
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
