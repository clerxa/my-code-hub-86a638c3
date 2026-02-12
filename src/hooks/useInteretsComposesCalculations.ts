import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CalculInputs {
  montant_initial: number;
  versement_mensuel: number;
  duree_annees: number;
  taux_interet: number;
}

interface EvolutionAnnuelle {
  annee: number;
  capital: number;
  versements: number;
  interets: number;
}

interface CalculationResult {
  capital_final: number;
  total_interets: number;
  total_investi: number;
  evolution_annuelle: EvolutionAnnuelle[];
  capital_sans_versements: number;
  multiplicateur: string;
}

export const useInteretsComposesCalculations = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Calcul local pour preview instantanée
  const calculerLocale = (inputs: CalculInputs) => {
    const { montant_initial, versement_mensuel, duree_annees, taux_interet } = inputs;
    
    const tauxMensuel = taux_interet / 100 / 12;
    const evolutionAnnuelle: EvolutionAnnuelle[] = [];
    
    let capitalActuel = montant_initial;
    let totalVerse = montant_initial;
    
    for (let annee = 0; annee <= duree_annees; annee++) {
      if (annee === 0) {
        evolutionAnnuelle.push({
          annee: 0,
          capital: montant_initial,
          versements: montant_initial,
          interets: 0,
        });
      } else {
        for (let mois = 0; mois < 12; mois++) {
          capitalActuel = capitalActuel * (1 + tauxMensuel) + versement_mensuel;
          totalVerse += versement_mensuel;
        }
        
        evolutionAnnuelle.push({
          annee,
          capital: Math.round(capitalActuel),
          versements: Math.round(totalVerse),
          interets: Math.round(capitalActuel - totalVerse),
        });
      }
    }
    
    const capitalFinal = evolutionAnnuelle[evolutionAnnuelle.length - 1].capital;
    const totalInterets = evolutionAnnuelle[evolutionAnnuelle.length - 1].interets;
    const totalInvesti = evolutionAnnuelle[evolutionAnnuelle.length - 1].versements;
    const capitalSansVersements = Math.round(montant_initial * Math.pow(1 + taux_interet / 100, duree_annees));
    
    return {
      capitalFinal,
      totalInterets,
      totalInvesti,
      evolutionAnnuelle,
      capitalSansVersements,
      multiplicateur: (capitalFinal / totalInvesti).toFixed(1),
    };
  };

  // Calcul serveur sécurisé
  const calculerServeur = async (inputs: CalculInputs): Promise<CalculationResult | null> => {
    setIsLoading(true);
    
    try {
      const { data: response, error } = await supabase.functions.invoke('calculate-interets-composes', {
        body: inputs,
      });

      if (error) {
        console.error('Erreur Edge Function:', error);
        toast.error("Erreur lors du calcul serveur");
        return null;
      }

      return response as CalculationResult;
    } catch (err) {
      console.error('Erreur appel serveur:', err);
      toast.error("Erreur de connexion au serveur");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    calculerLocale,
    calculerServeur,
  };
};
