import { Helmet } from "react-helmet-async";

const SITE_URL = "https://www.tiogatechnologies.com";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
  /** Keep private/utility pages (account, checkout, tokenised reports) out of search results. */
  noindex?: boolean;
}

const SEO = ({ title, description, path = "/", image, type = "website", jsonLd, noindex = false }: SEOProps) => {
  const url = `${SITE_URL}${path}`;
  const fullTitle = title.includes("Tioga") ? title : `${title} | Tioga Technologies`;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet defer={false}>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={noindex ? "noindex,follow" : "index,follow"} />
      <meta name="googlebot" content={noindex ? "noindex,follow" : "index,follow"} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Tioga Technologies" />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
