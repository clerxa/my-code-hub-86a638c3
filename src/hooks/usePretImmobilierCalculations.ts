import { useMemo } from 'react';

export interface PretImmobilierInput {
  montantProjet: number;
  apportPersonnel: number;
  dureeAnnees: number;
  tauxInteret: number; // en %
  tauxAssurance: number; // TAEA en %
  revenuMensuel?: number;
}

export interface PretImmobilierResults {
  montantEmprunte: number;
  mensualitePret: number;
  mensualiteAssurance: number;
  mensualiteTotale: number;
  coutTotalInterets: number;
  coutTotalAssurance: number;
  coutGlobalCredit: number;
  tauxEndettement: number | null;
  nombreMensualites: number;
}

export const usePretImmobilierCalculations = () => {
  const calculerSimulation = useMemo(() => {
    return (input: PretImmobilierInput): PretImmobilierResults => {
      // 1. Montant Emprunté
      const montantEmprunte = Math.max(0, input.montantProjet - input.apportPersonnel);
      
      // 2. Taux Mensuel
      const tauxMensuel = input.tauxInteret / 100 / 12;
      
      // 3. Nombre Total de Mensualités
      const nombreMensualites = input.dureeAnnees * 12;
      
      // 4. Mensualité du Prêt (formule d'annuité constante)
      let mensualitePret = 0;
      if (tauxMensuel > 0 && nombreMensualites > 0 && montantEmprunte > 0) {
        mensualitePret = montantEmprunte * (tauxMensuel / (1 - Math.pow(1 + tauxMensuel, -nombreMensualites)));
      } else if (nombreMensualites > 0 && montantEmprunte > 0) {
        // Taux 0%
        mensualitePret = montantEmprunte / nombreMensualites;
      }
      
      // 5. Mensualité d'Assurance (calcul sur capital initial)
      const mensualiteAssurance = (montantEmprunte * (input.tauxAssurance / 100)) / 12;
      
      // 6. Mensualité Totale
      const mensualiteTotale = mensualitePret + mensualiteAssurance;
      
      // 7. Coût Total des Intérêts
      const coutTotalInterets = Math.max(0, (mensualitePret * nombreMensualites) - montantEmprunte);
      
      // 8. Coût Total de l'Assurance
      const coutTotalAssurance = mensualiteAssurance * nombreMensualites;
      
      // 9. Coût Global du Crédit
      const coutGlobalCredit = coutTotalInterets + coutTotalAssurance;
      
      // 10. Taux d'Endettement
      let tauxEndettement: number | null = null;
      if (input.revenuMensuel && input.revenuMensuel > 0) {
        tauxEndettement = (mensualiteTotale / input.revenuMensuel) * 100;
      }
      
      return {
        montantEmprunte,
        mensualitePret,
        mensualiteAssurance,
        mensualiteTotale,
        coutTotalInterets,
        coutTotalAssurance,
        coutGlobalCredit,
        tauxEndettement,
        nombreMensualites,
      };
    };
  }, []);
  
  // Générer le tableau d'amortissement simplifié
  const genererAmortissement = useMemo(() => {
    return (input: PretImmobilierInput): { annee: number; capitalRembourse: number; interetsPaies: number; capitalRestant: number }[] => {
      const montantEmprunte = Math.max(0, input.montantProjet - input.apportPersonnel);
      const tauxMensuel = input.tauxInteret / 100 / 12;
      const nombreMensualites = input.dureeAnnees * 12;
      
      let mensualitePret = 0;
      if (tauxMensuel > 0 && nombreMensualites > 0 && montantEmprunte > 0) {
        mensualitePret = montantEmprunte * (tauxMensuel / (1 - Math.pow(1 + tauxMensuel, -nombreMensualites)));
      } else if (nombreMensualites > 0 && montantEmprunte > 0) {
        mensualitePret = montantEmprunte / nombreMensualites;
      }
      
      const tableau: { annee: number; capitalRembourse: number; interetsPaies: number; capitalRestant: number }[] = [];
      let capitalRestant = montantEmprunte;
      
      for (let annee = 1; annee <= input.dureeAnnees; annee++) {
        let capitalRembourseAnnee = 0;
        let interetsPaiesAnnee = 0;
        
        for (let mois = 0; mois < 12; mois++) {
          if (capitalRestant <= 0) break;
          
          const interetsMois = capitalRestant * tauxMensuel;
          const capitalMois = Math.min(mensualitePret - interetsMois, capitalRestant);
          
          interetsPaiesAnnee += interetsMois;
          capitalRembourseAnnee += capitalMois;
          capitalRestant -= capitalMois;
        }
        
        tableau.push({
          annee,
          capitalRembourse: capitalRembourseAnnee,
          interetsPaies: interetsPaiesAnnee,
          capitalRestant: Math.max(0, capitalRestant),
        });
      }
      
      return tableau;
    };
  }, []);
  
  return { calculerSimulation, genererAmortissement };
};
