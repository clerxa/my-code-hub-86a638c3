/**
 * Utilitaires pour la gestion des partenariats
 */

/**
 * Vérifie si une entreprise a un partenariat actif
 * Retourne false si partnership_type est null, vide, "aucun" ou "Aucun"
 */
export const hasActivePartnership = (partnershipType: string | null | undefined): boolean => {
  if (!partnershipType) return false;
  const normalizedType = partnershipType.toLowerCase().trim();
  return normalizedType !== 'aucun' && normalizedType !== '';
};

/**
 * Options d'entité en charge du partenariat
 */
export const PARTNERSHIP_ENTITY_VALUES = [
  'CSE',
  'Département RH',
  'Département Communication',
  'Département RSE',
  'Département Financier',
  'Autre',
  'Aucun'
] as const;

export type PartnershipEntityType = typeof PARTNERSHIP_ENTITY_VALUES[number];