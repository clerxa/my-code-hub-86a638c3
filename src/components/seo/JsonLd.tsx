import { Helmet } from "react-helmet-async";

const BASE_URL = "https://myfincare-perlib.lovable.app";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MyFinCare",
  url: BASE_URL,
  logo: `${BASE_URL}/favicon.gif`,
  description:
    "MyFinCare est le programme d'éducation financière B2B qui renforce la marque employeur et accompagne les collaborateurs vers une meilleure maîtrise de leurs finances.",
  foundingDate: "2024",
  sameAs: [],
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MyFinCare",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
  description:
    "Application d'éducation financière pour les salariés : modules interactifs, simulateurs, rendez-vous experts et accompagnement personnalisé.",
};

const homepageFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Qu'est-ce que MyFinCare apporte à mon entreprise ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "MyFinCare renforce votre politique sociale et réduit le stress financier de vos collaborateurs. Résultat : moins de turnover, plus d'engagement et un avantage différenciant, que vous soyez une direction d'entreprise ou un CSE.",
      },
    },
    {
      "@type": "Question",
      name: "Combien de temps faut-il pour déployer MyFinCare ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Le déploiement se fait en quelques jours. Aucune intégration technique n'est nécessaire : nous configurons la plateforme, vous communiquez auprès de vos collaborateurs.",
      },
    },
    {
      "@type": "Question",
      name: "Les données de mes salariés sont-elles protégées ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolument. Les données financières personnelles sont chiffrées et strictement confidentielles. En tant qu'employeur, vous n'avez accès qu'aux indicateurs agrégés et anonymisés.",
      },
    },
    {
      "@type": "Question",
      name: "Quel est le coût pour l'entreprise ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "MyFinCare fonctionne sur un modèle d'abonnement par structure (entreprise ou CSE). Le programme est entièrement gratuit pour les collaborateurs. Contactez-nous pour un devis adapté à la taille de votre effectif.",
      },
    },
    {
      "@type": "Question",
      name: "Comment mesurer le retour sur investissement ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Votre tableau de bord entreprise affiche en temps réel le taux d'adoption, la satisfaction, le nombre de rendez-vous experts et les indicateurs d'engagement — des métriques directement corrélées à la réduction du turnover.",
      },
    },
  ],
};

export const JsonLdOrganization = () => (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify(organizationSchema)}
    </script>
  </Helmet>
);

export const JsonLdSoftware = () => (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify(softwareSchema)}
    </script>
  </Helmet>
);

export const JsonLdFaq = () => (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify(homepageFaqSchema)}
    </script>
  </Helmet>
);
