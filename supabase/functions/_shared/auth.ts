// Caller checks for edge functions that must not be reachable by anonymous
// visitors. The public anon key ships in the site's JavaScript, so a function
// that merely has `verify_jwt = true` is still callable by anyone on the
// internet - gate the dangerous ones with this instead.
import { createClient } from "npm:@supabase/supabase-js@2";

const deny = (corsHeaders: Record<string, string>, error: string, status: number) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/**
 * Lets the request through when it comes from another edge function using the
 * service-role key, or from a signed-in admin/staff user. Otherwise returns the
 * Response to send back (401/403). Returns null when the caller is allowed.
 */
export async function requireServiceOrStaff(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return deny(corsHeaders, "Missing auth", 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) return deny(corsHeaders, "Server configuration error", 500);

  if (token === serviceKey) return null;

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: ures } = await userClient.auth.getUser();
  if (!ures?.user) return deny(corsHeaders, "Invalid session", 401);

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: isStaff } = await admin.rpc("has_any_role", {
    _user_id: ures.user.id,
    _roles: ["admin", "staff"],
  });
  if (!isStaff) return deny(corsHeaders, "Forbidden", 403);
  return null;
}

/** Escapes text for safe interpolation into an HTML email body. */
export const escapeHtml = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
