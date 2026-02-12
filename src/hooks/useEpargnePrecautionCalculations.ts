import { 
  SimulationInputs, 
  SimulationResults, 
  NiveauSecurite,
  TypeContrat,
  calculateTotalCharges
} from '@/types/epargne-precaution';
import { useSimulationDefaults } from '@/contexts/GlobalSettingsContext';

export const useEpargnePrecautionCalculations = () => {
  const simulationDefaults = useSimulationDefaults();

  // Mappings dynamiques depuis les settings
  const getNiveauSecuriteMois = (niveau: NiveauSecurite): number => {
    switch (niveau) {
      case 'minimum': return simulationDefaults.epargne_niveau_minimum_mois;
      case 'confortable': return simulationDefaults.epargne_niveau_confortable_mois;
      case 'optimal': return simulationDefaults.epargne_niveau_optimal_mois;
      default: return simulationDefaults.epargne_niveau_confortable_mois;
    }
  };

  const getCoefficientContrat = (type: TypeContrat): number => {
    switch (type) {
      case 'cdi': return simulationDefaults.epargne_coef_cdi_tech ?? 1.0;
      case 'cdd': return simulationDefaults.epargne_coef_cdi_non_tech ?? 1.3;
      case 'independant': return simulationDefaults.epargne_coef_independant ?? 1.5;
      default: return 1.0;
    }
  };

  const calculerSimulation = (inputs: SimulationInputs): SimulationResults => {
    const {
      charges_detaillees,
      epargne_actuelle,
      niveau_securite,
      capacite_epargne_mensuelle,
      type_contrat,
    } = inputs;

    // Total des charges fixes
    const charges_fixes_mensuelles = calculateTotalCharges(charges_detaillees);

    // Nombre de mois de sécurité (dynamique)
    const nb_mois_securite = getNiveauSecuriteMois(niveau_securite);

    // Coefficient selon le type de contrat (dynamique)
    const coefficient_contrat = getCoefficientContrat(type_contrat);

    // Dépenses mensuelles = charges fixes
    const depenses_mensuelles = charges_fixes_mensuelles;

    // Épargne recommandée
    const epargne_recommandee = depenses_mensuelles * nb_mois_securite * coefficient_contrat;

    // Épargne manquante
    const epargne_manquante = Math.max(0, epargne_recommandee - epargne_actuelle);

    // Temps pour atteindre l'objectif (en mois)
    let temps_pour_objectif: number | null = null;
    if (capacite_epargne_mensuelle > 0 && epargne_manquante > 0) {
      temps_pour_objectif = Math.ceil(epargne_manquante / capacite_epargne_mensuelle);
    }

    // Épargne mensuelle optimale (dynamique depuis settings)
    let epargne_mensuelle_optimale: number | null = null;
    if (epargne_manquante > 0) {
      epargne_mensuelle_optimale = Math.ceil(epargne_manquante / simulationDefaults.epargne_objectif_mois);
    }

    // Calcul de l'indice de résilience (0-100)
    const indice_resilience = calculerIndiceResilience({
      epargne_actuelle,
      epargne_recommandee,
      type_contrat,
      charges_fixes_mensuelles,
    });

    // Message personnalisé
    const message_personnalise = genererMessage({
      epargne_actuelle,
      epargne_recommandee,
      nb_mois_securite,
      charges_fixes_mensuelles,
    });

    // Condition CTA
    const cta_condition = determinerCTACondition({
      epargne_actuelle,
      epargne_recommandee,
      nb_mois_securite,
      charges_fixes_mensuelles,
    });

    return {
      nb_mois_securite,
      coefficient_contrat,
      depenses_mensuelles,
      epargne_recommandee,
      epargne_manquante,
      temps_pour_objectif,
      epargne_mensuelle_optimale,
      indice_resilience,
      message_personnalise,
      cta_condition,
    };
  };

  const calculerIndiceResilience = (params: {
    epargne_actuelle: number;
    epargne_recommandee: number;
    type_contrat: TypeContrat;
    charges_fixes_mensuelles: number;
  }): number => {
    let score = 0;

    // 1. Ratio épargne actuelle / recommandée (50 points max)
    if (params.epargne_recommandee > 0) {
      const ratioEpargne = params.epargne_actuelle / params.epargne_recommandee;
      score += Math.min(50, ratioEpargne * 50);
    }

    // 2. Stabilité emploi (30 points max)
    switch (params.type_contrat) {
      case 'cdi':
        score += 30;
        break;
      case 'cdd':
        score += 20;
        break;
      case 'independant':
        score += 15;
        break;
    }

    // 3. Niveau de charges (20 points max) - Plus les charges sont basses, mieux c'est
    if (params.charges_fixes_mensuelles < 1500) {
      score += 20;
    } else if (params.charges_fixes_mensuelles < 2500) {
      score += 15;
    } else if (params.charges_fixes_mensuelles < 4000) {
      score += 10;
    } else {
      score += 5;
    }

    return Math.min(100, Math.round(score));
  };

  const genererMessage = (params: {
    epargne_actuelle: number;
    epargne_recommandee: number;
    nb_mois_securite: number;
    charges_fixes_mensuelles: number;
  }): string => {
    const moisActuels = params.charges_fixes_mensuelles > 0 
      ? params.epargne_actuelle / params.charges_fixes_mensuelles 
      : 0;

    // Priorité 1 : Épargne < 2 mois
    if (moisActuels < 2) {
      return "⚠️ Votre niveau de sécurité est insuffisant. Un expert peut vous accompagner pour mettre en place un plan d'épargne adapté.";
    }

    // Priorité 2 : Épargne > 4 mois
    if (moisActuels >= 4) {
      return "✅ Vous disposez déjà d'un bon matelas de sécurité. Votre excédent peut être investi de manière rentable.";
    }

    // Priorité 3 : Entre 2 et 4 mois
    return "💡 Vous êtes sur la bonne voie. Continuez à renforcer votre épargne de précaution.";
  };

  const determinerCTACondition = (params: {
    epargne_actuelle: number;
    epargne_recommandee: number;
    nb_mois_securite: number;
    charges_fixes_mensuelles: number;
  }): string => {
    const moisActuels = params.charges_fixes_mensuelles > 0 
      ? params.epargne_actuelle / params.charges_fixes_mensuelles 
      : 0;

    // Priorité 1 : Insuffisance sérieuse
    if (moisActuels < 2) {
      return "insuffisance_serieuse";
    }

    // Priorité 2 : Matelas déjà OK
    if (moisActuels >= 4) {
      return "matelas_ok";
    }

    return "general";
  };

  return {
    calculerSimulation,
    getCoefficientContrat,
  };
};
