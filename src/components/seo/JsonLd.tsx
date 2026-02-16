import { Helmet } from "react-helmet-async";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MyFinCare",
  url: "https://myfincare-perlib.lovable.app",
  logo: "https://myfincare-perlib.lovable.app/favicon.gif",
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
