import { DispositifInfo } from "@/types/optimisation-fiscale";
import { 
  PiggyBank, 
  Heart, 
  Home, 
  Baby, 
  Building2, 
  Palmtree, 
  Factory, 
  TrendingUp,
  Leaf
} from "lucide-react";

export const DISPOSITIFS: DispositifInfo[] = [
  {
    id: 'per',
    nom: 'PER (Plan Épargne Retraite)',
    icon: 'PiggyBank',
    description: 'Déduction du revenu imposable',
    explication: 'Les versements sur un PER sont déductibles de votre revenu imposable dans la limite de 10% de vos revenus professionnels, avec possibilité de reporter les plafonds non utilisés sur 3 ans.',
    categorie: 'deduction',
  },
  {
    id: 'dons_75',
    nom: 'Dons aux associations (75%)',
    icon: 'Heart',
    description: 'Réduction de 75% (max 1000€)',
    explication: 'Dons aux associations d\'aide aux personnes en difficulté. Réduction d\'impôt de 75% dans la limite de 1000€. L\'excédent bascule automatiquement en réduction à 66%.',
    categorie: 'reduction',
  },
  {
    id: 'dons_66',
    nom: 'Dons aux associations (66%)',
    icon: 'Heart',
    description: 'Réduction de 66% (limite 20% du revenu)',
    explication: 'Dons aux associations d\'intérêt général. Réduction d\'impôt de 66% dans la limite de 20% du revenu imposable. Entre dans le plafond global des niches fiscales.',
    categorie: 'reduction',
  },
  {
    id: 'aide_domicile',
    nom: 'Aide à domicile',
    icon: 'Home',
    description: 'Crédit de 50% (max 6000€)',
    explication: 'Emploi d\'un salarié à domicile pour des services à la personne. Crédit d\'impôt de 50% des dépenses dans la limite de 6000€ (soit 3000€ de crédit maximum).',
    categorie: 'credit',
  },
  {
    id: 'garde_enfants',
    nom: 'Garde d\'enfants (<6 ans)',
    icon: 'Baby',
    description: 'Crédit de 50% (max 3500€)',
    explication: 'Frais de garde des enfants de moins de 6 ans. Crédit d\'impôt de 50% des dépenses dans la limite de 3500€ par enfant (soit 1750€ de crédit maximum par enfant).',
    categorie: 'credit',
  },
  {
    id: 'pinel',
    nom: 'Pinel (France métropolitaine)',
    icon: 'Building2',
    description: 'Réduction selon durée (6, 9 ou 12 ans)',
    explication: 'Investissement locatif neuf. Réduction d\'impôt de 9%, 12% ou 14% selon la durée d\'engagement (6, 9 ou 12 ans), répartie sur la période.',
    categorie: 'reduction',
  },
  {
    id: 'pinel_om',
    nom: 'Pinel Outre-mer',
    icon: 'Palmtree',
    description: 'Réduction majorée Outre-mer',
    explication: 'Investissement locatif neuf en Outre-mer. Réduction d\'impôt majorée de 23%, 29% ou 32% selon la durée. Entre dans le plafond Outre-mer de 18 000€.',
    categorie: 'reduction',
  },
  {
    id: 'girardin',
    nom: 'Girardin Industriel',
    icon: 'Factory',
    description: "Réduction jusqu'à 125% du montant investi",
    explication: 'Investissement dans du matériel industriel en Outre-mer. Réduction d\'impôt de 112% à 125% du montant investi selon la période de souscription (taux estimés), disponible dès l\'année de souscription.',
    categorie: 'reduction',
  },
  {
    id: 'pme_fcpi_fip',
    nom: 'PME / FCPI / FIP',
    icon: 'TrendingUp',
    description: 'Réduction de 18%',
    explication: 'Investissement au capital de PME ou via des fonds d\'investissement. Réduction d\'impôt de 18% du montant investi dans la limite de 50 000€ (célibataire) ou 100 000€ (couple).',
    categorie: 'reduction',
  },
  {
    id: 'esus',
    nom: 'ESUS (Entreprises Solidaires)',
    icon: 'Leaf',
    description: 'Réduction de 18% (plafond 13 000€)',
    explication: 'Investissement dans des entreprises solidaires d\'utilité sociale. Réduction d\'impôt de 18% avec un plafond spécifique de 13 000€, indépendant du plafond global des niches.',
    categorie: 'reduction',
  },
];

export const getDispositifIcon = (iconName: string) => {
  const icons: { [key: string]: any } = {
    PiggyBank,
    Heart,
    Home,
    Baby,
    Building2,
    Palmtree,
    Factory,
    TrendingUp,
    Leaf,
  };
  return icons[iconName] || Heart;
};
