-- ==============================================================================
-- Tioga Technologies - Complete Reset of Test Orders, Invoices & Leads
-- ==============================================================================

-- 1. Wipe test orders and their related items/invoices/work orders
DELETE FROM public.order_items;
DELETE FROM public.invoices;
DELETE FROM public.work_orders;
DELETE FROM public.orders;

-- 2. Wipe sample leads, assessments, sizings
DELETE FROM public.leads;
DELETE FROM public.solar_assessments;
DELETE FROM public.lumivolt_sizings;
DELETE FROM public.quotes;
DELETE FROM public.custom_solution_requests;
DELETE FROM public.support_tickets;
DELETE FROM public.warranty_claims;

-- 3. Wipe all test tracking & analytics tables
DELETE FROM public.page_views;
DELETE FROM public.product_clicks;
DELETE FROM public.conversions;
DELETE FROM public.discount_redemptions;
DELETE FROM public.automation_runs;
