import { supabase } from "@/integrations/supabase/client";
import { trackConversion } from "@/lib/tracking";

const TRAIL_STORAGE_KEY = "tioga_shopper_trail_v1";
const ALERT_THROTTLE_KEY = "tioga_shopper_alerts_sent_v1";

export interface ViewedProductEntry {
  id: string;
  name: string;
  category?: string;
  price?: string;
  viewed_at: string;
}

export interface ShopperIdentity {
  user_id?: string;
  email?: string;
  full_name?: string;
  phone?: string;
  location?: string;
}

export interface ShopperTrail {
  session_id: string;
  first_seen_at: string;
  last_active_at: string;
  retail_visit_count: number;
  last_category_or_search?: string;
  viewed_products: ViewedProductEntry[];
  cart_items: Array<{ name: string; quantity: number; price?: string | null }>;
  cart_total_ngn: number;
  identity?: ShopperIdentity;
  signup_at?: string;
  has_ordered?: boolean;
  reengagement_prompt_shown?: boolean;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let sid = sessionStorage.getItem("tioga_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("tioga_session_id", sid);
  }
  return sid;
}

export function getShopperTrail(): ShopperTrail {
  const fallback: ShopperTrail = {
    session_id: getSessionId(),
    first_seen_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
    retail_visit_count: 0,
    viewed_products: [],
    cart_items: [],
    cart_total_ngn: 0,
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(TRAIL_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<ShopperTrail>;
    return {
      ...fallback,
      ...parsed,
      session_id: getSessionId(),
      viewed_products: Array.isArray(parsed.viewed_products) ? parsed.viewed_products : [],
      cart_items: Array.isArray(parsed.cart_items) ? parsed.cart_items : [],
    };
  } catch {
    return fallback;
  }
}

export function saveShopperTrail(trail: ShopperTrail): void {
  if (typeof window === "undefined") return;
  try {
    trail.last_active_at = new Date().toISOString();
    localStorage.setItem(TRAIL_STORAGE_KEY, JSON.stringify(trail));
  } catch {
    // ignore storage quota errors
  }
}

function hasSentAlert(alertKey: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(ALERT_THROTTLE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    return Boolean(map[alertKey]);
  } catch {
    return false;
  }
}

function markAlertSent(alertKey: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem(ALERT_THROTTLE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[alertKey] = Date.now();
    sessionStorage.setItem(ALERT_THROTTLE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/**
 * Links a user's identity (from Auth login/signup or lead form) to their browse trail.
 * When `is_signup` is true, records the new signup as an actionable CRM lead and
 * notifies the sales team with the exact products the user was viewing.
 */
export async function identifyShopper(
  identity: ShopperIdentity,
  opts: { is_signup?: boolean } = {}
): Promise<void> {
  const trail = getShopperTrail();
  trail.identity = {
    ...trail.identity,
    ...Object.fromEntries(Object.entries(identity).filter(([, v]) => Boolean(v))),
  };
  if (opts.is_signup && !trail.signup_at) {
    trail.signup_at = new Date().toISOString();
  }
  saveShopperTrail(trail);

  const email = trail.identity?.email || "";
  const fullName = trail.identity?.full_name || (email ? email.split("@")[0] : "Retail Shopper");
  const phone = trail.identity?.phone || "Not provided yet";
  const viewedNames = trail.viewed_products.map((p) => p.name);
  const cartSummary = trail.cart_items.map((c) => `${c.name} x${c.quantity}`).join(", ");

  if (opts.is_signup && email && !hasSentAlert(`signup_${email}`)) {
    markAlertSent(`signup_${email}`);
    trackConversion("lead_submitted", {
      kind: "account_signup",
      email,
      full_name: fullName,
      viewed_products: viewedNames.slice(0, 6),
      cart_items: cartSummary,
    });

    try {
      await supabase.from("leads").insert({
        full_name: fullName,
        email,
        phone,
        location: trail.identity?.location || "Online Signup",
        products: viewedNames.length > 0 ? viewedNames.slice(0, 5) : ["Retail Store Signup"],
        budget: trail.cart_total_ngn > 0 ? `₦${trail.cart_total_ngn.toLocaleString("en-NG")} (In Cart)` : "Browsing Retail",
        notes: [
          "New customer account signup.",
          viewedNames.length > 0 ? `Recently viewed on /retail: ${viewedNames.slice(0, 8).join(", ")}` : "",
          cartSummary ? `Current cart items: ${cartSummary}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        status: "new",
        source: "account_signup_retail",
      } as any);
    } catch {
      // non-fatal if RLS or schema differs
    }

    try {
      await supabase.functions.invoke("notify-new-lead", {
        body: {
          source: "new_account_signup",
          full_name: fullName,
          email,
          phone,
          location: trail.identity?.location || "Online Retail Store",
          budget: trail.cart_total_ngn > 0 ? `₦${trail.cart_total_ngn.toLocaleString("en-NG")} in Cart` : "New Account Signup",
          products: viewedNames.length > 0 ? viewedNames.slice(0, 6) : ["Retail Store Account Signup"],
          summary: `New customer signed up on the website.${
            viewedNames.length > 0 ? ` Viewed products: ${viewedNames.slice(0, 5).join(", ")}.` : ""
          }${cartSummary ? ` Cart items: ${cartSummary}.` : " No purchase completed yet - prime candidate for follow-up."}`,
        },
      });
    } catch {
      // non-fatal
    }
  }
}

/**
 * Records a visit or filter/search action on /retail.
 * Fires an instant notification when a known/signed-in shopper browses /retail,
 * and logs rich browse metadata to `conversions`.
 */
export async function recordRetailBrowse(context?: {
  category?: string | null;
  search?: string | null;
}): Promise<ShopperTrail> {
  const trail = getShopperTrail();
  trail.retail_visit_count = (trail.retail_visit_count || 0) + 1;
  if (context?.category || context?.search) {
    trail.last_category_or_search = [
      context.category ? `Category: ${context.category}` : "",
      context.search ? `Search: "${context.search}"` : "",
    ]
      .filter(Boolean)
      .join(" · ");
  }
  saveShopperTrail(trail);

  trackConversion("catalog_view", {
    retail_visit_count: trail.retail_visit_count,
    category: context?.category || null,
    search: context?.search || null,
    user_email: trail.identity?.email || null,
    user_name: trail.identity?.full_name || null,
    viewed_count: trail.viewed_products.length,
  });

  // If the shopper is signed in or known, notify the sales team once per session when they browse /retail
  if (trail.identity?.email && !hasSentAlert("known_retail_browse")) {
    markAlertSent("known_retail_browse");
    const viewedNames = trail.viewed_products.map((p) => p.name);
    try {
      await supabase.functions.invoke("notify-new-lead", {
        body: {
          source: "retail_browse_intent",
          full_name: trail.identity.full_name || trail.identity.email.split("@")[0],
          email: trail.identity.email,
          phone: trail.identity.phone || "Registered Customer",
          location: trail.identity.location || "Browsing /retail",
          budget: trail.cart_total_ngn > 0 ? `₦${trail.cart_total_ngn.toLocaleString("en-NG")} in Cart` : "Active Retail Browser",
          products: viewedNames.length > 0 ? viewedNames.slice(0, 6) : [context?.category || "Retail Store Catalog"],
          summary: `Registered customer is actively browsing /retail${
            trail.last_category_or_search ? ` (${trail.last_category_or_search})` : ""
          }.${viewedNames.length > 0 ? ` Recently viewed: ${viewedNames.slice(0, 5).join(", ")}.` : ""}`,
        },
      });
    } catch {
      // non-fatal
    }
  }

  return trail;
}

/**
 * Records a product view (Quick View or Product Detail page) and triggers a
 * High-Intent Shopper alert when 2+ products are viewed by a known user (or 3+ by any visitor).
 */
export async function recordProductViewIntent(product: {
  id: string;
  name: string;
  category?: string;
  price?: string | number | null;
}): Promise<ShopperTrail> {
  const trail = getShopperTrail();
  const priceStr =
    typeof product.price === "number" && product.price > 0
      ? `₦${Math.round(product.price).toLocaleString("en-NG")}`
      : typeof product.price === "string"
        ? product.price
        : undefined;

  const existingIdx = trail.viewed_products.findIndex((p) => p.id === product.id);
  const entry: ViewedProductEntry = {
    id: product.id,
    name: product.name,
    category: product.category,
    price: priceStr,
    viewed_at: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    trail.viewed_products.splice(existingIdx, 1);
  }
  trail.viewed_products.unshift(entry);
  trail.viewed_products = trail.viewed_products.slice(0, 15);
  saveShopperTrail(trail);

  trackConversion("product_view", {
    product_id: product.id,
    product_name: product.name,
    category: product.category || null,
    price: priceStr || null,
    total_viewed_in_session: trail.viewed_products.length,
    user_email: trail.identity?.email || null,
    user_name: trail.identity?.full_name || null,
  });

  const isKnown = Boolean(trail.identity?.email || trail.identity?.phone);
  const count = trail.viewed_products.length;

  // Fire High-Intent Product Browse notification
  if ((isKnown && count >= 2 && !hasSentAlert("known_multi_product")) || (!isKnown && count === 4 && !hasSentAlert("anon_high_intent"))) {
    markAlertSent(isKnown ? "known_multi_product" : "anon_high_intent");
    const viewedList = trail.viewed_products.slice(0, 6).map((p) => `${p.name}${p.price ? ` (${p.price})` : ""}`);
    try {
      await supabase.functions.invoke("notify-new-lead", {
        body: {
          source: "retail_browse_intent",
          full_name: trail.identity?.full_name || (isKnown ? trail.identity?.email?.split("@")[0] : "High-Intent Retail Visitor"),
          email: trail.identity?.email || "",
          phone: trail.identity?.phone || "Browsing Online (/retail)",
          location: trail.identity?.location || "Retail Storefront",
          budget: priceStr || "Multiple Products Viewed",
          products: viewedList,
          summary: `${isKnown ? "Registered customer" : "Active visitor"} has viewed ${count} products on /retail in this session: ${viewedList.join("; ")}.`,
        },
      });
    } catch {
      // non-fatal
    }
  }

  return trail;
}

/**
 * Syncs cart state into the shopper trail and alerts sales when a high-value cart is built.
 */
export async function syncCartToShopperTrail(
  items: Array<{ name: string; quantity: number; price?: string | null; numericPrice?: number | null }>
): Promise<void> {
  const trail = getShopperTrail();
  trail.cart_items = items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price }));
  trail.cart_total_ngn = items.reduce((sum, i) => sum + (Number(i.numericPrice) || 0) * (i.quantity || 1), 0);
  saveShopperTrail(trail);

  if (items.length > 0 && trail.identity?.email && !hasSentAlert("known_cart_active")) {
    markAlertSent("known_cart_active");
    const cartSummary = items.map((i) => `${i.name} x${i.quantity}${i.price ? ` (${i.price})` : ""}`);
    try {
      await supabase.functions.invoke("notify-new-lead", {
        body: {
          source: "retail_cart_activity",
          full_name: trail.identity.full_name || trail.identity.email.split("@")[0],
          email: trail.identity.email,
          phone: trail.identity.phone || "In Cart on /retail",
          location: trail.identity.location || "Retail Storefront",
          budget: trail.cart_total_ngn > 0 ? `₦${trail.cart_total_ngn.toLocaleString("en-NG")}` : "Active Cart",
          products: cartSummary,
          summary: `Customer added ${items.length} item(s) to cart (Total: ₦${trail.cart_total_ngn.toLocaleString("en-NG")}) and has not completed checkout yet.`,
        },
      });
    } catch {
      // non-fatal
    }
  }
}

export function markShopperOrdered(): void {
  const trail = getShopperTrail();
  trail.has_ordered = true;
  saveShopperTrail(trail);
}

export const REENGAGEMENT_REASONS: Record<string, { label: string; reply: string; openWhatsapp?: boolean }> = {
  need_sizing_help: {
    label: "Needs Engineer Sizing / Compatibility Help",
    reply: "Got it! Let's connect you with a Tioga solar & smart home engineer to size the right system for your load.",
    openWhatsapp: true,
  },
  want_easy_flex: {
    label: "Interested in Easy Flex / Installment Payment",
    reply: "Thank you! Our team will help you structure a flexible payment plan that fits your budget.",
    openWhatsapp: true,
  },
  comparing_prices: {
    label: "Comparing Prices / Waiting for Black Friday Deal",
    reply: "Thanks for your feedback! Our team can share our best volume & Black Friday price match on the items you viewed.",
    openWhatsapp: true,
  },
  checkout_issue: {
    label: "Experienced a Checkout or Payment Issue",
    reply: "Sorry about the trouble! We have alerted our sales desk to assist you directly with your order.",
    openWhatsapp: true,
  },
};

/**
 * Records a customer's 1-click "Why did you leave?" feedback and alerts the sales team.
 */
export async function submitReengagementFeedback(params: {
  reasonKey: string;
  customNote?: string;
  email?: string;
  fullName?: string;
  phone?: string;
}): Promise<void> {
  const trail = getShopperTrail();
  const reasonInfo = REENGAGEMENT_REASONS[params.reasonKey] || {
    label: params.reasonKey,
    reply: "Thank you for your feedback! Our team has been notified.",
  };
  const email = params.email || trail.identity?.email || "";
  const fullName = params.fullName || trail.identity?.full_name || (email ? email.split("@")[0] : "Returning Customer");
  const phone = params.phone || trail.identity?.phone || "Provided via Re-Engagement Link";
  const viewedNames = trail.viewed_products.map((p) => p.name);
  const cartNames = trail.cart_items.map((c) => `${c.name} x${c.quantity}`);

  trackConversion("cta_click", {
    kind: "reengagement_feedback",
    reason_key: params.reasonKey,
    reason_label: reasonInfo.label,
    custom_note: params.customNote || null,
    email: email || null,
    viewed_products: viewedNames.slice(0, 6),
  });

  try {
    await supabase.from("leads").insert({
      full_name: fullName,
      email: email || null,
      phone,
      location: trail.identity?.location || "Re-Engagement Response",
      products: cartNames.length > 0 ? cartNames : viewedNames.length > 0 ? viewedNames.slice(0, 5) : ["Retail Re-Engagement"],
      budget: trail.cart_total_ngn > 0 ? `₦${trail.cart_total_ngn.toLocaleString("en-NG")}` : "Follow-up Requested",
      notes: `Why customer left without purchasing: ${reasonInfo.label}${params.customNote ? `\nCustomer note: ${params.customNote}` : ""}`,
      status: "new",
      source: "reengagement_feedback",
    } as any);
  } catch {
    // non-fatal
  }

  try {
    await supabase.functions.invoke("notify-new-lead", {
      body: {
        source: "reengagement_feedback",
        full_name: fullName,
        email,
        phone,
        location: "Customer Re-Engagement Feedback",
        budget: reasonInfo.label,
        products: cartNames.length > 0 ? cartNames : viewedNames.slice(0, 6),
        summary: `Customer responded to "Why did you leave without purchasing?": "${reasonInfo.label}".${
          params.customNote ? ` Note: "${params.customNote}".` : ""
        }${viewedNames.length > 0 ? ` Viewed items: ${viewedNames.slice(0, 5).join(", ")}.` : ""}`,
      },
    });
  } catch {
    // non-fatal
  }
}

/**
 * Admin / Automation helper: Finds signed-up users (from `profiles` and `leads`)
 * who have 0 rows in `orders` and have not yet received a re-engagement email,
 * and sends them a personalized "Can we help? Tell us why you left" email.
 */
export async function runUnconvertedSignupReengagementSweep(opts: { maxSend?: number } = {}): Promise<{
  scanned: number;
  sent: number;
  recipients: string[];
}> {
  const maxSend = opts.maxSend ?? 25;
  const [{ data: profiles }, { data: orders }, { data: previousRuns }, { data: signupLeads }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, phone, created_at").order("created_at", { ascending: false }).limit(200),
    supabase.from("orders").select("user_id, email, phone"),
    supabase
      .from("automation_runs" as any)
      .select("recipient")
      .in("rule_key", ["signup_no_purchase_reengagement", "abandoned_cart_recovery"])
      .eq("status", "sent"),
    supabase
      .from("leads")
      .select("full_name, email, phone, products, notes, created_at")
      .in("source", ["account_signup_retail", "retail_exit_intent"])
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const orderedEmails = new Set(
    (orders || [])
      .map((o: any) => String(o.email || "").trim().toLowerCase())
      .filter(Boolean)
  );
  const orderedUserIds = new Set(
    (orders || [])
      .map((o: any) => String(o.user_id || "").trim())
      .filter(Boolean)
  );
  const alreadySentEmails = new Set(
    ((previousRuns as any[]) || [])
      .map((r: any) => String(r.recipient || "").trim().toLowerCase())
      .filter(Boolean)
  );

  // Merge candidates from profiles + signup leads
  const candidates = new Map<string, { full_name: string; email: string; products: string[] }>();

  for (const p of (profiles as any[]) || []) {
    const email = String(p.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) continue;
    if (orderedUserIds.has(p.id) || orderedEmails.has(email) || alreadySentEmails.has(email)) continue;
    candidates.set(email, {
      full_name: p.full_name || email.split("@")[0],
      email,
      products: [],
    });
  }

  for (const l of (signupLeads as any[]) || []) {
    const email = String(l.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) continue;
    if (orderedEmails.has(email) || alreadySentEmails.has(email)) continue;
    const existing = candidates.get(email);
    candidates.set(email, {
      full_name: l.full_name || existing?.full_name || email.split("@")[0],
      email,
      products: Array.isArray(l.products) && l.products.length > 0 ? l.products : existing?.products || [],
    });
  }

  const list = Array.from(candidates.values()).slice(0, maxSend);
  const sentRecipients: string[] = [];

  for (const c of list) {
    const browsedLine =
      c.products.length > 0
        ? `We noticed you were checking out ${c.products.slice(0, 3).join(", ")} on the Tioga Technologies Retail Store.`
        : `We noticed you recently created an account on the Tioga Technologies Retail Store but haven't completed an order yet.`;

    const message = [
      `${browsedLine}`,
      ``,
      `We'd love to know how we can help you complete your setup. Simply click or reply with what you need:`,
      ``,
      `1. Need help sizing the right Inverter, Battery, or Solar Package:` ,
      `   https://www.tiogatechnologies.com/retail?reengage_feedback=need_sizing_help&email=${encodeURIComponent(c.email)}`,
      ``,
      `2. Interested in spreading payments (Easy Flex / Installment Plan):`,
      `   https://www.tiogatechnologies.com/retail?reengage_feedback=want_easy_flex&email=${encodeURIComponent(c.email)}`,
      ``,
      `3. Comparing prices or looking for our Black Friday Deal match:`,
      `   https://www.tiogatechnologies.com/retail?reengage_feedback=comparing_prices&email=${encodeURIComponent(c.email)}`,
      ``,
      `4. Experienced a technical or payment issue at checkout:`,
      `   https://www.tiogatechnologies.com/retail?reengage_feedback=checkout_issue&email=${encodeURIComponent(c.email)}`,
      ``,
      `Or chat directly with a Tioga Engineer on WhatsApp right now: https://wa.me/2348178000023?text=${encodeURIComponent(
        `Hi Tioga Technologies, I signed up on your retail store (${c.email}) and would like assistance with my order.`
      )}`,
    ].join("\n");

    const { error } = await supabase.functions.invoke("notify-new-lead", {
      body: {
        custom_email: true,
        to: c.email,
        recipient_name: c.full_name,
        subject: "Can our engineers help with your Tioga Technologies order?",
        message,
      },
    });

    if (!error) {
      sentRecipients.push(c.email);
      await supabase.from("automation_runs" as any).insert({
        rule_key: "signup_no_purchase_reengagement",
        status: "sent",
        recipient: c.email,
        detail: JSON.stringify({ full_name: c.full_name, products: c.products, sent_at: new Date().toISOString() }),
      });
    }
  }

  return {
    scanned: candidates.size,
    sent: sentRecipients.length,
    recipients: sentRecipients,
  };
}
