import { Helmet } from "react-helmet-async";

interface AdminSEOProps {
  title: string;
}

/**
 * Lightweight SEO tag for admin/private routes.
 * Sets a unique title and forces noindex,nofollow so admin pages don't pollute search results.
 */
const AdminSEO = ({ title }: AdminSEOProps) => (
  <Helmet>
    <title>{`${title} | Tioga Admin`}</title>
    <meta name="robots" content="noindex,nofollow" />
    <meta name="description" content="Tioga Technologies internal admin area. Not for public access." />
    <meta property="og:title" content={`${title} | Tioga Admin`} />
    <meta property="og:description" content="Internal admin area." />
  </Helmet>
);

export default AdminSEO;
