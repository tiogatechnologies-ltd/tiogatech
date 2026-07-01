import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_drive";
const FOLDER_NAME = "Tioga Backups";

const TABLES = [
  "profiles", "user_roles", "orders", "order_items", "products", "solar_packages",
  "home_automation_packages", "smart_locks", "blog_posts", "leads",
  "finance_applications", "finance_schedules", "solar_assessments",
  "lumivolt_sizings", "newsletter_subscribers", "affiliates", "affiliate_payouts",
  "landing_content", "careers", "career_applications", "site_settings",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth check — caller must be admin
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) throw new Error("Unauthorized");
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) throw new Error("Admin only");

    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GDRIVE_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY") || Deno.env.get("GOOGLE_MAIL_API_KEY");
    if (!LOVABLE_KEY || !GDRIVE_KEY) throw new Error("Google Drive connector not configured. Connect Google Drive first.");

    // Dump all tables
    const dump: Record<string, any> = { generated_at: new Date().toISOString(), tables: {} };
    for (const t of TABLES) {
      const { data, error } = await (supabase as any).from(t).select("*");
      dump.tables[t] = error ? { error: error.message } : data;
    }
    const filename = `tioga-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const body = JSON.stringify(dump, null, 2);
    const sizeBytes = new TextEncoder().encode(body).length;

    // Find or create folder
    const authHeaders = { Authorization: `Bearer ${LOVABLE_KEY}`, "X-Connection-Api-Key": GDRIVE_KEY };
    const listRes = await fetch(
      `${GATEWAY}/drive/v3/files?q=${encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`)}&fields=files(id,name)`,
      { headers: authHeaders }
    );
    const listJson = await listRes.json();
    let folderId = listJson.files?.[0]?.id;
    if (!folderId) {
      const create = await fetch(`${GATEWAY}/drive/v3/files`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
      });
      folderId = (await create.json()).id;
    }

    // Multipart upload
    const boundary = "tioga_backup_" + Date.now();
    const metadata = { name: filename, parents: [folderId], mimeType: "application/json" };
    const multipart =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;

    const upload = await fetch(`${GATEWAY}/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": `multipart/related; boundary=${boundary}` },
      body: multipart,
    });
    if (!upload.ok) throw new Error(`Drive upload failed: ${upload.status} ${await upload.text()}`);
    const uploadJson = await upload.json();

    await supabase.from("backups_log").insert({
      filename, drive_file_id: uploadJson.id, drive_web_link: uploadJson.webViewLink,
      size_bytes: sizeBytes, tables_count: TABLES.length,
      status: "success", triggered_by: userData.user.email,
    });

    return new Response(JSON.stringify({ ok: true, file_id: uploadJson.id, web_link: uploadJson.webViewLink }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("backup-to-drive error:", e);
    try {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await supabase.from("backups_log").insert({
        filename: `failed-${Date.now()}.json`, status: "failed", error_message: String(e?.message || e),
      });
    } catch {}
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
