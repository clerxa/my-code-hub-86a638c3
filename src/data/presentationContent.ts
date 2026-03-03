// =====================================================
// PROSPECT PRESENTATION — STATIC CONTENT DATA
// =====================================================

export interface PresentationStat {
  id: string;
  figure: string;
  text: string;
  source?: string;
}

export const PRESENTATION_STATS: PresentationStat[] = [
  {
    id: 'stat_1',
    figure: '86%',
    text: "des Français déclarent ne pas se sentir suffisamment informés pour prendre de bonnes décisions financières.",
    source: 'Banque de France, 2023',
  },
  {
    id: 'stat_2',
    figure: '70%',
    text: "des actifs en entreprise ne comprennent pas les mécanismes liés à leur épargne salariale, leur PER ou leurs stock-options.",
    source: 'Étude Ifop 2023 pour Fondation Crédit Coopératif',
  },
  {
    id: 'stat_3',
    figure: '33%',
    text: "des contribuables déclarent avoir mal renseigné leur déclaration de revenus.",
  },
];

export const EMPLOYEE_QUESTIONS = [
  { text: 'Comment préparer ma retraite ?', icon: '🏦' },
  { text: 'Quelle fiscalité est applicable à mon PERCO ? PEE ?', icon: '📊' },
  { text: 'Par quoi dois-je commencer pour sécuriser mon avenir ?', icon: '🔐' },
  { text: 'Comment éviter les erreurs durant ma déclaration de revenus ?', icon: '📝' },
  { text: "J'ai des dispositifs de rémunération particuliers (RSU, ESPP, stock-options) : suis-je sûr de bien les comprendre ?", icon: '💡', techHighlight: true },
  { text: "À combien doit s'élever mon épargne de précaution ?", icon: '🛡️' },
  { text: 'Comment sont calculés mes impôts ?', icon: '🧮' },
  { text: 'Comment est calculé le quotient familial ?', icon: '👨‍👩‍👧‍👦' },
];

export const EDUCATION_NEEDS = [
  'Comprendre leur rémunération réelle',
  'Mieux gérer leur fiscalité',
  'Apprendre à épargner et à investir intelligemment',
  'Faire les bons choix dans les dispositifs d\'entreprise',
  'Avoir un repère fiable et neutre',
];

export const EDUCATION_NEEDS_FOOTER = "Les besoins des salariés en matière de finance personnelle sont rarement explicites. Le tabou financier est persistant et il est difficile d'avouer que certains fondamentaux ne sont pas maîtrisés.";

export const COMPANY_BENEFITS = [
  'Réduire le stress financier des salariés',
  'Renforcer la marque employeur en intégrant l\'éducation financière dans les dispositifs de bien-être et de santé mentale',
  'Améliorer l\'usage des dispositifs d\'entreprise',
  'Valoriser les initiatives RH, RSE ou du CSE sans complexité grâce à une offre clé en main',
  'Contribuer à une mission d\'intérêt général',
  'Sécuriser les prises de décision des collaborateurs',
];

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
}

export const HOW_IT_WORKS: HowItWorksStep[] = [
  { step: 1, title: 'Choix des thématiques et des dates', description: 'De 4 à 6 webinars par an. Choix parmi une liste de webinars disponibles ou création d\'un webinar sur mesure sur une thématique spécifique.' },
  { step: 2, title: 'Création du kit de communication', description: 'Nous vous envoyons un kit complet : emails à envoyer à vos collaborateurs (M-1 mois, S-1 semaine, J-1 jour), présentation FinCare, OnePager avantages salariés, affiche A3 et flyers optionnels.' },
  { step: 3, title: 'Organisation du premier webinar', description: 'Animé par des experts certifiés selon la thématique. Durée 45 minutes : présentation du programme, explication de la thématique, Q&A. Enregistrement disponible en replay via Livestorm.' },
  { step: 4, title: 'Feedback', description: 'Retour sur le premier webinar pour s\'assurer que le contenu et la démarche sont en accord avec vos souhaits.' },
  { step: 5, title: 'Poursuite du programme', description: 'Poursuite selon les dates et thématiques convenues. Sans engagement, sans bande passante pour vos équipes.' },
];

export interface EmployeeAdvantage {
  title: string;
  description: string;
}

