import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "staff" | "affiliate" | "customer" | "user" | "engineer";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  isAdmin: boolean;
  isStaff: boolean;
  isAffiliate: boolean;
  loading: boolean;
  rolesLoaded: boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  roles: [],
  isAdmin: false,
  isStaff: false,
  isAffiliate: false,
  loading: true,
  rolesLoaded: false,
  hasRole: () => false,
  hasAnyRole: () => false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoaded, setRolesLoaded] = useState(false);

  const loadUserData = useCallback(async (userId: string) => {
    try {
      const [rolesRes, profileRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      ]);
      setRoles(rolesRes.data ? rolesRes.data.map((r: any) => r.role as AppRole) : []);
      if (profileRes.data) setProfile(profileRes.data as Profile);
    } catch (err) {
      console.error("Failed to load user data:", err);
      setRoles([]);
      setProfile(null);
    } finally {
      setRolesLoaded(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error?.message?.toLowerCase().includes("refresh")) {
          await supabase.auth.signOut().catch(() => {});
        }
        if (!mounted) return;
        const u = session?.user ?? null;
        setUser(u);
        if (u) await loadUserData(u.id);
        else setRolesLoaded(true);
        console.warn("Auth init failed, clearing session:", err?.message);
        await supabase.auth.signOut().catch(() => {});
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadUserData(u.id);
      } else {
        setRoles([]);
        setProfile(null);
      }
      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN" || event === "SIGNED_OUT") {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);


  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);
  const hasAnyRole = useCallback((rs: AppRole[]) => rs.some((r) => roles.includes(r)), [roles]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: fullName ? { full_name: fullName } : undefined,
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRoles([]);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await loadUserData(user.id);
  };

  const isAdmin = roles.includes("admin");
  const isStaff = isAdmin || roles.includes("staff");
  const isAffiliate = roles.includes("affiliate");

  return (
    <AuthContext.Provider value={{ user, profile, roles, isAdmin, isStaff, isAffiliate, loading, hasRole, hasAnyRole, signIn, signUp, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
