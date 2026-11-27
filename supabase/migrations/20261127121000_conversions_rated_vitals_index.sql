-- Fast reads of web-vitals rows for the admin Performance tab.
--
-- Until 27 Nov 2026 usePageTracker wrote an unrated LCP/CLS "vitals" row on
-- every PerformanceObserver callback (up to ~240 per session, ~2,500 a day),
-- alongside the proper once-per-page-load rows from initWebVitals, which carry
-- metadata.rating. The admin page now reads only the rated rows, but without
-- an index Postgres must walk past every unrated row for each page of results,
-- and anything beyond the first ~1,000 rows of a 30-day range hit the
-- statement timeout. This partial index holds only the rated rows, in the
-- order the page reads them. It changes no data.
--
-- CONCURRENTLY is omitted because migrations run inside a transaction; the
-- index is small (rated rows only), so the build lock is brief.

CREATE INDEX IF NOT EXISTS idx_conversions_rated_vitals
  ON public.conversions (created_at DESC, id DESC)
  WHERE event_type = 'vitals' AND (metadata->>'rating') IS NOT NULL;

-- Optional clean-up, NOT run by this migration: the legacy unrated rows are
-- duplicates of the rated ones and are no longer read anywhere. Deleting them
-- shrinks the table substantially. It cannot be undone, so run it by hand only
-- if you are sure:
--
--   DELETE FROM public.conversions
--   WHERE event_type = 'vitals' AND (metadata->>'rating') IS NULL;
