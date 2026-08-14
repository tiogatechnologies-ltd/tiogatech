// Central catalog of admin pages that can be toggled per role.
// page_key values are stable and used in the role_page_permissions table.

import type { AppRole } from "@/contexts/AuthContext";

export type AdminPage = {
  key: string;
  label: string;
  group: string;
  path: string;
  // Default access when no override row exists in role_page_permissions.
  // Admin is always allowed and is NOT included here.
  defaultRoles: AppRole[];
};

export const ADMIN_PAGES: AdminPage[] = [
  // 1. Overview & Analytics
  { key: "dashboard", label: "Dashboard", group: "Overview & Analytics", path: "/admin", defaultRoles: ["staff"] },
  { key: "analytics", label: "Analytics & Performance", group: "Overview & Analytics", path: "/admin/analytics", defaultRoles: ["staff"] },
  { key: "reports", label: "Executive Reports", group: "Overview & Analytics", path: "/admin/reports", defaultRoles: ["staff"] },
  { key: "approvals", label: "Enterprise Approvals", group: "Overview & Analytics", path: "/admin/approvals", defaultRoles: ["staff"] },

  // 2. Products & Energy Solutions
  { key: "products", label: "Products & Equipment", group: "Products & Solutions", path: "/admin/products", defaultRoles: ["staff"] },
  { key: "inventory", label: "Inventory & Serial Numbers", group: "Products & Solutions", path: "/admin/inventory", defaultRoles: ["staff"] },
  { key: "solar_packages", label: "Solar Turnkey Packages", group: "Products & Solutions", path: "/admin/solar-packages", defaultRoles: ["staff"] },
  { key: "smart_locks", label: "Smart Locks & Security", group: "Products & Solutions", path: "/admin/smart-locks", defaultRoles: ["staff"] },
  { key: "home_automation", label: "Home Automation Systems", group: "Products & Solutions", path: "/admin/home-automation", defaultRoles: ["staff"] },
  { key: "lumivolt_sizings", label: "LumiVolt Solar Sizings", group: "Products & Solutions", path: "/admin/lumivolt-sizings", defaultRoles: ["staff", "engineer"] },
  { key: "assessments", label: "Solar Energy Assessments", group: "Products & Solutions", path: "/admin/assessments", defaultRoles: ["staff", "engineer"] },
  { key: "custom_requests", label: "Custom Solution Inquiries", group: "Products & Solutions", path: "/admin/custom-requests", defaultRoles: ["staff", "engineer"] },

  // 3. Supply Chain & Field ERP
  { key: "warehouse", label: "Warehouses & Stock Hubs", group: "Supply Chain & Field ERP", path: "/admin/warehouse", defaultRoles: ["staff"] },
  { key: "work_orders", label: "Work Orders & Field Dispatch", group: "Supply Chain & Field ERP", path: "/admin/work-orders", defaultRoles: ["staff", "engineer"] },
  { key: "warranty", label: "Warranty Claims & OEM RMA", group: "Supply Chain & Field ERP", path: "/admin/warranty", defaultRoles: ["staff"] },

  // 4. Accounting, Finance & Billing
  { key: "invoices", label: "Tax Invoices & VAT (FIRS)", group: "Finance & Accounting", path: "/admin/invoices", defaultRoles: ["staff"] },
  { key: "accounting", label: "General Ledger & Accounts", group: "Finance & Accounting", path: "/admin/accounting", defaultRoles: ["staff"] },
  { key: "job_profitability", label: "Job Costing & Margins", group: "Finance & Accounting", path: "/admin/job-profitability", defaultRoles: ["staff"] },
  { key: "engineer_commissions", label: "Engineer HSE & Commissions", group: "Finance & Accounting", path: "/admin/engineer-commissions", defaultRoles: ["staff", "engineer"] },
  { key: "finance_applications", label: "Lease-to-Own Applications", group: "Finance & Accounting", path: "/admin/finance/applications", defaultRoles: ["staff"] },
  { key: "finance_schedules", label: "Repayment Schedules", group: "Finance & Accounting", path: "/admin/finance/schedules", defaultRoles: ["staff"] },

  // 5. Sales, CRM & Affiliates
  { key: "orders", label: "Orders & Fulfillment", group: "Sales, CRM & Affiliates", path: "/admin/orders", defaultRoles: ["staff"] },
  { key: "leads", label: "CRM Leads Pipeline", group: "Sales, CRM & Affiliates", path: "/admin/leads", defaultRoles: ["staff"] },
  { key: "customers", label: "Customer Directory", group: "Sales, CRM & Affiliates", path: "/admin/customers", defaultRoles: ["staff"] },
  { key: "quotes", label: "Proposals & Quotations", group: "Sales, CRM & Affiliates", path: "/admin/quotes", defaultRoles: ["staff"] },
  { key: "reviews", label: "Product Reviews", group: "Sales, CRM & Affiliates", path: "/admin/reviews", defaultRoles: ["staff"] },
  { key: "discounts", label: "Discounts & Promo Codes", group: "Sales, CRM & Affiliates", path: "/admin/discounts", defaultRoles: ["staff"] },
  { key: "affiliates", label: "Affiliate Partners", group: "Sales, CRM & Affiliates", path: "/admin/affiliates", defaultRoles: [] },
  { key: "affiliate_payouts", label: "Affiliate Payouts", group: "Sales, CRM & Affiliates", path: "/admin/affiliates/payouts", defaultRoles: [] },
  { key: "affiliate_analytics", label: "Affiliate Analytics", group: "Sales, CRM & Affiliates", path: "/admin/affiliates/analytics", defaultRoles: [] },
  { key: "tickets", label: "Support Tickets & SLA", group: "Sales, CRM & Affiliates", path: "/admin/tickets", defaultRoles: ["staff"] },
  { key: "waitlist", label: "Product Waitlist", group: "Sales, CRM & Affiliates", path: "/admin/waitlist", defaultRoles: ["staff"] },

  // 6. Marketing, Content & Careers
  { key: "blog", label: "Blog & Knowledge Base", group: "Marketing & Content", path: "/admin/blog", defaultRoles: ["staff"] },
  { key: "newsletter", label: "Newsletter Subscribers", group: "Marketing & Content", path: "/admin/newsletter", defaultRoles: ["staff"] },
  { key: "email", label: "Email Studio & Campaigns", group: "Marketing & Content", path: "/admin/email", defaultRoles: ["staff"] },
  { key: "email_status", label: "Email Delivery Logs", group: "Marketing & Content", path: "/admin/email-status", defaultRoles: ["staff"] },
  { key: "careers", label: "Job Openings", group: "Marketing & Content", path: "/admin/careers", defaultRoles: [] },
  { key: "career_applications", label: "Career Applications", group: "Marketing & Content", path: "/admin/career-applications", defaultRoles: ["staff"] },
  { key: "landing", label: "Landing Sections", group: "Marketing & Content", path: "/admin/landing", defaultRoles: [] },
  { key: "content_pages", label: "Static Web Pages", group: "Marketing & Content", path: "/admin/content", defaultRoles: [] },
  { key: "forms", label: "Form Builder", group: "Marketing & Content", path: "/admin/forms", defaultRoles: [] },
  { key: "storage", label: "Media & Cloud Storage", group: "Marketing & Content", path: "/admin/storage", defaultRoles: ["staff", "engineer"] },

  // 7. Staff, RBAC & System Administration
  { key: "users", label: "Staff & User Management", group: "System & Staff Administration", path: "/admin/users", defaultRoles: [] },
  { key: "roles", label: "Role Permissions Matrix", group: "System & Staff Administration", path: "/admin/roles", defaultRoles: [] },
  { key: "automations", label: "System Automations", group: "System & Staff Administration", path: "/admin/automations", defaultRoles: [] },
  { key: "audit_log", label: "Audit Trail Log", group: "System & Staff Administration", path: "/admin/audit-log", defaultRoles: [] },
  { key: "ai_subscriptions", label: "AI Subscriptions", group: "System & Staff Administration", path: "/admin/ai-subscriptions", defaultRoles: [] },
  { key: "ai_usage", label: "AI Credit Consumption", group: "System & Staff Administration", path: "/admin/ai-usage", defaultRoles: ["staff"] },
  { key: "settings", label: "Website & System Settings", group: "System & Staff Administration", path: "/admin/settings", defaultRoles: [] },
];

// Path -> page_key mapping used by the sidebar and route guard.
export const PATH_TO_PAGE_KEY: Record<string, string> = Object.fromEntries([
  ...ADMIN_PAGES.map((page) => [page.path, page.key] as const),
  ["/staff", "dashboard"] as const,
]);

export const pageKeyForPath = (path: string): string | null => {
  const base = path.split("?")[0];
  return PATH_TO_PAGE_KEY[base] ?? null;
};

export const BASE_TOGGLE_ROLES: AppRole[] = ["staff", "engineer", "affiliate", "customer"];

export const defaultAllowedForRole = (pageKey: string, role: AppRole): boolean => {
  if (role === "admin") return true;
  const page = ADMIN_PAGES.find((p) => p.key === pageKey);
  if (!page) return false;
  return page.defaultRoles.includes(role);
};
