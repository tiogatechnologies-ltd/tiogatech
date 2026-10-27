// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, expect, it } from "vitest";

// Exercise the actual migration and PostgreSQL triggers/RPCs, not mocked money
// calculations. Supabase auth and its existing email queue are fixture boundaries.
let db: PGlite;
const affiliate = "00000000-0000-4000-8000-000000000001";
const user = "00000000-0000-4000-8000-000000000002";
const buyer = "buyer@example.com";
async function actor(admin = false) {
  await db.query("SELECT set_config('test.user_id',$1,false),set_config('test.is_admin',$2,false)", [user, String(admin)]);
}
async function value(sql: string, args: unknown[] = []) {
  return (await db.query<Record<string, any>>(sql, args)).rows[0];
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE TYPE public.app_role AS ENUM ('admin','affiliate','customer');
    CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.user_id',true),'')::uuid $$;
    CREATE FUNCTION public.has_role(uuid,public.app_role) RETURNS boolean LANGUAGE sql AS $$ SELECT current_setting('test.is_admin',true)='true' $$;
    CREATE TABLE public.user_roles(user_id uuid,role public.app_role,UNIQUE(user_id,role));
    CREATE TABLE public.site_settings(key text PRIMARY KEY,value jsonb);
    CREATE TABLE public.careers(deadline text DEFAULT '30th May, 2026');
    ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
    CREATE TABLE public.affiliates(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),email text,code text,commission_rate numeric(5,2),status text DEFAULT 'active',payout_details text,created_at timestamptz DEFAULT now());
    CREATE TABLE public.affiliate_links(id uuid,slug text,affiliate_id uuid);
    CREATE TABLE public.leads(affiliate_code text);
    CREATE TABLE public.orders(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),email text,total numeric,affiliate_code text,affiliate_link_slug text,payment_status text,created_at timestamptz DEFAULT now());
    CREATE TABLE public.affiliate_payouts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),affiliate_id uuid,period_start date,period_end date,lead_count integer,revenue_total numeric,commission_total numeric,amount numeric,status text,payment_reference text,notes text,created_at timestamptz DEFAULT now());
    CREATE TABLE public.affiliate_payout_requests(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),affiliate_id uuid,amount numeric,status text,note text,admin_note text,decided_by uuid,decided_at timestamptz,payout_id uuid,created_at timestamptz DEFAULT now());
    GRANT ALL ON public.affiliate_payout_requests TO authenticated;
    CREATE FUNCTION public.current_affiliate_id() RETURNS uuid LANGUAGE sql SECURITY DEFINER AS $$
      SELECT a.id FROM public.affiliates a JOIN auth.users u ON lower(u.email)=lower(a.email) WHERE u.id=auth.uid() AND u.email_confirmed_at IS NOT NULL LIMIT 1
    $$;
    CREATE TABLE public.career_applications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),full_name text,role_title text,email text,phone text);
    CREATE TABLE public.test_email_queue(payload jsonb);
    CREATE TABLE public.email_send_log(message_id text,template_name text,recipient_email text,status text);
    CREATE FUNCTION public.enqueue_email(text,jsonb) RETURNS void LANGUAGE plpgsql AS $$ BEGIN
      IF current_setting('test.queue_fail',true)='true' THEN RAISE EXCEPTION 'queue unavailable'; END IF;
      INSERT INTO public.test_email_queue VALUES($2);
    END $$;
    INSERT INTO auth.users VALUES('${user}','partner@example.com',now());
    INSERT INTO public.affiliates(id,email,code,commission_rate,payout_details) VALUES('${affiliate}','partner@example.com','partner',10,'Partner / 1234567890');
    INSERT INTO public.orders(email,total,affiliate_code,payment_status) VALUES('${buyer}',1000000,'PARTNER','paid');
  `);
  await db.exec(readFileSync(new URL("../../supabase/migrations/20261027130000_affiliate_career_reliability.sql", import.meta.url), "utf8"));
  await actor();
}, 30000);
afterAll(async () => { await db?.close(); });

it("backfills access and grants it for approval-before-signup and signup-before-approval", async () => {
  expect((await value("SELECT count(*)::integer n FROM user_roles WHERE role='affiliate'")).n).toBe(1);
  await db.exec(`
    INSERT INTO affiliates(email,code,commission_rate) VALUES('new@example.com','new',10);
    INSERT INTO auth.users VALUES(gen_random_uuid(),'new@example.com',NULL);
  `);
  expect((await value("SELECT count(*)::integer n FROM user_roles WHERE role='affiliate'")).n).toBe(1);
  await db.exec("UPDATE auth.users SET email_confirmed_at=now() WHERE email='new@example.com'");
  expect((await value("SELECT count(*)::integer n FROM user_roles WHERE role='affiliate'")).n).toBe(2);
  await db.exec("INSERT INTO auth.users VALUES(gen_random_uuid(),'approved-later@example.com',now()); INSERT INTO affiliates(email,code,commission_rate) VALUES('approved-later@example.com','later',5)");
  expect((await value("SELECT count(*)::integer n FROM user_roles WHERE role='affiliate'")).n).toBe(3);
});

it("freezes historical and new order commissions across affiliate rate changes", async () => {
  await db.exec(`UPDATE affiliates SET commission_rate=5 WHERE id='${affiliate}'`);
  expect(Number((await value("SELECT affiliate_commission_amount amount FROM orders LIMIT 1")).amount)).toBe(100000);
  const order = await value("INSERT INTO orders(email,total,affiliate_code,payment_status) VALUES($1,100000,'partner','pending') RETURNING id,affiliate_commission_rate rate",[buyer]);
  expect(Number(order.rate)).toBe(5);
  await db.exec(`UPDATE affiliates SET commission_rate=20 WHERE id='${affiliate}'`);
  await db.query("UPDATE orders SET payment_status='paid',total=200000 WHERE id=$1",[order.id]);
  expect(Number((await value("SELECT affiliate_commission_amount amount FROM orders WHERE id=$1",[order.id])).amount)).toBe(10000);
  await db.query("UPDATE orders SET total=300000,affiliate_commission_amount=999999 WHERE id=$1",[order.id]);
  expect(Number((await value("SELECT affiliate_commission_amount amount FROM orders WHERE id=$1",[order.id])).amount)).toBe(10000);
  await db.query("UPDATE orders SET payment_status='refunded' WHERE id=$1",[order.id]);
});

it("rejects self-referrals and invalid codes even when submitted through REST", async () => {
  const self = await value("INSERT INTO orders(email,total,affiliate_code,payment_status) VALUES('partner@example.com',100000,'partner','paid') RETURNING affiliate_code");
  expect(self.affiliate_code).toBeNull();
  const invalid = await value("INSERT INTO orders(email,total,affiliate_code,payment_status) VALUES($1,100000,'missing','paid') RETURNING affiliate_code",[buyer]);
  expect(invalid.affiliate_code).toBeNull();
});

it("reserves funds once, refuses overdraw, and approves retries idempotently", async () => {
  await actor();
  const first = await value("SELECT request_affiliate_payout(80000,NULL) result");
  expect(first.result.available).toBe(20000);
  await expect(db.query("SELECT request_affiliate_payout(80000,NULL)")).rejects.toThrow(/exceeds/);
  await expect(db.query("SELECT request_affiliate_payout(9999,NULL)")).rejects.toThrow(/Minimum/);
  await expect(db.query("SELECT approve_affiliate_payout_request($1)",[first.result.request.id])).rejects.toThrow(/Admin/);
  await actor(true);
  const payout = await value("SELECT approve_affiliate_payout_request($1) id",[first.result.request.id]);
  const retry = await value("SELECT approve_affiliate_payout_request($1) id",[first.result.request.id]);
  expect(retry.id).toBe(payout.id);
  expect((await value("SELECT count(*)::integer n FROM affiliate_payouts")).n).toBe(1);
  expect(Number((await value("SELECT affiliate_balance($1) available",[affiliate])).available)).toBe(20000);
  await expect(db.query("UPDATE affiliate_payouts SET status='paid' WHERE id=$1",[payout.id])).rejects.toThrow(/payment reference/);
  await db.query("UPDATE affiliate_payouts SET status='paid',payment_reference='TX-123' WHERE id=$1",[payout.id]);
});

it("rechecks live balances, rejects stale manual payouts, and has no REST request bypass", async () => {
  await expect(db.query("SELECT create_affiliate_payout($1,current_date,current_date,30000,NULL)",[affiliate])).rejects.toThrow(/exceeds/);
  await expect(db.query("INSERT INTO affiliate_payouts(affiliate_id,amount,status) VALUES($1,30000,'approved')",[affiliate])).rejects.toThrow(/exceeds/);
  const privileges = await value("SELECT has_table_privilege('authenticated','affiliate_payout_requests','INSERT') can_insert,has_table_privilege('authenticated','affiliate_payout_requests','UPDATE') can_update");
  expect(privileges.can_insert).toBe(false);
  expect(privileges.can_update).toBe(false);
  const request = await value("SELECT request_affiliate_payout(20000,NULL) result");
  await value("SELECT reject_affiliate_payout_request($1,'Bank details need review')",[request.result.request.id]);
  expect(Number((await value("SELECT affiliate_balance($1) available",[affiliate])).available)).toBe(20000);
});

it("aggregates more than 1000 orders inside PostgreSQL", async () => {
  await db.exec(`INSERT INTO orders(email,total,affiliate_code,payment_status)
    SELECT 'bulk@example.com',1000,'partner','paid' FROM generate_series(1,1100)`);
  const summary = await value("SELECT calculate_affiliate_payout($1,current_date,current_date) result",[affiliate]);
  expect(summary.result.leads).toBe(1101);
  expect(summary.result.commission).toBe(320000);
});

it("queues both career emails atomically, escapes applicant text and rolls back on queue failure", async () => {
  await db.exec("INSERT INTO career_applications(full_name,role_title,email,phone) VALUES('<script>','Engineer','candidate@example.com','123456789')");
  const rows = (await db.query<{payload: any}>("SELECT payload FROM test_email_queue")).rows;
  expect(rows).toHaveLength(2);
  expect(rows[0].payload.to).toBe("careers@tiogatechnologies.com");
  expect(rows[1].payload.to).toBe("candidate@example.com");
  expect(rows[1].payload.html).toContain("&lt;script&gt;");
  await db.exec("SELECT set_config('test.queue_fail','true',false)");
  await expect(db.exec("INSERT INTO career_applications(full_name,role_title,email,phone) VALUES('Failure','Engineer','failure@example.com','123456789')")).rejects.toThrow(/queue unavailable/);
  expect((await value("SELECT count(*)::integer n FROM career_applications")).n).toBe(1);
  await db.exec("SELECT set_config('test.queue_fail','false',false)");
});
