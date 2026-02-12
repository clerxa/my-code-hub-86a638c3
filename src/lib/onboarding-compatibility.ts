import { OnboardingScreenType } from "@/types/onboarding-cms";

/**
 * Règles de compatibilité entre types d'écrans pour les transitions
 * 
 * Un écran de type A peut-il mener vers un écran de type B ?
 */

// Types qui ne peuvent jamais être une destination (ils doivent être premiers)
const ENTRY_ONLY_TYPES: OnboardingScreenType[] = ['WELCOME'];

// Types qui collectent des données (permettent les conditions de transition)
export const DATA_COLLECTION_TYPES: OnboardingScreenType[] = [
  'SINGLE_CHOICE', 'MULTI_CHOICE', 'TOGGLE', 'SLIDER', 'TEXT_INPUT'
];

// Types qui affichent des résultats
export const RESULT_TYPES: OnboardingScreenType[] = ['CALCULATION_RESULT'];

/**
 * Vérifie si un type d'écran peut être une destination depuis un autre type
 */
export function canTransitionTo(
  fromType: OnboardingScreenType, 
  toType: OnboardingScreenType
): boolean {
  // On ne peut jamais aller vers un écran d'accueil
  if (ENTRY_ONLY_TYPES.includes(toType)) {
    return false;
  }
  
  // Toutes les autres transitions sont autorisées
  return true;
}

/**
 * Retourne un message expliquant pourquoi la transition n'est pas permise
 */
export function getIncompatibilityReason(
  fromType: OnboardingScreenType, 
  toType: OnboardingScreenType
): string | null {
  if (ENTRY_ONLY_TYPES.includes(toType)) {
    return "Les écrans d'accueil ne peuvent être que le premier écran du parcours";
  }
  return null;
}

/**
 * Obtient le label du type de destination pour l'UI
 */
export function getDestinationTypeLabel(type: 'screen' | 'internal' | 'external'): string {
  switch (type) {
    case 'screen': return '🔀 Aller vers un écran spécifique';
    case 'internal': return '🏠 Page interne de l\'app';
    case 'external': return '🔗 URL externe';
    default: return type;
  }
}

/**
 * Détermine les types de destination disponibles selon le contexte
 */
export function getAvailableDestinationTypes(screenType: OnboardingScreenType): Array<'screen' | 'internal' | 'external'> {
  // Tous les types d'écrans ont les mêmes options de destination (sans 'default')
  return ['screen', 'internal', 'external'];
}
