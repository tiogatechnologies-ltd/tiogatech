import { lazy, Suspense } from "react";
import { useProductCompare } from "@/hooks/useProductCompare";

// The tray's actual UI (plus the full product catalog + a live Supabase
// fetch it needs for the "add another model" picker) is a separate chunk,
// loaded only once there's something to show. This wrapper is mounted
// unconditionally on every page (see App.tsx), so it must stay cheap - no
// catalog import, no network call - for the common case of an empty tray.
const ProductCompareTrayBody = lazy(() => import("./ProductCompareTrayBody"));

export const ProductCompareTray = () => {
  const { count, isOpen } = useProductCompare();
  if (count === 0 && !isOpen) return null;

  return (
    <Suspense fallback={null}>
      <ProductCompareTrayBody />
    </Suspense>
  );
};

export default ProductCompareTray;
