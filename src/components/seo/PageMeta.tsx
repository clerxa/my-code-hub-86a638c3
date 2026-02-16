import { Helmet } from "react-helmet-async";

interface PageMetaProps {
  title: string;
  description: string;
  path?: string;
  type?: string;
  noindex?: boolean;
}

const BASE_URL = "https://myfincare-perlib.lovable.app";
const OG_IMAGE = `${BASE_URL}/og-image.png`;

export const PageMeta = ({
  title,
  description,
  path = "/",
  type = "website",
  noindex = false,
}: PageMetaProps) => {
  const fullTitle = title.includes("MyFinCare") ? title : `${title} – MyFinCare`;
  const url = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={OG_IMAGE} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE} />
    </Helmet>
  );
};
