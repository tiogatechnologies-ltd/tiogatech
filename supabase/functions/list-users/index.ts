import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: ures, error: uerr } = await userClient.auth.getUser();
    if (uerr || !ures.user) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc("has_any_role", { _user_id: ures.user.id, _roles: ["admin", "staff"] });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Aggregate all auth users (paginate)
    const allUsers: any[] = [];
    let page = 1;
    while (page <= 50) {
      const { data: list, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      allUsers.push(...(list.users || []));
      if ((list.users || []).length < 200) break;
      page++;
    }

    const ids = allUsers.map((u) => u.id);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      admin.from("profiles").select("id, full_name, phone, avatar_url").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
      admin.from("user_roles").select("user_id, role").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
    ]);
    const pMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    const rMap: Record<string, string[]> = {};
    (roles || []).forEach((r: any) => { rMap[r.user_id] = [...(rMap[r.user_id] || []), r.role]; });

    const users = allUsers.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      full_name: pMap.get(u.id)?.full_name ?? (u.user_metadata?.full_name ?? u.user_metadata?.name ?? null),
      phone: pMap.get(u.id)?.phone ?? null,
      avatar_url: pMap.get(u.id)?.avatar_url ?? null,
      roles: rMap[u.id] || [],
    }));

    return new Response(JSON.stringify({ users }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
