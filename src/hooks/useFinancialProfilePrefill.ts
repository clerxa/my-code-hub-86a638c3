import { useEffect, useState } from "react";
import { useUserFinancialProfile, UserFinancialProfile } from "./useUserFinancialProfile";

export interface PrefillData {
  // Revenus
  revenuMensuelNet: number;
  revenuFiscalAnnuel: number;
  revenusLocatifs: number;
  autresRevenus: number;
  
  // Charges - Legacy
  chargesFixes: number;
  loyerActuel: number;
  creditImmobilier: number;
  creditConsommation: number;
  creditAuto: number;
  pensionsAlimentaires: number;
  
  // Charges détaillées (synced with simulator)
  chargesDetailees: {
    loyer: number;
    credit_immobilier: number;
    copropriete_taxes: number;
    energie: number;
    assurance_habitation: number;
    transport_commun: number;
    assurance_auto: number;
    lld_loa_auto: number;
    internet: number;
    mobile: number;
    abonnements: number;
    frais_scolarite: number;
    pension_alimentaire: number;
    credit_consommation: number;
    autres: number;
  };
  
  // Patrimoine
  epargneActuelle: number;
  apportDisponible: number;
  capaciteEpargneMensuelle: number;
  patrimoineCrypto: number;
  patrimoinePrivateEquity: number;
  
  // Fiscal
  tmi: number;
  partsFiscales: number;
  plafondPERReportable: number;
  
  // Personnel
  age: number | null;
  nbEnfants: number;
  nbPersonnesFoyer: number;
  situationFamiliale: string;
  
  // Emploi
  typeContrat: string;
  ancienneteAnnees: number;
  
  // Immobilier
  objectifAchatImmo: boolean;
  budgetAchatImmo: number | null;
  dureeEmpruntSouhaitee: number;
}

export const useFinancialProfilePrefill = () => {
  const { profile, isLoading } = useUserFinancialProfile();
  const [isProfileUsed, setIsProfileUsed] = useState(false);

  const getPrefillData = (): PrefillData & { profile: UserFinancialProfile | null } => {
    if (!profile) {
      return { ...getDefaultData(), profile: null };
    }
    
    setIsProfileUsed(true);
    
    return {
      // Revenus
      revenuMensuelNet: profile.revenu_mensuel_net || 0,
      revenuFiscalAnnuel: profile.revenu_fiscal_annuel || 0,
      revenusLocatifs: profile.revenus_locatifs || 0,
      autresRevenus: profile.autres_revenus_mensuels || 0,
      
      // Charges legacy
      chargesFixes: profile.charges_fixes_mensuelles || 0,
      loyerActuel: profile.loyer_actuel || 0,
      creditImmobilier: profile.credits_immobilier || 0,
      creditConsommation: profile.credits_consommation || 0,
      creditAuto: profile.credits_auto || 0,
      pensionsAlimentaires: profile.pensions_alimentaires || 0,
      
      // Charges détaillées (synchronized with simulator categories)
      chargesDetailees: {
        loyer: profile.loyer_actuel || 0,
        credit_immobilier: profile.credits_immobilier || 0,
        copropriete_taxes: profile.charges_copropriete_taxes || 0,
        energie: profile.charges_energie || 0,
        assurance_habitation: profile.charges_assurance_habitation || 0,
        transport_commun: profile.charges_transport_commun || 0,
        assurance_auto: profile.charges_assurance_auto || 0,
        lld_loa_auto: profile.charges_lld_loa_auto || profile.credits_auto || 0,
        internet: profile.charges_internet || 0,
        mobile: profile.charges_mobile || 0,
        abonnements: profile.charges_abonnements || 0,
        frais_scolarite: profile.charges_frais_scolarite || 0,
        pension_alimentaire: profile.pensions_alimentaires || 0,
        credit_consommation: profile.credits_consommation || 0,
        autres: profile.charges_autres || 0,
      },
      
      // Patrimoine
      epargneActuelle: profile.epargne_livrets || 0,
      apportDisponible: profile.apport_disponible || 0,
      capaciteEpargneMensuelle: profile.capacite_epargne_mensuelle || 0,
      patrimoineCrypto: profile.patrimoine_crypto || 0,
      patrimoinePrivateEquity: profile.patrimoine_private_equity || 0,
      
      // Fiscal
      tmi: profile.tmi || 30,
      partsFiscales: profile.parts_fiscales || 1,
      plafondPERReportable: profile.plafond_per_reportable || 0,
      
      // Personnel
      age: profile.age,
      nbEnfants: profile.nb_enfants || 0,
      nbPersonnesFoyer: profile.nb_personnes_foyer || 1,
      situationFamiliale: profile.situation_familiale || 'celibataire',
      
      // Emploi
      typeContrat: profile.type_contrat || 'cdi',
      ancienneteAnnees: profile.anciennete_annees || 0,
      
      // Immobilier
      objectifAchatImmo: profile.objectif_achat_immo || false,
      budgetAchatImmo: profile.budget_achat_immo,
      dureeEmpruntSouhaitee: profile.duree_emprunt_souhaitee || 20,
      
      // Profil complet pour accès direct aux champs supplémentaires
      profile,
    };
  };

  const getDefaultData = (): PrefillData => ({
    revenuMensuelNet: 0,
    revenuFiscalAnnuel: 0,
    revenusLocatifs: 0,
    autresRevenus: 0,
    chargesFixes: 0,
    loyerActuel: 0,
    creditImmobilier: 0,
    creditConsommation: 0,
    creditAuto: 0,
    pensionsAlimentaires: 0,
    chargesDetailees: {
      loyer: 0,
      credit_immobilier: 0,
      copropriete_taxes: 0,
      energie: 0,
      assurance_habitation: 0,
      transport_commun: 0,
      assurance_auto: 0,
      lld_loa_auto: 0,
      internet: 0,
      mobile: 0,
      abonnements: 0,
      frais_scolarite: 0,
      pension_alimentaire: 0,
      credit_consommation: 0,
      autres: 0,
    },
    epargneActuelle: 0,
    apportDisponible: 0,
    capaciteEpargneMensuelle: 0,
    patrimoineCrypto: 0,
    patrimoinePrivateEquity: 0,
    tmi: 30,
    partsFiscales: 1,
    plafondPERReportable: 0,
    age: null,
    nbEnfants: 0,
    nbPersonnesFoyer: 1,
    situationFamiliale: 'celibataire',
    typeContrat: 'cdi',
    ancienneteAnnees: 0,
    objectifAchatImmo: false,
    budgetAchatImmo: null,
    dureeEmpruntSouhaitee: 20,
  });

  const hasProfile = !!profile && (
    profile.revenu_mensuel_net > 0 || 
    profile.revenu_fiscal_annuel > 0 ||
    profile.epargne_livrets > 0
  );

  return {
    profile,
    isLoading,
    getPrefillData,
    hasProfile,
    isProfileUsed,
    navigateToProfile: () => '/employee/profile?tab=financial',
  };
};
