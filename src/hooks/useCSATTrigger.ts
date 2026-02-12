import { useState, useCallback, useEffect } from 'react';
import { useCSATSettings } from './useCSATSettings';
import { CSATContentType } from '@/types/csat';

interface UseCSATTriggerReturn {
  showCSAT: boolean;
  triggerCSAT: () => void;
  closeCSAT: () => void;
  isCheckingCSAT: boolean;
  contentType: CSATContentType;
  contentId: string;
  contentName: string;
  parcoursId?: string;
  moduleId?: number;
}

interface UseCSATTriggerProps {
  contentType: CSATContentType;
  contentId: string;
  contentName: string;
  parcoursId?: string;
  moduleId?: number;
  autoTriggerOnMount?: boolean;
}

/**
 * Hook to trigger CSAT dialog after content completion.
 * Checks if CSAT should be shown based on settings and user history.
 */
export const useCSATTrigger = ({
  contentType,
  contentId,
  contentName,
  parcoursId,
  moduleId,
  autoTriggerOnMount = false,
}: UseCSATTriggerProps): UseCSATTriggerReturn => {
  const { shouldShowCSAT, isLoading } = useCSATSettings();
  const [showCSAT, setShowCSAT] = useState(false);
  const [isCheckingCSAT, setIsCheckingCSAT] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const triggerCSAT = useCallback(async () => {
    if (isLoading || hasChecked) return;
    
    setIsCheckingCSAT(true);
    try {
      const shouldShow = await shouldShowCSAT(contentType, contentId, moduleId);
      if (shouldShow) {
        // Small delay to let the completion animation play first
        setTimeout(() => {
          setShowCSAT(true);
        }, 1500);
      }
    } catch (error) {
      console.error('Error checking CSAT:', error);
    } finally {
      setIsCheckingCSAT(false);
      setHasChecked(true);
    }
  }, [contentType, contentId, moduleId, shouldShowCSAT, isLoading, hasChecked]);

  const closeCSAT = useCallback(() => {
    setShowCSAT(false);
  }, []);

  // Auto-trigger on mount if requested
  useEffect(() => {
    if (autoTriggerOnMount && !hasChecked && !isLoading) {
      triggerCSAT();
    }
  }, [autoTriggerOnMount, hasChecked, isLoading, triggerCSAT]);

  return {
    showCSAT,
    triggerCSAT,
    closeCSAT,
    isCheckingCSAT,
    contentType,
    contentId,
    contentName,
    parcoursId,
    moduleId,
  };
};
