/**
 * F2 — Shop Route Guard ("shop site only")
 *
 * Returns true only on storefront routes where retail shopping widgets
 * (WS6 social proof / trending and WS7 persistent "still deciding" reminder bar)
 * belong: `/retail`, `/retail/*`, `/catalog`, `/catalog/*`, and `/product/*`.
 *
 * Explicitly returns false for `/checkout`, `/admin/*`, marketing landing pages,
 * and legal/info routes so checkout and brand pages stay distraction-free.
 */
export function isShopRoute(pathname: string): boolean {
  if (!pathname) return false;
  const clean = pathname.split("?")[0].split("#")[0].toLowerCase().replace(/\/+$/, "") || "/";
  if (clean === "/checkout" || clean.startsWith("/checkout/")) return false;
  if (clean.startsWith("/admin")) return false;
  return (
    clean === "/retail" ||
    clean.startsWith("/retail/") ||
    clean === "/catalog" ||
    clean.startsWith("/catalog/") ||
    clean.startsWith("/product/")
  );
}

/**
 * Returns true when the visitor is currently on a product detail page (`/product/:slug`).
 */
export function isProductDetailRoute(pathname: string): boolean {
  if (!pathname) return false;
  const clean = pathname.split("?")[0].split("#")[0].toLowerCase();
  return clean.startsWith("/product/");
}
