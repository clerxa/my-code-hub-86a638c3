import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CSATSettings, CSATBetaQuestion, CSATContentType } from '@/types/csat';

interface UseCSATSettingsReturn {
  settings: CSATSettings | null;
  betaQuestions: CSATBetaQuestion[];
  isLoading: boolean;
  isBetaMode: boolean;
  shouldShowCSAT: (contentType: CSATContentType, contentId: string, moduleId?: number) => Promise<boolean>;
  hasUserCompletedCSAT: (contentType: CSATContentType, contentId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export const useCSATSettings = (): UseCSATSettingsReturn => {
  const [settings, setSettings] = useState<CSATSettings | null>(null);
  const [betaQuestions, setBetaQuestions] = useState<CSATBetaQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBetaMode, setIsBetaMode] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch CSAT settings
      const { data: csatData, error: csatError } = await supabase
        .from('csat_settings')
        .select('*')
        .limit(1)
        .single();

      if (csatError && csatError.code !== 'PGRST116') {
        console.error('Error fetching CSAT settings:', csatError);
      }

      if (csatData) {
        setSettings(csatData as unknown as CSATSettings);
      }

      // Fetch active beta questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('csat_beta_questions')
        .select('*')
        .eq('is_active', true)
        .order('priority_order', { ascending: true });

      if (questionsError) {
        console.error('Error fetching beta questions:', questionsError);
      }

      if (questionsData) {
        setBetaQuestions(questionsData as unknown as CSATBetaQuestion[]);
      }

      // Check if beta mode is enabled
      const { data: betaData, error: betaError } = await supabase
        .from('global_settings')
        .select('value')
        .eq('category', 'branding')
        .eq('key', 'beta_badge_enabled')
        .single();

      if (!betaError && betaData) {
        setIsBetaMode(betaData.value === true || betaData.value === 'true' || betaData.value === 1);
      }
    } catch (error) {
      console.error('Error in useCSATSettings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const hasUserCompletedCSAT = useCallback(async (contentType: CSATContentType, contentId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('csat_responses')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .limit(1);

    if (error) {
      console.error('Error checking CSAT completion:', error);
      return false;
    }

    return data && data.length > 0;
  }, []);

  const shouldShowCSAT = useCallback(async (
    contentType: CSATContentType,
    contentId: string,
    moduleId?: number
  ): Promise<boolean> => {
    // Must be in beta mode
    if (!isBetaMode) return false;

    // Must have settings and be enabled globally
    if (!settings?.csat_enabled) return false;

    // Check content type specific settings
    switch (contentType) {
      case 'module':
        if (!settings.enabled_for_modules) return false;
        if (moduleId && settings.disabled_module_ids?.includes(moduleId)) return false;
        break;
      case 'simulator':
        if (!settings.enabled_for_simulators) return false;
        break;
      case 'parcours':
        if (!settings.enabled_for_parcours) return false;
        break;
      case 'onboarding':
        if (!settings.enabled_for_onboarding) return false;
        break;
      case 'financial_profile':
        if (!settings.enabled_for_financial_profile) return false;
        break;
    }

    // Check if user already completed CSAT for this content
    const hasCompleted = await hasUserCompletedCSAT(contentType, contentId);
    return !hasCompleted;
  }, [isBetaMode, settings, hasUserCompletedCSAT]);

  return {
    settings,
    betaQuestions,
    isLoading,
    isBetaMode,
    shouldShowCSAT,
    hasUserCompletedCSAT,
    refetch: fetchSettings,
  };
};
