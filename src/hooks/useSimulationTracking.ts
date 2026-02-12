import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SimulationTrackingData {
  simulatorType: string;
  simulationData: Record<string, any>;
  resultsData: Record<string, any>;
}

export interface UseSimulationTrackingReturn {
  // Validation state
  isValidating: boolean;
  isValidated: boolean;
  simulationLogId: string | null;
  
  // Actions
  validateSimulation: (data: SimulationTrackingData) => Promise<string | null>;
  markAsSaved: () => Promise<void>;
  trackCTAClick: (ctaId: string, isAppointment?: boolean) => Promise<void>;
  resetValidation: () => void;
  
  // For triggering validation flow
  startValidation: () => void;
  completeValidation: () => void;
  showValidationOverlay: boolean;
}

/**
 * Hook to track simulation validations and CTA clicks
 * - validateSimulation: Saves to back-office (simulation_logs) but NOT to user history
 * - markAsSaved: Marks the simulation as saved to user history
 * - trackCTAClick: Records which CTA was clicked
 */
export function useSimulationTracking(): UseSimulationTrackingReturn {
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [simulationLogId, setSimulationLogId] = useState<string | null>(null);
  const [showValidationOverlay, setShowValidationOverlay] = useState(false);

  const startValidation = useCallback(() => {
    setShowValidationOverlay(true);
    setIsValidating(true);
  }, []);

  const completeValidation = useCallback(() => {
    setShowValidationOverlay(false);
    setIsValidating(false);
    setIsValidated(true);
  }, []);

  const validateSimulation = async (data: SimulationTrackingData): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const logEntry = {
        user_id: user?.id || null,
        session_id: !user ? `anon_${Date.now()}` : null,
        simulator_type: data.simulatorType,
        simulation_data: data.simulationData,
        results_data: data.resultsData,
        is_saved_to_history: false,
        cta_clicked: [],
        appointment_cta_clicked: false,
      };

      const { data: insertedLog, error } = await supabase
        .from("simulation_logs")
        .insert(logEntry)
        .select("id")
        .single();

      if (error) throw error;

      setSimulationLogId(insertedLog.id);
      
      return insertedLog.id;
    } catch (error) {
      console.error("Error logging simulation:", error);
      // Don't show error to user, just log silently
      return null;
    }
  };

  const markAsSaved = async () => {
    if (!simulationLogId) return;

    try {
      await supabase
        .from("simulation_logs")
        .update({ is_saved_to_history: true })
        .eq("id", simulationLogId);
    } catch (error) {
      console.error("Error marking simulation as saved:", error);
    }
  };

  const trackCTAClick = async (ctaId: string, isAppointment = false) => {
    if (!simulationLogId) return;

    try {
      // First get current CTA clicks
      const { data: current } = await supabase
        .from("simulation_logs")
        .select("cta_clicked")
        .eq("id", simulationLogId)
        .single();

      const currentClicks = (current?.cta_clicked as string[]) || [];
      const updatedClicks = [...new Set([...currentClicks, ctaId])];

      const updateData: Record<string, any> = { 
        cta_clicked: updatedClicks,
      };
      
      if (isAppointment) {
        updateData.appointment_cta_clicked = true;
      }

      await supabase
        .from("simulation_logs")
        .update(updateData)
        .eq("id", simulationLogId);
    } catch (error) {
      console.error("Error tracking CTA click:", error);
    }
  };

  const resetValidation = useCallback(() => {
    setIsValidated(false);
    setSimulationLogId(null);
    setShowValidationOverlay(false);
    setIsValidating(false);
  }, []);

  return {
    isValidating,
    isValidated,
    simulationLogId,
    validateSimulation,
    markAsSaved,
    trackCTAClick,
    resetValidation,
    startValidation,
    completeValidation,
    showValidationOverlay,
  };
}
