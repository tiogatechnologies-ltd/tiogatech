import { useAuth, AppRole } from "@/contexts/AuthContext";

/**
 * Capability-based permissions layered on top of user_roles.
 * Admin always has everything. Staff/Engineer are scoped.
 */
export type Capability =
  // Finance
  | "finance.view"
  | "finance.approve"
  | "finance.delete"
  | "finance.mark_paid"
  | "finance.liquidate"
  // Sales / commerce
  | "orders.view"
  | "orders.write"
  | "customers.view"
  | "customers.write"
  | "leads.view"
  | "leads.write"
  | "discounts.write"
  // Catalog
  | "catalog.view"
  | "catalog.write"
  | "inventory.write"
  // Assessments / engineering
  | "assessments.view"
  | "assessments.write"
  | "sizings.view"
  | "custom_requests.view"
  | "custom_requests.write"
  // Content / marketing
  | "content.write"
  | "landing.write"
  | "forms.write"
  | "blog.write"
  | "newsletter.write"
  | "email.send"
  | "careers.write"
  // AI billing
  | "ai.view"
  | "ai.write"
  // System (admin only)
  | "users.manage"
  | "audit.view"
  | "settings.write"
  | "affiliates.manage"
  | "reports.view"
  | "storage.write"
  | "storage.view_private"; // career-cvs / finance-docs

// Capability grid per role. Admin implicitly gets ALL.
const staffCaps: Capability[] = [
  "finance.view", "finance.mark_paid",
  "orders.view", "orders.write",
  "customers.view", "customers.write",
  "leads.view", "leads.write",
  "discounts.write",
  "catalog.view", "catalog.write", "inventory.write",
  "assessments.view",
  "sizings.view",
  "custom_requests.view", "custom_requests.write",
  "content.write", "blog.write", "newsletter.write", "email.send", "careers.write",
  "ai.view",
  "reports.view",
  "storage.write",
];

const engineerCaps: Capability[] = [
  "assessments.view", "assessments.write",
  "sizings.view",
  "custom_requests.view", "custom_requests.write",
  "storage.write",
];

export const usePermissions = () => {
  const { roles, isAdmin } = useAuth();
  const isStaff = roles.includes("staff");
  const isEngineer = roles.includes("engineer");

  const can = (cap: Capability): boolean => {
    if (isAdmin) return true;
    if (isStaff && staffCaps.includes(cap)) return true;
    if (isEngineer && engineerCaps.includes(cap)) return true;
    return false;
  };

  const canAny = (caps: Capability[]) => caps.some(can);

  const primaryRole: AppRole | "none" =
    isAdmin ? "admin"
    : isStaff ? "staff"
    : isEngineer ? "engineer"
    : roles.includes("affiliate") ? "affiliate"
    : roles.includes("customer") ? "customer"
    : "none";

  return { can, canAny, isAdmin, isStaff, isEngineer, primaryRole };
};

export default usePermissions;
