export interface Feature {
  id: string;
  nom_fonctionnalite: string;
  categorie: string;
  description: string | null;
  cle_technique: string;
  active: boolean;
  requires_partnership: boolean;
  created_at: string;
  updated_at: string;
}

// Fonction utilitaire pour vérifier l'accès à une feature
export const hasFeatureAccess = (
  hasPartnership: boolean,
  featureRequiresPartnership: boolean
): boolean => {
  if (!featureRequiresPartnership) return true;
  return hasPartnership;
};
