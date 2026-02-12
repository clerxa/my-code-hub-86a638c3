import React, { createContext, useContext, ReactNode } from 'react';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { 
  GlobalSettingsState, 
  FiscalRules, 
  LeadQualification, 
  SimulationDefaults, 
  ProductConstants,
  RecommendationThresholds 
} from '@/types/global-settings';

interface GlobalSettingsContextType extends GlobalSettingsState {
  fetchSettings: () => Promise<void>;
  updateSetting: (id: string, value: string | number | boolean | object) => Promise<{ success: boolean; error?: string }>;
  getSetting: <T>(category: string, key: string, defaultValue: T) => T;
}

const GlobalSettingsContext = createContext<GlobalSettingsContextType | undefined>(undefined);

interface GlobalSettingsProviderProps {
  children: ReactNode;
  year?: number;
}

export const GlobalSettingsProvider: React.FC<GlobalSettingsProviderProps> = ({ 
  children, 
  year = new Date().getFullYear() 
}) => {
  const settings = useGlobalSettings(year);

  return (
    <GlobalSettingsContext.Provider value={settings}>
      {children}
    </GlobalSettingsContext.Provider>
  );
};

export const useGlobalSettingsContext = (): GlobalSettingsContextType => {
  const context = useContext(GlobalSettingsContext);
  if (!context) {
    throw new Error('useGlobalSettingsContext must be used within a GlobalSettingsProvider');
  }
  return context;
};

// Convenience hooks for specific categories
export const useFiscalRules = (): FiscalRules & { isLoading: boolean } => {
  const { fiscalRules, isLoading } = useGlobalSettingsContext();
  return { ...fiscalRules, isLoading };
};

export const useLeadQualification = (): LeadQualification & { isLoading: boolean } => {
  const { leadQualification, isLoading } = useGlobalSettingsContext();
  return { ...leadQualification, isLoading };
};

export const useSimulationDefaults = (): SimulationDefaults & { isLoading: boolean } => {
  const { simulationDefaults, isLoading } = useGlobalSettingsContext();
  return { ...simulationDefaults, isLoading };
};

export const useProductConstants = (): ProductConstants & { isLoading: boolean } => {
  const { productConstants, isLoading } = useGlobalSettingsContext();
  return { ...productConstants, isLoading };
};

export const useRecommendationThresholds = (): RecommendationThresholds & { isLoading: boolean } => {
  const { recommendationThresholds, isLoading } = useGlobalSettingsContext();
  return { ...recommendationThresholds, isLoading };
};
