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

/**
 * Removes QA records left behind by testing.
 *
 * Deliberately narrow: it only matches TEST inside a *structured document
 * number* (invoice no, work order no, RMA, journal entry, serial). It used to
 * also match `leads.full_name LIKE '%Test%'`, `email LIKE '%test%'` and
 * `orders.full_name LIKE '%QA%'`, which would have deleted real customers -
 * "Testimony", "Latest Energy Ltd", anyone at a domain containing "test". Those
 * matchers are gone; customer-facing rows are never touched.
 *
 * Pass `{ dryRun: true }` to count what would be removed without deleting.
 */
export async function purgeAllMockData(
  opts: { dryRun?: boolean } = {},
): Promise<{ success: boolean; results: PurgeResult[]; message: string; dryRun: boolean }> {
  const dryRun = !!opts.dryRun;
  const results: PurgeResult[] = [];

  // table -> the document-number column that carries the TEST marker.
  const targets: Array<{ table: string; column: string }> = [
    { table: "invoices", column: "invoice_no" },
    { table: "work_orders", column: "work_order_no" },
    { table: "serial_numbers", column: "serial_no" },
    { table: "approval_requests", column: "request_no" },
    { table: "warranty_claims", column: "rma_number" },
    { table: "job_costing_records", column: "job_no" },
    { table: "engineer_commissions", column: "work_order_no" },
    { table: "journal_entries", column: "entry_no" },
  ];

  try {
    for (const { table, column } of targets) {
      const { data, error } = (await db
        .from(table)
        .select("id")
        .like(column, "%TEST%")) as { data: IdRow[] | null; error: any };
      // A table this install has not migrated yet is skipped, not fatal.
      if (error || !data || data.length === 0) continue;

      if (!dryRun) {
        const { error: delErr } = await db.from(table).delete().in("id", data.map((r) => r.id));
        if (delErr) throw delErr;
      }
      results.push({ table, count: data.length });
    }

    const totalCount = results.reduce((sum, r) => sum + r.count, 0);

    if (!dryRun && totalCount > 0) {
      // Attribute to whoever actually clicked. This used to hardcode
      // admin@tiogatechnologies.com, so the audit trail named the wrong person.
      // Never let a logging failure undo a completed purge.
      try {
        const { data: auth } = await supabase.auth.getUser();
        await db.from("audit_log").insert({
          actor_id: auth.user?.id ?? null,
          actor_email: auth.user?.email ?? null,
          action: "PURGE_MOCK_DATA",
          entity: "system",
          diff: { purged_breakdown: results, total_records: totalCount },
        });
      } catch (logErr) {
        console.error("purge audit log failed", logErr);
      }
    }

    return {
      success: true,
      results,
      dryRun,
      message: dryRun
        ? totalCount === 0
          ? "No QA test records found. Nothing to remove."
          : `Found ${totalCount} QA test record${totalCount === 1 ? "" : "s"} across ${results.length} table${results.length === 1 ? "" : "s"}.`
        : `Removed ${totalCount} QA test record${totalCount === 1 ? "" : "s"} across ${results.length} table${results.length === 1 ? "" : "s"}.`,
    };
  } catch (err: any) {
    return {
      success: false,
      results,
      dryRun,
      message: err?.message || "Failed to purge test data",
    };
  }
}
