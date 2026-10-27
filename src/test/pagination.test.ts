import { expect, it, vi } from "vitest";
import { fetchAllRows } from "../../supabase/functions/_shared/pagination";
it("reads records beyond the response cap", async () => {
  const rows = Array.from({ length: 2501 }, (_, id) => ({ id }));
  const page = vi.fn(async (from: number, to: number) => ({ data: rows.slice(from, to + 1), error: null }));
  expect(await fetchAllRows(page)).toEqual(rows);
  expect(page).toHaveBeenCalledTimes(3);
});
it("fails rather than returning partial financial data when a later page fails", async () => {
  await expect(fetchAllRows(async (from) => from === 0
    ? { data: Array(1000).fill({ id: 1 }), error: null }
    : { data: null, error: { message: "Database unavailable" } })).rejects.toThrow("Database unavailable");
});
