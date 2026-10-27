// Compatibility for older clients. Application INSERT now queues both messages
// transactionally; this endpoint must never enqueue duplicate notifications.
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
Deno.serve((req) => new Response(req.method === "OPTIONS" ? null : JSON.stringify({ ok: true, delivery: "database_queue" }), { headers }));
