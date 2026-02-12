/**
 * Hook pour les calculs du simulateur de capacité d'emprunt
 * La logique de calcul est maintenant exécutée côté serveur via Edge Function
 */

import { useState, useCallback, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useSimulationDefaults } from "@/contexts/GlobalSettingsContext";
import { toast } from "sonner";

export interface CapaciteEmpruntInput {
  revenuMensuelNet: number;
  chargesFixes: number;
  loyerActuel: number;
  nombreEnfants: number;
  dureeAnnees: number;
  tauxInteret: number;
  apportPersonnel: number;
  fraisNotaire: number;
}

export interface CapaciteEmpruntResults {
  mensualiteMaximale: number;
  capaciteEmprunt: number;
  montantProjetMax: number;
  tauxEndettementActuel: number;
  tauxUtilisationCapacite: number;
  tauxEndettementFutur: number;
  resteAVivre: number;
  resteAVivreFutur: number;
  nombreMensualites: number;
  fraisNotaireEstimes: number;
}

interface CapaciteEmpruntState {
  results: CapaciteEmpruntResults | null;
  isLoading: boolean;
  error: string | null;
}

export const useCapaciteEmpruntCalculations = () => {
  const simulationDefaults = useSimulationDefaults();

  const [state, setState] = useState<CapaciteEmpruntState>({
    results: null,
    isLoading: false,
    error: null,
  });

  /**
   * Appelle l'Edge Function pour calculer la simulation
   */
  const calculerSimulationServeur = useCallback(async (input: CapaciteEmpruntInput): Promise<CapaciteEmpruntResults | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const payload = {
        ...input,
        simulation_defaults: {
          max_debt_ratio: simulationDefaults.max_debt_ratio,
          min_living_remainder_adult: simulationDefaults.min_living_remainder_adult,
          min_living_remainder_child: simulationDefaults.min_living_remainder_child,
        },
      };

      console.log('Calling calculate-capacite-emprunt Edge Function');

      const { data: response, error } = await supabase.functions.invoke('calculate-capacite-emprunt', {
        body: payload,
      });

      if (error) {
        throw new Error(error.message || 'Erreur lors du calcul');
      }

      if (!response?.success) {
        const details = response?.details?.map((d: { message: string }) => d.message).join(', ');
        throw new Error(details || response?.error || 'Erreur inconnue');
      }

      const results = response.results as CapaciteEmpruntResults;
      setState({ results, isLoading: false, error: null });
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du calcul';
      console.error('Capacité Emprunt calculation error:', errorMessage);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast.error('Erreur de calcul', { description: errorMessage });
      return null;
    }
  }, [simulationDefaults]);

  /**
   * Calcul synchrone local pour les mises à jour en temps réel (preview)
   */
  const calculerSimulation = useMemo(() => {
    return (input: CapaciteEmpruntInput): CapaciteEmpruntResults => {
      const {
        revenuMensuelNet,
        chargesFixes,
        loyerActuel,
        nombreEnfants,
        dureeAnnees,
        tauxInteret,
        apportPersonnel,
        fraisNotaire,
      } = input;

      const tauxEndettementMax = simulationDefaults.max_debt_ratio / 100;
      const resteAVivreParAdulte = simulationDefaults.min_living_remainder_adult;
      const resteAVivreParEnfant = simulationDefaults.min_living_remainder_child;

      // 1. Taux d'endettement actuel
      const tauxEndettementActuel = revenuMensuelNet > 0
        ? (chargesFixes / revenuMensuelNet) * 100
        : 0;

      // 1b. Taux d'utilisation de la capacité
      const tauxUtilisationCapacite = revenuMensuelNet > 0
        ? ((chargesFixes + loyerActuel) / revenuMensuelNet) * 100
        : 0;

      // 2. Mensualité maximale
      const mensualiteMaximale = Math.max(0, (revenuMensuelNet * tauxEndettementMax) - chargesFixes);

      // 3. Calcul du reste à vivre futur
      const resteAVivreFutur = revenuMensuelNet - mensualiteMaximale - chargesFixes;
      const resteAVivreMinimum = resteAVivreParAdulte * 2 + (nombreEnfants * resteAVivreParEnfant);

      let mensualiteAjustee = mensualiteMaximale;
      if (resteAVivreFutur < resteAVivreMinimum && revenuMensuelNet > 0) {
        mensualiteAjustee = Math.max(0, revenuMensuelNet - chargesFixes - resteAVivreMinimum);
      }

      // 4. Calcul de la capacité d'emprunt
      const tauxMensuel = tauxInteret / 100 / 12;
      const nombreMensualites = dureeAnnees * 12;

      let capaciteEmprunt = 0;
      if (tauxMensuel > 0 && nombreMensualites > 0 && mensualiteAjustee > 0) {
        capaciteEmprunt = mensualiteAjustee * ((1 - Math.pow(1 + tauxMensuel, -nombreMensualites)) / tauxMensuel);
      } else if (nombreMensualites > 0 && mensualiteAjustee > 0) {
        capaciteEmprunt = mensualiteAjustee * nombreMensualites;
      }

      // 5. Estimation des frais de notaire
      const prixBienEstime = capaciteEmprunt + apportPersonnel;
      const fraisNotaireEstimes = prixBienEstime * (fraisNotaire / 100);

      // 6. Montant maximal du projet
      const montantProjetMax = capaciteEmprunt + apportPersonnel - fraisNotaireEstimes;

      // 7. Taux d'endettement futur
      const tauxEndettementFutur = revenuMensuelNet > 0
        ? ((mensualiteAjustee + chargesFixes) / revenuMensuelNet) * 100
        : 0;

      // 8. Reste à vivre actuel
      const resteAVivre = revenuMensuelNet - chargesFixes - loyerActuel;

      return {
        mensualiteMaximale: mensualiteAjustee,
        capaciteEmprunt: Math.max(0, capaciteEmprunt),
        montantProjetMax: Math.max(0, montantProjetMax),
        tauxEndettementActuel,
        tauxUtilisationCapacite,
        tauxEndettementFutur,
        resteAVivre,
        resteAVivreFutur: revenuMensuelNet - mensualiteAjustee - chargesFixes,
        nombreMensualites,
        fraisNotaireEstimes,
      };
    };
  }, [simulationDefaults]);

  return {
    // State
    results: state.results,
    isLoading: state.isLoading,
    error: state.error,

    // Functions
    calculerSimulation,
    calculerSimulationServeur,
  };
};
