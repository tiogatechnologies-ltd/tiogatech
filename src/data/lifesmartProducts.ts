// LifeSmart Hardware Catalog
import type { Product } from "./products";
import lifesmartJson from "./lifesmartProducts.json";

export const lifesmartProducts: Product[] = lifesmartJson as Product[];
export default lifesmartProducts;
