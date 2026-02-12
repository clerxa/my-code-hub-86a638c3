import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface QuizValidationSettings {
  firstAttemptPercentage: number;
  retryPercentage: number;
  allowRetry: boolean;
  maxRetryAttempts: number;
}

const defaultSettings: QuizValidationSettings = {
  firstAttemptPercentage: 100,
  retryPercentage: 50,
  allowRetry: true,
  maxRetryAttempts: 0, // 0 = unlimited
};

export const useQuizValidationSettings = () => {
  const [settings, setSettings] = useState<QuizValidationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('module_validation_settings')
          .select('quiz_first_attempt_percentage, quiz_retry_percentage, allow_retry, max_retry_attempts')
          .eq('module_type', 'quiz')
          .single();

        if (error) {
          console.error('Error fetching quiz validation settings:', error);
          return;
        }

        if (data) {
          setSettings({
            firstAttemptPercentage: data.quiz_first_attempt_percentage ?? 100,
            retryPercentage: data.quiz_retry_percentage ?? 50,
            allowRetry: data.allow_retry ?? true,
            maxRetryAttempts: data.max_retry_attempts ?? 0,
          });
        }
      } catch (error) {
        console.error('Error fetching quiz settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const calculatePoints = (basePoints: number, isFirstAttempt: boolean): number => {
    const percentage = isFirstAttempt 
      ? settings.firstAttemptPercentage 
      : settings.retryPercentage;
    return Math.floor(basePoints * (percentage / 100));
  };

  const canRetry = (currentAttempts: number): boolean => {
    if (!settings.allowRetry) return false;
    if (settings.maxRetryAttempts === 0) return true; // unlimited
    return currentAttempts < settings.maxRetryAttempts;
  };

  return {
    settings,
    loading,
    calculatePoints,
    canRetry,
  };
};
