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
  // Overview
  { key: "dashboard", label: "Dashboard", group: "Overview", path: "/admin", defaultRoles: ["staff"] },
  { key: "analytics", label: "Analytics", group: "Overview", path: "/admin/analytics", defaultRoles: ["staff"] },

  // Sales
  { key: "orders", label: "Orders", group: "Sales", path: "/admin/orders", defaultRoles: ["staff"] },
  { key: "customers", label: "Customers", group: "Sales", path: "/admin/customers", defaultRoles: ["staff"] },
  { key: "leads", label: "Leads", group: "Sales", path: "/admin/leads", defaultRoles: ["staff"] },
  { key: "tickets", label: "Support Tickets", group: "Sales", path: "/admin/tickets", defaultRoles: ["staff"] },
  { key: "discounts", label: "Discounts", group: "Sales", path: "/admin/discounts", defaultRoles: ["staff"] },
  { key: "waitlist", label: "App Waitlist", group: "Sales", path: "/admin/waitlist", defaultRoles: ["staff"] },

  // Finance
  { key: "finance_applications", label: "Finance Applications", group: "Finance", path: "/admin/finance/applications", defaultRoles: ["staff"] },
  { key: "finance_schedules", label: "Finance Schedules", group: "Finance", path: "/admin/finance/schedules", defaultRoles: ["staff"] },

  // Assessments
  { key: "assessments", label: "Solar Assessments", group: "Assessments", path: "/admin/assessments", defaultRoles: ["staff", "engineer"] },
  { key: "lumivolt_sizings", label: "LumiVolt Sizings", group: "Assessments", path: "/admin/lumivolt-sizings", defaultRoles: ["staff", "engineer"] },
  { key: "custom_requests", label: "Custom Requests", group: "Assessments", path: "/admin/custom-requests", defaultRoles: ["staff", "engineer"] },
  { key: "ai_subscriptions", label: "AI Subscriptions", group: "Assessments", path: "/admin/ai-subscriptions", defaultRoles: [] },
  { key: "ai_usage", label: "AI Credit Usage", group: "Assessments", path: "/admin/ai-usage", defaultRoles: ["staff"] },

  // Catalog
  { key: "products", label: "Products", group: "Catalog", path: "/admin/products", defaultRoles: ["staff"] },
  { key: "inventory", label: "Inventory", group: "Catalog", path: "/admin/inventory", defaultRoles: ["staff"] },
  { key: "solar_packages", label: "Solar Packages", group: "Catalog", path: "/admin/solar-packages", defaultRoles: ["staff"] },
  { key: "smart_locks", label: "Smart Locks", group: "Catalog", path: "/admin/smart-locks", defaultRoles: ["staff"] },
  { key: "home_automation", label: "Home Automation", group: "Catalog", path: "/admin/home-automation", defaultRoles: ["staff"] },

  // Content
  { key: "blog", label: "Blog", group: "Content", path: "/admin/blog", defaultRoles: ["staff"] },
  { key: "landing", label: "Landing Sections", group: "Content", path: "/admin/landing", defaultRoles: [] },
  { key: "content_pages", label: "Static Pages", group: "Content", path: "/admin/content", defaultRoles: [] },
  { key: "forms", label: "Form Builder", group: "Content", path: "/admin/forms", defaultRoles: [] },

  // Marketing
  { key: "newsletter", label: "Newsletter", group: "Marketing", path: "/admin/newsletter", defaultRoles: ["staff"] },
  { key: "email", label: "Email", group: "Marketing", path: "/admin/email", defaultRoles: ["staff"] },

  // Affiliates
  { key: "affiliates", label: "Affiliates", group: "Affiliates", path: "/admin/affiliates", defaultRoles: [] },
  { key: "affiliate_payouts", label: "Affiliate Payouts", group: "Affiliates", path: "/admin/affiliates/payouts", defaultRoles: [] },
  { key: "affiliate_analytics", label: "Affiliate Analytics", group: "Affiliates", path: "/admin/affiliates/analytics", defaultRoles: [] },

  // Careers
  { key: "careers", label: "Job Listings", group: "Careers", path: "/admin/careers", defaultRoles: [] },
  { key: "career_applications", label: "Career Applications", group: "Careers", path: "/admin/career-applications", defaultRoles: ["staff"] },

  // Tools
  { key: "reports", label: "Reports", group: "Tools", path: "/admin/reports", defaultRoles: ["staff"] },
  { key: "storage", label: "Media Library", group: "Tools", path: "/admin/storage", defaultRoles: ["staff", "engineer"] },

  // System (admin-only by default, but exposed for toggling)
  { key: "users", label: "Users & Roles", group: "System", path: "/admin/users", defaultRoles: [] },
  { key: "roles", label: "Role Permissions", group: "System", path: "/admin/roles", defaultRoles: [] },
  { key: "audit_log", label: "Audit Log", group: "System", path: "/admin/audit-log", defaultRoles: [] },
  { key: "settings", label: "Settings", group: "System", path: "/admin/settings", defaultRoles: [] },
];

// Path -> page_key mapping used by the sidebar and route guard.
export const PATH_TO_PAGE_KEY: Record<string, string> = Object.fromEntries([
  ...ADMIN_PAGES.map((page) => [page.path, page.key] as const),
  ["/staff", "dashboard"] as const,
]);

export const pagePathForKey = (pageKey: string): string | null =>
  ADMIN_PAGES.find((page) => page.key === pageKey)?.path ?? null;

export const pageKeyForPath = (path: string): string | null => {
  const base = path.split("?")[0];
  return PATH_TO_PAGE_KEY[base] ?? null;
};

// Base roles that are toggleable in the roles matrix (admin is always full).
export const BASE_TOGGLE_ROLES: AppRole[] = ["staff", "engineer", "affiliate"];
