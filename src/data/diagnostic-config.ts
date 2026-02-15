/**
 * Configuration CMS du Diagnostic Myfincare
 * Toute la logique du questionnaire est pilotée par cette structure.
 */

export interface DiagnosticOption {
  label: string;
  points: number;
}

export interface DiagnosticQuestion {
  id: string;
  label: string;
  info?: string;
  options: DiagnosticOption[];
}

export interface DiagnosticSection {
  id: string;
  title: string;
  icon: string;
  description?: string;
  interstitial: string;
  questions: DiagnosticQuestion[];
}

export interface DiagnosticResultThreshold {
  min: number;
  max: number;
  level: 'critical' | 'warning' | 'good' | 'excellent';
  title: string;
  description: string;
  emoji: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface DiagnosticConfig {
  config: {
    showTimer: boolean;
    allowBack: boolean;
    title: string;
    subtitle: string;
  };
  sections: DiagnosticSection[];
  results: DiagnosticResultThreshold[];
}

export const diagnosticConfig: DiagnosticConfig = {
  config: {
    showTimer: true,
    allowBack: true,
    title: "Diagnostic Financier",
    subtitle: "Évaluez votre santé financière en 5 minutes",
  },
  sections: [
    {
      id: "quotidien",
      title: "Gestion du Quotidien",
      icon: "Wallet",
      description: "Comment gérez-vous votre budget au jour le jour ?",
      interstitial: "Bravo ! Votre base est solide, passons à la suite.",
      questions: [
        {
          id: "q1",
          label: "Suivez-vous vos dépenses mensuelles ?",
          info: "Le suivi permet d'identifier les fuites de trésorerie et d'optimiser votre budget.",
          options: [
            { label: "Jamais", points: 0 },
            { label: "De temps en temps", points: 1 },
            { label: "Chaque mois environ", points: 3 },
            { label: "Rigoureusement", points: 4 },
          ],
        },
        {
          id: "q2",
          label: "Êtes-vous à découvert en fin de mois ?",
          info: "Le découvert bancaire entraîne des frais et révèle un déséquilibre budgétaire.",
          options: [
            { label: "Souvent", points: 0 },
            { label: "Parfois", points: 1 },
            { label: "Rarement", points: 3 },
            { label: "Jamais", points: 4 },
          ],
        },
        {
          id: "q3",
          label: "Connaissez-vous le montant exact de vos charges fixes ?",
          info: "Connaître ses charges fixes est la première étape d'une gestion budgétaire saine.",
          options: [
            { label: "Pas du tout", points: 0 },
            { label: "Approximativement", points: 2 },
            { label: "Oui, précisément", points: 4 },
          ],
        },
        {
          id: "q4",
          label: "Avez-vous automatisé votre épargne (virement programmé) ?",
          info: "L'épargne automatique supprime le biais de procrastination et sécurise votre avenir.",
          options: [
            { label: "Non", points: 0 },
            { label: "J'y pense", points: 1 },
            { label: "Oui, un petit montant", points: 3 },
            { label: "Oui, un montant significatif", points: 4 },
          ],
        },
        {
          id: "q5",
          label: "Savez-vous combien il vous reste à vivre après vos charges ?",
          info: "Le reste à vivre est un indicateur clé pour évaluer votre marge de manœuvre financière.",
          options: [
            { label: "Aucune idée", points: 0 },
            { label: "Vaguement", points: 1 },
            { label: "Oui, je le calcule", points: 4 },
          ],
        },
      ],
    },
    {
      id: "securite",
      title: "Sécurité Financière",
      icon: "Shield",
      description: "Êtes-vous protégé face aux aléas de la vie ?",
      interstitial: "Parfait ! Voyons maintenant votre niveau d'endettement.",
      questions: [
        {
          id: "q6",
          label: "Disposez-vous d'une épargne de précaution ?",
          info: "L'épargne de précaution couvre 3 à 6 mois de dépenses en cas d'imprévu.",
          options: [
            { label: "Non, aucune", points: 0 },
            { label: "Moins d'1 mois de dépenses", points: 1 },
            { label: "Entre 1 et 3 mois", points: 3 },
            { label: "Plus de 3 mois", points: 4 },
          ],
        },
        {
          id: "q7",
          label: "Pourriez-vous faire face à une dépense imprévue de 1 000 € ?",
          info: "Cela mesure votre résilience financière face à un imprévu courant.",
          options: [
            { label: "Impossible", points: 0 },
            { label: "Difficilement", points: 1 },
            { label: "Sans problème", points: 4 },
          ],
        },
        {
          id: "q8",
          label: "Avez-vous souscrit une prévoyance (incapacité, invalidité) ?",
          info: "La prévoyance protège vos revenus en cas d'arrêt de travail prolongé.",
          options: [
            { label: "Je ne sais pas ce que c'est", points: 0 },
            { label: "Non, pas encore", points: 1 },
            { label: "Oui, via mon employeur", points: 3 },
            { label: "Oui, avec un contrat personnel", points: 4 },
          ],
        },
        {
          id: "q9",
          label: "Avez-vous une assurance décès / garantie emprunteur ?",
          info: "Elle protège vos proches en cas de décès et sécurise vos crédits.",
          options: [
            { label: "Non", points: 0 },
            { label: "Je ne suis pas sûr(e)", points: 1 },
            { label: "Oui", points: 4 },
          ],
        },
        {
          id: "q10",
          label: "Révisez-vous régulièrement vos contrats (assurance, banque) ?",
          info: "Renégocier ses contrats peut générer des économies substantielles.",
          options: [
            { label: "Jamais", points: 0 },
            { label: "Rarement", points: 1 },
            { label: "Tous les 2-3 ans", points: 3 },
            { label: "Chaque année", points: 4 },
          ],
        },
      ],
    },
    {
      id: "endettement",
      title: "Gestion de l'Endettement",
      icon: "CreditCard",
      description: "Maîtrisez-vous vos crédits et votre taux d'endettement ?",
      interstitial: "Bien joué ! Place à l'investissement et la croissance.",
      questions: [
        {
          id: "q11",
          label: "Connaissez-vous votre taux d'endettement ?",
          info: "Le taux d'endettement ne doit idéalement pas dépasser 35% de vos revenus.",
          options: [
            { label: "Non", points: 0 },
            { label: "Approximativement", points: 2 },
            { label: "Oui, précisément", points: 4 },
          ],
        },
        {
          id: "q12",
          label: "Avez-vous des crédits à la consommation en cours ?",
          info: "Les crédits conso ont des taux élevés qui pèsent sur votre capacité d'épargne.",
          options: [
            { label: "Oui, plusieurs", points: 0 },
            { label: "Oui, un seul", points: 2 },
            { label: "Non, aucun", points: 4 },
          ],
        },
        {
          id: "q13",
          label: "Utilisez-vous le paiement fractionné (BNPL) ?",
          info: "Le paiement fractionné peut masquer un endettement croissant.",
          options: [
            { label: "Régulièrement", points: 0 },
            { label: "Occasionnellement", points: 2 },
            { label: "Jamais", points: 4 },
          ],
        },
        {
          id: "q14",
          label: "Savez-vous ce qu'est le TAEG d'un crédit ?",
          info: "Le TAEG (Taux Annuel Effectif Global) est le coût réel total d'un crédit.",
          options: [
            { label: "Non", points: 0 },
            { label: "Vaguement", points: 2 },
            { label: "Oui, je compare toujours", points: 4 },
          ],
        },
        {
          id: "q15",
          label: "Connaissez-vous le taux de votre crédit immobilier ?",
          info: "Connaître son taux permet d'évaluer si une renégociation est avantageuse.",
          options: [
            { label: "Je n'ai pas de crédit immo", points: 2 },
            { label: "Non, je ne sais plus", points: 0 },
            { label: "Oui", points: 4 },
          ],
        },
      ],
    },
    {
      id: "investissement",
      title: "Investissement & Croissance",
      icon: "TrendingUp",
      description: "Faites-vous fructifier votre argent intelligemment ?",
      interstitial: "Excellent ! Dernière ligne droite : votre vision long terme.",
      questions: [
        {
          id: "q16",
          label: "Profitez-vous de votre épargne salariale (PEE, PERCO) ?",
          info: "L'épargne salariale offre des avantages fiscaux et un abondement employeur.",
          options: [
            { label: "Je n'en ai pas / ne sais pas", points: 0 },
            { label: "J'ai un plan mais ne l'utilise pas", points: 1 },
            { label: "Oui, je verse régulièrement", points: 4 },
          ],
        },
        {
          id: "q17",
          label: "Captez-vous 100% de l'abondement de votre employeur ?",
          info: "L'abondement est de l'argent gratuit. Ne pas le capter, c'est perdre du salaire.",
          options: [
            { label: "Je ne sais pas ce que c'est", points: 0 },
            { label: "Non, pas entièrement", points: 2 },
            { label: "Oui, au maximum", points: 4 },
          ],
        },
        {
          id: "q18",
          label: "Savez-vous quel est l'impact de l'inflation sur votre épargne ?",
          info: "Une épargne qui ne bat pas l'inflation perd de la valeur chaque année.",
          options: [
            { label: "Non, pas vraiment", points: 0 },
            { label: "J'en ai conscience", points: 2 },
            { label: "Oui, j'agis en conséquence", points: 4 },
          ],
        },
        {
          id: "q19",
          label: "Diversifiez-vous vos placements ?",
          info: "La diversification réduit le risque global de votre patrimoine.",
          options: [
            { label: "Tout est sur mon livret A", points: 0 },
            { label: "J'ai 2-3 supports différents", points: 2 },
            { label: "Oui, multi-supports (actions, immo, etc.)", points: 4 },
          ],
        },
        {
          id: "q20",
          label: "Connaissez-vous votre profil de risque ?",
          info: "Votre profil de risque détermine les placements adaptés à votre situation.",
          options: [
            { label: "Non", points: 0 },
            { label: "Vaguement", points: 2 },
            { label: "Oui, il est défini", points: 4 },
          ],
        },
      ],
    },
    {
      id: "futur",
      title: "Vision Long Terme",
      icon: "Compass",
      description: "Préparez-vous sereinement votre avenir financier ?",
      interstitial: "",
      questions: [
        {
          id: "q21",
          label: "Avez-vous commencé à préparer votre retraite ?",
          info: "Plus vous commencez tôt, plus l'effet des intérêts composés est puissant.",
          options: [
            { label: "Pas du tout", points: 0 },
            { label: "J'y pense", points: 1 },
            { label: "Oui, j'ai un plan", points: 3 },
            { label: "Oui, avec un PER ou assurance-vie", points: 4 },
          ],
        },
        {
          id: "q22",
          label: "Connaissez-vous votre Tranche Marginale d'Imposition (TMI) ?",
          info: "Votre TMI détermine l'efficacité de nombreuses stratégies d'optimisation fiscale.",
          options: [
            { label: "Non", points: 0 },
            { label: "Approximativement", points: 2 },
            { label: "Oui, précisément", points: 4 },
          ],
        },
        {
          id: "q23",
          label: "Utilisez-vous des dispositifs d'optimisation fiscale ?",
          info: "PER, dons, investissements Pinel... de nombreux leviers existent pour réduire votre impôt.",
          options: [
            { label: "Non, aucun", points: 0 },
            { label: "Un ou deux", points: 2 },
            { label: "Oui, j'optimise activement", points: 4 },
          ],
        },
        {
          id: "q24",
          label: "Avez-vous réfléchi à la transmission de votre patrimoine ?",
          info: "Anticiper la transmission permet de réduire significativement les droits de succession.",
          options: [
            { label: "Pas du tout", points: 0 },
            { label: "J'y réfléchis", points: 2 },
            { label: "Oui, c'est organisé", points: 4 },
          ],
        },
        {
          id: "q25",
          label: "Quel est votre niveau de stress financier ?",
          info: "Le stress financier impacte la santé et la prise de décision. Le réduire est un objectif en soi.",
          options: [
            { label: "Très élevé", points: 0 },
            { label: "Modéré", points: 2 },
            { label: "Faible", points: 3 },
            { label: "Serein(e)", points: 4 },
          ],
        },
      ],
    },
  ],
  results: [
    {
      min: 0,
      max: 25,
      level: "critical",
      title: "Situation fragile",
      emoji: "🔴",
      description:
        "Votre situation financière présente des risques importants. Nous vous recommandons de consulter un expert pour sécuriser vos bases : budget, épargne de précaution et endettement.",
      ctaText: "Consulter un expert",
      ctaUrl: "/employee/rdv",
    },
    {
      min: 26,
      max: 50,
      level: "warning",
      title: "Des fondations à consolider",
      emoji: "🟠",
      description:
        "Vous avez posé quelques bases, mais des zones de vulnérabilité subsistent. Concentrez-vous sur l'automatisation de votre épargne et la maîtrise de votre endettement.",
    },
    {
      min: 51,
      max: 75,
      level: "good",
      title: "Bonne gestion",
      emoji: "🟢",
      description:
        "Vous maîtrisez bien les fondamentaux. Pour passer au niveau supérieur, travaillez sur la diversification de vos investissements et l'optimisation fiscale.",
    },
    {
      min: 76,
      max: 100,
      level: "excellent",
      title: "Excellente maîtrise",
      emoji: "🏆",
      description:
        "Félicitations ! Votre santé financière est remarquable. Continuez à optimiser et pensez à la transmission patrimoniale pour pérenniser vos acquis.",
    },
  ],
};
