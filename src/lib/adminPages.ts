// Central catalog of admin pages that can be toggled per role.
// page_key values are stable and used in the role_page_permissions table.

import type { AppRole } from "@/contexts/AuthContext";

export type AdminPage = {
  key: string;
  label: string;
  group: string;
  // Default access when no override row exists in role_page_permissions.
  // Admin is always allowed and is NOT included here.
  defaultRoles: AppRole[];
};

export const ADMIN_PAGES: AdminPage[] = [
  // Overview
  { key: "dashboard", label: "Dashboard", group: "Overview", defaultRoles: ["staff"] },
  { key: "analytics", label: "Analytics", group: "Overview", defaultRoles: ["staff"] },

  // Sales
  { key: "orders", label: "Orders", group: "Sales", defaultRoles: ["staff"] },
  { key: "customers", label: "Customers", group: "Sales", defaultRoles: ["staff"] },
  { key: "leads", label: "Leads", group: "Sales", defaultRoles: ["staff"] },
  { key: "tickets", label: "Support Tickets", group: "Sales", defaultRoles: ["staff"] },
  { key: "discounts", label: "Discounts", group: "Sales", defaultRoles: ["staff"] },
  { key: "waitlist", label: "App Waitlist", group: "Sales", defaultRoles: ["staff"] },

  // Finance
  { key: "finance_applications", label: "Finance Applications", group: "Finance", defaultRoles: ["staff"] },
  { key: "finance_schedules", label: "Finance Schedules", group: "Finance", defaultRoles: ["staff"] },

  // Assessments
  { key: "assessments", label: "Solar Assessments", group: "Assessments", defaultRoles: ["staff", "engineer"] },
  { key: "lumivolt_sizings", label: "LumiVolt Sizings", group: "Assessments", defaultRoles: ["staff", "engineer"] },
  { key: "custom_requests", label: "Custom Requests", group: "Assessments", defaultRoles: ["staff", "engineer"] },
  { key: "ai_subscriptions", label: "AI Subscriptions", group: "Assessments", defaultRoles: [] },
  { key: "ai_usage", label: "AI Credit Usage", group: "Assessments", defaultRoles: ["staff"] },

  // Catalog
  { key: "products", label: "Products", group: "Catalog", defaultRoles: ["staff"] },
  { key: "inventory", label: "Inventory", group: "Catalog", defaultRoles: ["staff"] },
  { key: "solar_packages", label: "Solar Packages", group: "Catalog", defaultRoles: ["staff"] },
  { key: "smart_locks", label: "Smart Locks", group: "Catalog", defaultRoles: ["staff"] },
  { key: "home_automation", label: "Home Automation", group: "Catalog", defaultRoles: ["staff"] },

  // Content
  { key: "blog", label: "Blog", group: "Content", defaultRoles: ["staff"] },
  { key: "landing", label: "Landing Sections", group: "Content", defaultRoles: [] },
  { key: "content_pages", label: "Static Pages", group: "Content", defaultRoles: [] },
  { key: "forms", label: "Form Builder", group: "Content", defaultRoles: [] },

  // Marketing
  { key: "newsletter", label: "Newsletter", group: "Marketing", defaultRoles: ["staff"] },
  { key: "email", label: "Email", group: "Marketing", defaultRoles: ["staff"] },

  // Affiliates
  { key: "affiliates", label: "Affiliates", group: "Affiliates", defaultRoles: [] },
  { key: "affiliate_payouts", label: "Affiliate Payouts", group: "Affiliates", defaultRoles: [] },
  { key: "affiliate_analytics", label: "Affiliate Analytics", group: "Affiliates", defaultRoles: [] },

  // Careers
  { key: "careers", label: "Job Listings", group: "Careers", defaultRoles: [] },
  { key: "career_applications", label: "Career Applications", group: "Careers", defaultRoles: ["staff"] },

  // Tools
  { key: "reports", label: "Reports", group: "Tools", defaultRoles: ["staff"] },
  { key: "storage", label: "Media Library", group: "Tools", defaultRoles: ["staff", "engineer"] },

  // System (admin-only by default, but exposed for toggling)
  { key: "users", label: "Users & Roles", group: "System", defaultRoles: [] },
  { key: "roles", label: "Role Permissions", group: "System", defaultRoles: [] },
  { key: "audit_log", label: "Audit Log", group: "System", defaultRoles: [] },
  { key: "settings", label: "Settings", group: "System", defaultRoles: [] },
];

// Path -> page_key mapping used by the sidebar and route guard.
export const PATH_TO_PAGE_KEY: Record<string, string> = {
  "/admin": "dashboard",
  "/admin/analytics": "analytics",
  "/admin/orders": "orders",
  "/admin/customers": "customers",
  "/admin/leads": "leads",
  "/admin/tickets": "tickets",
  "/admin/discounts": "discounts",
  "/admin/waitlist": "waitlist",
  "/admin/finance/applications": "finance_applications",
  "/admin/finance/schedules": "finance_schedules",
  "/admin/assessments": "assessments",
  "/admin/lumivolt-sizings": "lumivolt_sizings",
  "/admin/custom-requests": "custom_requests",
  "/admin/ai-subscriptions": "ai_subscriptions",
  "/admin/ai-usage": "ai_usage",
  "/admin/products": "products",
  "/admin/inventory": "inventory",
  "/admin/solar-packages": "solar_packages",
  "/admin/smart-locks": "smart_locks",
  "/admin/home-automation": "home_automation",
  "/admin/blog": "blog",
  "/admin/landing": "landing",
  "/admin/content": "content_pages",
  "/admin/forms": "forms",
  "/admin/newsletter": "newsletter",
  "/admin/email": "email",
  "/admin/affiliates": "affiliates",
  "/admin/affiliates/payouts": "affiliate_payouts",
  "/admin/affiliates/analytics": "affiliate_analytics",
  "/admin/careers": "careers",
  "/admin/career-applications": "career_applications",
  "/admin/reports": "reports",
  "/admin/storage": "storage",
  "/admin/users": "users",
  "/admin/roles": "roles",
  "/admin/audit-log": "audit_log",
  "/admin/settings": "settings",
};

export const pageKeyForPath = (path: string): string | null => {
  const base = path.split("?")[0];
  return PATH_TO_PAGE_KEY[base] ?? null;
};

// Base roles that are toggleable in the roles matrix (admin is always full).
export const BASE_TOGGLE_ROLES: AppRole[] = ["staff", "engineer", "affiliate"];
