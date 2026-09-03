import { supabase } from "@/integrations/supabase/client";

// These ERP tables are created by the staged migrations but are not present
// in the generated client type map. Keep the maintenance utility resilient
// without weakening the types used by the rest of the application.
const db = supabase as any;
type IdRow = { id: string };

export interface PurgeResult {
  table: string;
  count: number;
}

export async function purgeAllMockData(): Promise<{ success: boolean; results: PurgeResult[]; message: string }> {
  const results: PurgeResult[] = [];

  try {
    // 1. Purge Test Invoices
    const { data: invs } = await db.from("invoices").select("id").like("invoice_no", "%TEST%") as { data: IdRow[] | null };
    if (invs && invs.length > 0) {
      await db.from("invoices").delete().in("id", invs.map((i) => i.id));
      results.push({ table: "invoices", count: invs.length });
    }

    // 2. Purge Test Work Orders
    const { data: wos } = await db.from("work_orders").select("id").like("work_order_no", "%TEST%") as { data: IdRow[] | null };
    if (wos && wos.length > 0) {
      await db.from("work_orders").delete().in("id", wos.map((w) => w.id));
      results.push({ table: "work_orders", count: wos.length });
    }

    // 3. Purge Test Serials
    const { data: sns } = await db.from("serial_numbers").select("id").like("serial_no", "%TEST%") as { data: IdRow[] | null };
    if (sns && sns.length > 0) {
      await db.from("serial_numbers").delete().in("id", sns.map((s) => s.id));
      results.push({ table: "serial_numbers", count: sns.length });
    }

    // 4. Purge Test Approvals
    const { data: aprs } = await db.from("approval_requests").select("id").like("request_no", "%TEST%") as { data: IdRow[] | null };
    if (aprs && aprs.length > 0) {
      await db.from("approval_requests").delete().in("id", aprs.map((a) => a.id));
      results.push({ table: "approval_requests", count: aprs.length });
    }

    // 5. Purge Test RMA & Warranty Claims
    const { data: rmas } = await supabase.from("warranty_claims").select("id").or("rma_number.like.%TEST%,customer_email.like.%test%,product_name.like.%TEST%");
    if (rmas && rmas.length > 0) {
      await supabase.from("warranty_claims").delete().in("id", rmas.map((r) => r.id));
      results.push({ table: "warranty_claims", count: rmas.length });
    }

    // 6. Purge Test Job Costing
    const { data: jobs } = await db.from("job_costing_records").select("id").or("job_no.like.%TEST%,work_order_no.like.%TEST%") as { data: IdRow[] | null };
    if (jobs && jobs.length > 0) {
      await db.from("job_costing_records").delete().in("id", jobs.map((j) => j.id));
      results.push({ table: "job_costing_records", count: jobs.length });
    }

    // 7. Purge Test Engineer Commissions
    const { data: comms } = await db.from("engineer_commissions").select("id").or("work_order_no.like.%TEST%,work_order_no.like.%9999%") as { data: IdRow[] | null };
    if (comms && comms.length > 0) {
      await db.from("engineer_commissions").delete().in("id", comms.map((c) => c.id));
      results.push({ table: "engineer_commissions", count: comms.length });
    }

    // 8. Purge Test Journal Entries
    const { data: jrns } = await db.from("journal_entries").select("id").like("entry_no", "%TEST%") as { data: IdRow[] | null };
    if (jrns && jrns.length > 0) {
      await db.from("journal_entries").delete().in("id", jrns.map((j) => j.id));
      results.push({ table: "journal_entries", count: jrns.length });
    }

    // 9. Purge Test Leads
    const { data: leads } = await supabase.from("leads").select("id").or("email.like.%test%,full_name.like.%Test%,phone.eq.+2348000000000");
    if (leads && leads.length > 0) {
      await supabase.from("leads").delete().in("id", leads.map((l) => l.id));
      results.push({ table: "leads", count: leads.length });
    }

    // 10. Purge Test Orders
    const { data: orders } = await supabase.from("orders").select("id").or("email.like.%test%,full_name.like.%QA%");
    if (orders && orders.length > 0) {
      await supabase.from("orders").delete().in("id", orders.map((o) => o.id));
      results.push({ table: "orders", count: orders.length });
    }

    // 11. Purge Test Support Tickets
    const { data: tickets } = await supabase.from("support_tickets").select("id").or("user_name.like.%Test%,subject.like.%QA%");
    if (tickets && tickets.length > 0) {
      await supabase.from("support_tickets").delete().in("id", tickets.map((t) => t.id));
      results.push({ table: "support_tickets", count: tickets.length });
    }

    // Log the purge to audit_log
    const totalCount = results.reduce((sum, r) => sum + r.count, 0);
      await supabase.from("audit_log").insert({
      actor_email: "admin@tiogatechnologies.com",
      action: "PURGE_MOCK_DATA",
      entity: "system",
      diff: { purged_breakdown: results, total_records: totalCount },
    });

    return {
      success: true,
      results,
      message: `Successfully purged ${totalCount} mock and test records across ${results.length} database tables.`,
    };
  } catch (err: any) {
    return {
      success: false,
      results,
      message: err.message || "Failed to purge mock data",
    };
  }
}
