/**
 * Pages through a PostgREST query until every row has been fetched.
 *
 * PostgREST silently caps a response at its `max-rows` setting. Anything that
 * SUMS or COUNTS fetched rows client-side - dashboard revenue, customer order
 * totals - therefore starts reporting quietly wrong numbers once a table grows
 * past that cap, with nothing on screen to indicate it. Ranged paging keeps
 * those aggregates correct without needing a database function.
 *
 * Use this only for aggregates. For anything that just renders a list, prefer a
 * plain `.limit()` plus a visible "showing X of Y" notice - fetching an
 * unbounded list into the browser is not something to make easy.
 */

const PAGE_SIZE = 1000;
/** Stops a runaway query from pulling an unbounded amount into memory. */
const MAX_PAGES = 25;

type RangeQuery<T> = {
  range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>;
};

export async function fetchAllRows<T>(
  buildQuery: () => RangeQuery<T>,
  { pageSize = PAGE_SIZE, maxPages = MAX_PAGES } = {},
): Promise<{ rows: T[]; truncated: boolean }> {
  const rows: T[] = [];

  for (let page = 0; page < maxPages; page++) {
    const from = page * pageSize;
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error || !data) break;
    rows.push(...data);
    // A short page means we reached the end.
    if (data.length < pageSize) return { rows, truncated: false };
  }

  // Hit the page ceiling with full pages throughout - there may be more.
  return { rows, truncated: true };
}
