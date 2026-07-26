import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { ADMIN_PAGES, pageKeyForPath } from "@/lib/adminPages";

type OverrideRow = { role_key: string; page_key: string; allowed: boolean };

/**
 * Computes the set of admin page_keys the current user is allowed to see.
 * Rules:
 *  - Admin => all pages.
 *  - For each page: default access = union of defaultRoles ∩ user roles.
 *    Then apply overrides from role_page_permissions: allowed=true grants,
 *    allowed=false revokes. Any grant wins over any revoke across the user's roles.
 *  - Custom role assignment (user_custom_roles) contributes its own role_key
 *    for overrides, inheriting the base_role's defaults as a floor.
 */
export const usePagePermissions = () => {
  const { user, roles, isAdmin, rolesLoaded } = useAuth();
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [customRoleKey, setCustomRoleKey] = useState<string | null>(null);
  const [customBaseRole, setCustomBaseRole] = useState<AppRole | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const [permsRes, myCustomRes] = await Promise.all([
        supabase.from("role_page_permissions").select("role_key,page_key,allowed"),
        user
          ? supabase
              .from("user_custom_roles")
              .select("custom_role_key, custom_roles(base_role)")
              .eq("user_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      setOverrides((permsRes.data ?? []) as OverrideRow[]);
      const cr: any = myCustomRes && "data" in myCustomRes ? myCustomRes.data : null;
      setCustomRoleKey(cr?.custom_role_key ?? null);
      setCustomBaseRole((cr?.custom_roles?.base_role ?? null) as AppRole | null);
    } catch (err) {
      console.warn("Failed to load page permissions", err);
    } finally {
      setLoaded(true);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const effectiveRoleKeys: string[] = useMemo(() => [
    ...roles.map((r) => r as string),
    ...(customRoleKey ? [customRoleKey] : []),
  ], [roles, customRoleKey]);

  const canPage = useCallback((pageKey: string): boolean => {
    if (isAdmin) return true;
    const page = ADMIN_PAGES.find((p) => p.key === pageKey);
    if (!page) return true; // unknown page: don't block

    // Baseline from defaults intersected with user's real roles (plus custom base_role).
    const baseline = page.defaultRoles.some((r) =>
      roles.includes(r) || (customBaseRole ? customBaseRole === r : false)
    );

    // Overrides for any effective role key
    const relevant = overrides.filter(
      (o) => o.page_key === pageKey && effectiveRoleKeys.includes(o.role_key)
    );
    if (relevant.some((o) => o.allowed === true)) return true;
    if (relevant.some((o) => o.allowed === false)) return false;
    return baseline;
  }, [isAdmin, roles, customBaseRole, overrides, effectiveRoleKeys]);

  const allowedPages = useMemo(
    () => ADMIN_PAGES.filter((page) => canPage(page.key)),
    [canPage]
  );

  const canPath = useCallback((path: string): boolean => {
    const key = pageKeyForPath(path);
    if (!key) return true;
    return canPage(key);
  }, [canPage]);

  return { canPage, canPath, allowedPages, loaded: loaded && rolesLoaded, reload: load };
};

export default usePagePermissions;
