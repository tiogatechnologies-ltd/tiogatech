/**
 * Human-readable, stable product URLs: "/product/lumivolt-5kva-hybrid-inverter-1a2b3c4d".
 * The trailing 8 hex chars of the product UUID keep the slug unique without
 * needing a slug column in the database.
 */

export function kebab(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function productSlug(product: { id: string; name: string }) {
  return `${kebab(product.name)}-${product.id.replace(/-/g, "").slice(0, 8)}`;
}

export function productPath(product: { id: string; name: string }) {
  return `/product/${productSlug(product)}`;
}

/** Extract the id fragment from a slug so we can match it against a product list. */
export function idFragmentFromSlug(slug: string) {
  const last = slug.split("-").pop() ?? "";
  return /^[0-9a-f]{8}$/.test(last) ? last : "";
}

export function matchesSlug(product: { id: string; name: string }, slug: string) {
  const frag = idFragmentFromSlug(slug);
  if (frag) return product.id.replace(/-/g, "").slice(0, 8) === frag;
  return kebab(product.name) === slug;
}
