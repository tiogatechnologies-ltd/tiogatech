/**
 * Human-readable, stable, collision-free product URLs:
 * e.g. "/product/deye-5kw-hybrid-inverter-sun-5k-sg03lp1-eu-00000001"
 */

export function kebab(input: string) {
  return (input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export function productSlug(product: { id: string; name: string }) {
  if (!product) return "";
  const cleanId = (product.id || "").replace(/[^a-zA-Z0-9]/g, "");
  // Take the LAST 8 characters of the ID (e.g. 00000001, 00000002, 00000035, or uuid suffix)
  // to ensure each product gets an unequivocally unique URL slug!
  const uniqueSuffix = cleanId.slice(-8) || "item";
  const nameKebab = kebab(product.name);
  return `${nameKebab}-${uniqueSuffix}`;
}

export function productPath(product: { id: string; name: string }) {
  return `/product/${productSlug(product)}`;
}

/** Extract the trailing unique suffix from a slug. */
export function idFragmentFromSlug(slug: string) {
  if (!slug) return "";
  const parts = slug.split("-");
  return parts[parts.length - 1] || "";
}

export function matchesSlug(product: { id: string; name: string }, slug: string) {
  if (!slug || !product) return false;
  const s = decodeURIComponent(slug).toLowerCase().trim();
  const pName = (product.name || "").toLowerCase().trim();
  const pId = (product.id || "").toLowerCase().trim();
  const pCleanId = pId.replace(/[^a-z0-9]/g, "");
  const pSlug = productSlug(product).toLowerCase();
  const pKebab = kebab(product.name);

  // 1. Direct match with full generated slug
  if (pSlug === s) return true;

  // 2. Direct match with raw product ID
  if (pId === s || pCleanId === s) return true;

  // 3. Exact match with kebab name
  if (pKebab === s) return true;

  // 4. Match via unique trailing 8 characters of ID
  const trailingSuffix = pCleanId.slice(-8);
  if (trailingSuffix && s.endsWith(trailingSuffix)) {
    const slugWithoutSuffix = s.slice(0, -trailingSuffix.length).replace(/-+$/, "");
    if (pKebab === slugWithoutSuffix) {
      return true;
    }
  }

  return false;
}