export const EMPLOYEE_ADVANTAGES: EmployeeAdvantage[] = [
  { title: 'Aide à la déclaration des revenus', description: 'Une permanence physique et virtuelle pour accompagner vos salariés dans leur déclaration de revenus. Des créneaux individuels pour répondre à leurs questions — si votre société est éligible.' },
  { title: 'Audit gratuit des contrats d\'assurance', description: 'Grâce à notre société sœur Assuralib, nous auditons gratuitement les contrats d\'assurance de vos salariés (crédits, habitation, véhicules, objets précieux) et leur proposons de meilleures offres si applicable.' },
  { title: 'Mise en relation avec des experts fiscalistes et comptables', description: 'Perlib travaille avec des notaires, avocats fiscalistes et experts comptables. Vos salariés bénéficient de notre réseau trié sur le volet pour leurs projets personnels.' },
  { title: 'Friends & Family', description: 'Vos salariés peuvent faire bénéficier leur réseau proche (foyer fiscal ou hors foyer fiscal) d\'un accompagnement personnalisé gratuit avec les mêmes avantages.' },
  { title: 'Offre de parrainage', description: '200€ pour le parrain et 200€ pour le filleul lors du parrainage d\'un collaborateur de la même société. Versement via Lydia Pro.' },
];

export interface KeyFigure {
  id: string;
  value: string;
  label: string;
}

export const KEY_FIGURES: KeyFigure[] = [
  { id: 'webinars', value: '90', label: 'webinars réalisés' },
  { id: 'inscrits', value: '5 000', label: 'inscrits sur tous les webinars' },
  { id: 'satisfaction', value: '95%', label: 'de satisfaction sur les webinars' },
  { id: 'thematiques', value: '25', label: 'thématiques différentes' },
  { id: 'entreprises', value: '40+', label: 'entreprises partenaires' },
  { id: 'accompagnes', value: '6 000', label: 'personnes accompagnées' },
  { id: 'avis', value: '4,9/5', label: 'sur près de 700 avis Google' },
];

export interface ClientLogoEntry {
  id: string;
  name: string;
  category: 'tech' | 'other';
}

export const CLIENT_LOGOS_BANK: ClientLogoEntry[] = [
  // Tech & Digital
  { id: 'palantir', name: 'Palantir', category: 'tech' },
  { id: 'salesforce', name: 'Salesforce', category: 'tech' },
  { id: 'meta', name: 'Meta', category: 'tech' },
  { id: 'hubspot', name: 'HubSpot', category: 'tech' },
  { id: 'apple', name: 'Apple', category: 'tech' },
  { id: 'molotov', name: 'Molotov.tv', category: 'tech' },
  { id: 'gartner', name: 'Gartner', category: 'tech' },
  { id: 'rakuten', name: 'Rakuten', category: 'tech' },
  { id: 'contentsquare', name: 'Contentsquare', category: 'tech' },
  { id: 'believe', name: 'Believe', category: 'tech' },
  { id: 'genetec', name: 'Genetec', category: 'tech' },
  { id: 'ibm', name: 'IBM', category: 'tech' },
  // Autres secteurs
  { id: 'epsa', name: 'EPSA', category: 'other' },
  { id: 'bureau_veritas', name: 'Bureau Veritas', category: 'other' },
  { id: 'wavestone', name: 'Wavestone', category: 'other' },
  { id: 'eurazeo', name: 'Eurazeo', category: 'other' },
  { id: 'thales', name: 'Thales', category: 'other' },
  { id: 'cushman', name: 'Cushman & Wakefield', category: 'other' },
  { id: 'lhh', name: 'LHH', category: 'other' },
];

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  verbatim: string;
  context: string;
  figures?: string;
  sector: 'tech' | 'other';
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'salesforce',
    name: 'Célia Parent',
    role: 'Responsable de la communication du CSE',
    company: 'Salesforce',
    figures: '12 webinars réalisés / 1 200 inscrits / 2 ans de partenariat / 8 thématiques',
    verbatim: "Nous avons choisi FinCare pour offrir à nos collaborateurs un accès simple et gratuit à des conseils de qualité, adaptés aux spécificités de Salesforce. L'accompagnement a été fluide, professionnel et clé en main. Les équipes Perlib se sont montrées disponibles et à l'écoute, avec une mise en place rapide. Les collaborateurs ont particulièrement apprécié la clarté et la pédagogie des webinaires, ainsi que l'aide concrète lors des rendez-vous sur l'imposition. FinCare apporte un programme d'éducation financière, complet et accessible à tous les collaborateurs, tout en allégeant considérablement le travail du CSE.",
    context: 'RSU et ESPP — valorisation des dispositifs de rémunération spécifiques',
    sector: 'tech',
  },
  {
    id: 'apple',
    name: 'Marie S.',
    role: 'Salariée',
    company: 'Apple Retail France',
    verbatim: "La pédagogie FinCare m'a permis de comprendre des concepts jusqu'alors très flous pour moi.",
    context: 'PERCO et PEE — 8 webinars réalisés. Bénéfice : arbitrage PEE/PERCO intégré par les salariés.',
    sector: 'tech',
  },
  {
    id: 'rakuten',
    name: 'Benjamin A.',
    role: 'Ressources Humaines',
    company: 'Rakuten France',
    verbatim: "Je suis particulièrement satisfait de la façon dont vous avez su simplifier des concepts financiers complexes pour nos salariés (et pour moi également), en facilitant ainsi leur compréhension.",
    context: 'Stock-options étrangers (Japon) — vulgarisation mécanisme et fiscalité.',
    sector: 'other',
  },
  {
    id: 'thales',
    name: 'Olivier D.',
    role: 'Membre du CSE',
    company: 'Thales',
    verbatim: "Nous sommes satisfaits de ce beau succès. Le nombre de participants au webinar témoigne de la pertinence de ce type de dispositif. Merci pour la qualité du contenu !",
    context: 'Fiscalité générale — webinar déclaration de revenus.',
    sector: 'other',
  },
];

