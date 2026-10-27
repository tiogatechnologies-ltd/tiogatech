# Affiliate and careers reliability release

The database changes and five Edge Functions were deployed on 27 October 2026.
The website is released through the existing GitHub-to-Vercel production integration.

## Database rollout

The live database already contained the prerequisite schema despite incomplete
historical migration records. The two migrations in this release were applied
individually and registered as applied. Older, unrelated migration history was
left unchanged; do not replay that backlog without comparing it to the live schema.

The new migration is
`supabase/migrations/20261027130000_affiliate_career_reliability.sql`.
The accompanying `20261027143000_career_deadlines_and_email_worker.sql` closes
the four expired May listings and schedules the outbound email worker.
It requires the existing affiliates, orders, payout requests, careers, verified
affiliate identity helpers and email queue infrastructure. It executes as one
transaction. Take the usual database backup before applying the release.

The pre-deployment check found zero affiliate accounts, zero referred paid orders
and zero payout records, so no historical commission baseline needed adjustment.
For future installations, existing orders have no historical commission-rate record. The migration freezes
their earnings using each affiliate's rate at migration time; it cannot recover
previous rates that were changed before this release. Review that baseline before
applying it to accounts with historical rate changes.

New orders capture the rate when the referral is assigned and freeze the commission
amount when first marked paid. Refunded orders stop contributing to earnings.
All request creation and approval now run through database transactions. Older
clients cannot bypass the balance checks by inserting requests directly.

## Application rollout

Apply the database migration first, then deploy these Edge Functions together:

- `affiliate-payout-request`
- `affiliate-portal`
- `affiliate-statement`
- `notify-career-application` (compatibility endpoint; the database queues mail)

The worker uses CRON_SHARED_SECRET and matching encrypted Vault configuration;
its scheduled invocation returned HTTP 200. No secret is stored in the cron command.

Then publish the frontend. The new frontend requires the new database RPCs and
commission columns. The role backfill covers existing verified users; users
already signed in should sign out and back in to refresh their role list.

Career application inserts now enqueue the hiring alert and applicant receipt in
the same transaction. Verify that the existing `process-email-queue` scheduled job
is active and that its email transport is configured. The worker owns retries and
delivery logs; its dead-letter queue must be monitored for permanent failures.
No production applications or emails were created during local verification.

## Verification

- `npm test` includes embedded PostgreSQL tests that execute the actual migration,
  role triggers, payout RPCs, commission snapshots and transactional email enqueue.
- `npm run typecheck`
- `npm run build`
- Start the local development server and run
  `node scripts/check-affiliate-careers.mjs`. Set `TEST_BROWSER_CHANNEL=msedge`
  to use installed Edge, or install Playwright Chromium. Every remote request is
  mocked or blocked. The browser checks careers outage handling, application
  dialogs, recorded commissions, marketing downloads, mobile width and stale
  payout-calculation invalidation.

Embedded PostgreSQL tests verify transaction behaviour in one database instance;
they do not replace a multi-connection concurrency smoke test on staging or a
real email delivery check after deployment.

## Production verification, 27 October 2026

- A private pre-deployment backup was saved outside the repository.
- The primary migration passed a live rollback dry run before being applied.
- Live transaction tests verified role assignment, overdraw prevention, idempotent
  request approval, reservation transfer and both career email queue entries.
- All synthetic test records and test email queue entries were rolled back.
- The email worker is scheduled every minute; its first scheduled call succeeded.
- Four expired listings were closed; the rolling Graphics Designer role stays open.
- At the owner's subsequent request, migration `20261027150000` reopens those
  four vacancies with blank deadlines, displayed as "Open until filled".
- Local verification passed 91 tests, type checking, production build and browser
  checks of careers, affiliate assets, mobile width and stale payout calculations.
