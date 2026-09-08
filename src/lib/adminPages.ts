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
  { key: "approvals", label: "Approval Workflows", group: "Overview & Analytics", path: "/admin/approvals", defaultRoles: ["staff"] },

  // 2. Products & Energy Solutions
  { key: "products", label: "All Products", group: "Catalog & Inventory", path: "/admin/products", defaultRoles: ["staff"] },
  { key: "inventory", label: "Retail Stock Levels", group: "Catalog & Inventory", path: "/admin/inventory", defaultRoles: ["staff"] },
  { key: "solar_packages", label: "Solar Packages (3kVA-20kVA)", group: "Catalog & Inventory", path: "/admin/solar-packages", defaultRoles: ["staff"] },
  { key: "smart_locks", label: "Smart Locks & Security", group: "Catalog & Inventory", path: "/admin/smart-locks", defaultRoles: ["staff"] },
  { key: "home_automation", label: "Home Automation Systems", group: "Catalog & Inventory", path: "/admin/home-automation", defaultRoles: ["staff"] },
  { key: "cctv_packages", label: "CCTV & Surveillance", group: "Catalog & Inventory", path: "/admin/cctv-packages", defaultRoles: ["staff"] },
  { key: "lumivolt_sizings", label: "LumiVolt Sizings", group: "Sales, Orders & CRM", path: "/admin/lumivolt-sizings", defaultRoles: ["staff", "engineer"] },
  { key: "assessments", label: "Solar Energy Assessments", group: "Sales, Orders & CRM", path: "/admin/assessments", defaultRoles: ["staff", "engineer"] },
  { key: "custom_requests", label: "Custom Project Requests", group: "Sales, Orders & CRM", path: "/admin/custom-requests", defaultRoles: ["staff", "engineer"] },

  // 3. Supply Chain & Field ERP
  { key: "warehouse", label: "Warehouses & Serials", group: "Catalog & Inventory", path: "/admin/warehouse", defaultRoles: ["staff"] },
  { key: "work_orders", label: "Work Orders & Dispatch", group: "Operations & Field Service", path: "/admin/work-orders", defaultRoles: ["staff", "engineer"] },
  { key: "warranty", label: "Warranty Claims & OEM RMA", group: "Operations & Field Service", path: "/admin/warranty", defaultRoles: ["staff"] },

  // 4. Accounting, Finance & Billing
  { key: "invoices", label: "Invoices & VAT (FIRS)", group: "Finance & Accounting", path: "/admin/invoices", defaultRoles: ["staff"] },
  { key: "accounting", label: "General Ledger & P&L", group: "Finance & Accounting", path: "/admin/accounting", defaultRoles: ["staff"] },
  { key: "job_profitability", label: "Job Costing & Margins", group: "Finance & Accounting", path: "/admin/job-profitability", defaultRoles: ["staff"] },
  { key: "engineer_commissions", label: "Engineer HSE & Bonuses", group: "Operations & Field Service", path: "/admin/engineer-commissions", defaultRoles: ["staff", "engineer"] },
  { key: "finance_applications", label: "Finance Applications", group: "Finance & Accounting", path: "/admin/finance/applications", defaultRoles: ["staff"] },
  { key: "finance_schedules", label: "Repayment Schedules", group: "Finance & Accounting", path: "/admin/finance/schedules", defaultRoles: ["staff"] },

  // 5. Sales, CRM & Affiliates
  { key: "orders", label: "Orders & Fulfillment", group: "Sales, Orders & CRM", path: "/admin/orders", defaultRoles: ["staff"] },
  { key: "leads", label: "CRM Leads Pipeline", group: "Sales, Orders & CRM", path: "/admin/leads", defaultRoles: ["staff"] },
  { key: "customers", label: "Customer Directory", group: "Sales, Orders & CRM", path: "/admin/customers", defaultRoles: ["staff"] },
  { key: "quotes", label: "Quotations & Proposals", group: "Sales, Orders & CRM", path: "/admin/quotes", defaultRoles: ["staff"] },
  { key: "reviews", label: "Product Reviews", group: "Catalog & Inventory", path: "/admin/reviews", defaultRoles: ["staff"] },
  { key: "discounts", label: "Discounts & Promo Codes", group: "Sales, Orders & CRM", path: "/admin/discounts", defaultRoles: ["staff"] },
  { key: "affiliates", label: "Affiliate Partners", group: "Sales, Orders & CRM", path: "/admin/affiliates", defaultRoles: [] },
  { key: "affiliate_payouts", label: "Affiliate Payouts", group: "Sales, Orders & CRM", path: "/admin/affiliates/payouts", defaultRoles: [] },
  { key: "affiliate_analytics", label: "Affiliate Analytics", group: "Sales, Orders & CRM", path: "/admin/affiliates/analytics", defaultRoles: [] },
  { key: "tickets", label: "Support Tickets & SLA", group: "Sales, Orders & CRM", path: "/admin/tickets", defaultRoles: ["staff"] },
  { key: "waitlist", label: "Early Access Waitlist", group: "Marketing & Content", path: "/admin/waitlist", defaultRoles: ["staff"] },

  // 6. Marketing, Content & Careers
  { key: "blog", label: "Blog & Knowledge Base", group: "Marketing & Content", path: "/admin/blog", defaultRoles: ["staff"] },
  { key: "newsletter", label: "Newsletter Subscribers", group: "Marketing & Content", path: "/admin/newsletter", defaultRoles: ["staff"] },
  { key: "email", label: "Email Broadcasts", group: "Marketing & Content", path: "/admin/email", defaultRoles: ["staff"] },
  { key: "email_status", label: "Delivery Status Logs", group: "Marketing & Content", path: "/admin/email-status", defaultRoles: ["staff"] },
  { key: "careers", label: "Job Listings", group: "Marketing & Content", path: "/admin/careers", defaultRoles: [] },
  { key: "career_applications", label: "Candidate Applications", group: "Marketing & Content", path: "/admin/career-applications", defaultRoles: ["staff"] },
  { key: "landing", label: "Landing Sections", group: "Marketing & Content", path: "/admin/landing", defaultRoles: [] },
  { key: "retail_promotions", label: "Storefront Hero & Flash Deals", group: "Catalog & Inventory", path: "/admin/retail-promotions", defaultRoles: ["staff"] },
  { key: "content_pages", label: "Static Web Pages", group: "Marketing & Content", path: "/admin/content", defaultRoles: [] },
  { key: "forms", label: "Form Builder", group: "Marketing & Content", path: "/admin/forms", defaultRoles: [] },
  { key: "storage", label: "Media & Cloud Storage", group: "Marketing & Content", path: "/admin/storage", defaultRoles: ["staff", "engineer"] },

  // 7. Staff, RBAC & System Administration
  { key: "users", label: "Staff & User Management", group: "Staff & Administration", path: "/admin/users", defaultRoles: [] },
  { key: "roles", label: "Role Permissions Matrix", group: "Staff & Administration", path: "/admin/roles", defaultRoles: [] },
  { key: "automations", label: "System Automations", group: "Staff & Administration", path: "/admin/automations", defaultRoles: [] },
  { key: "audit_log", label: "Audit Trail Log", group: "Staff & Administration", path: "/admin/audit-log", defaultRoles: [] },
  { key: "ai_subscriptions", label: "AI Subscriptions", group: "Staff & Administration", path: "/admin/ai-subscriptions", defaultRoles: [] },
  { key: "ai_usage", label: "Credit Consumption", group: "Staff & Administration", path: "/admin/ai-usage", defaultRoles: ["staff"] },
  { key: "settings", label: "Website & System Settings", group: "Staff & Administration", path: "/admin/settings", defaultRoles: [] },
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