export const BUSINESS_MODEL = {
  title: "La solution FinCare est 100% gratuite pour les entreprises et pour les salariés.",
  paragraphs: [
    "Perlib agit en tant que courtier indépendant agréé. Nous ne facturons ni les entreprises ni les salariés : notre rémunération provient exclusivement des partenaires financiers auprès desquels les salariés choisissent, s'ils le souhaitent, d'ouvrir un produit d'épargne ou d'investissement.",
    "Ces rémunérations sont intégrées aux frais existants des contrats et n'entraînent aucun surcoût pour le salarié — même au contraire, car nos protocoles leur permettent d'avoir des frais inférieurs que s'ils passaient en direct, avec en prime un accompagnement et un conseil sur le long terme.",
    "Notre indépendance garantit que nos conseils restent objectifs et alignés sur l'intérêt de chacun. Cette indépendance est contrôlée par les organismes régulateurs de notre profession (ACPR & AMF).",
  ],
};

export const PERLIB_INFO = {
  headline: "Perlib est la 1ère entreprise en France à proposer un programme d'éducation financière à destination des salariés sans budget.",
  keyFacts: [
    'Créé en 2021',
    '4,9/5 sur près de 700 avis Google',
    '6 000 personnes accompagnées',
    '40 collaborateurs et experts en finance personnelle',
  ],
  label: 'Perlib est un cabinet indépendant',
  subLabel: "Entreprise française réglementée et agrémentée auprès de l'ACPR, l'ORIAS & l'AMF",
  badges: ['Meilleur conseil épargne Challenges 2023', 'Challenges 2024', 'Challenges 2025', 'ORIAS', 'ACPR', 'AMF'],
};

export const LEGAL_FOOTER = "Document non contractuel. DBL PATRIMOINE (PERLIB) — capital social 15 070,2 € — n°894 514 736 R.C.S. Paris – code APE 66.22Z – 9 rue Weber, 75116 Paris. Établissement enregistré à l'ORIAS (21002727) en qualité de Conseiller en Investissements Financiers (membre LA COMPAGNIE CIF, agréée AMF), Courtier en assurance (membre CNCEF, agréée ACPR). Responsabilité civile et garantie financière souscrite auprès d'ASSURUP, garantie jusqu'à 1 500 000€ par sinistre.";

export const FINCARE_PILLARS = [
  { title: 'Webinars', description: "Des sessions live animées par des experts certifiés, sur des thématiques concrètes.", icon: '🎓' },
  { title: 'Ressources', description: "Modules interactifs, simulateurs et contenus pédagogiques accessibles 24/7.", icon: '📚' },
  { title: 'Experts', description: "Des rendez-vous individuels gratuits avec des conseillers financiers indépendants.", icon: '👨‍💼' },
];
