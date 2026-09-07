/**
 * Paystack Integration Helper
 * Provides client-side script loader, key resolution, and popup launcher.
 */

import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: PaystackPopupOptions) => {
        openIframe: () => void;
      };
    };
  }
}

export interface PaystackPopupOptions {
  key: string;
  email: string;
  amount: number; // in kobo
  currency?: string;
  ref?: string;
  metadata?: Record<string, any>;
  channels?: string[];
  callback?: (response: PaystackSuccessResponse) => void;
  onClose?: () => void;
}

export interface PaystackSuccessResponse {
  reference: string;
  trans?: string;
  status?: string;
  message?: string;
  trxref?: string;
  redirecturl?: string;
}

const SCRIPT_URL = "https://js.paystack.co/v1/inline.js";
let scriptLoadingPromise: Promise<void> | null = null;

export const loadPaystackScript = (): Promise<void> => {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.PaystackPop) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      if (window.PaystackPop) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Paystack script")));
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadingPromise = null;
      reject(new Error("Failed to load Paystack script from js.paystack.co"));
    };
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
};

// Fallback demo/test public key if none configured
const DEFAULT_TEST_KEY = "pk_test_51b9e83e98196eec5eb85c6396e38b46d7557348";

export const getPaystackPublicKey = async (): Promise<string> => {
  // 1. Check environment variable (Vite)
  const envKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  if (envKey && typeof envKey === "string" && envKey.trim().length > 5) {
    return envKey.trim();
  }

  // 2. Check localStorage (allows admin or preview testing in browser)
  try {
    const local = localStorage.getItem("tioga_paystack_public_key");
    if (local && local.trim().startsWith("pk_")) {
      return local.trim();
    }
  } catch {}

  // 3. Check site_settings in Supabase
  try {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "payment").maybeSingle();
    const val = data?.value as any;
    if (val?.paystack_public_key && typeof val.paystack_public_key === "string" && val.paystack_public_key.trim().startsWith("pk_")) {
      return val.paystack_public_key.trim();
    }
  } catch {}

  // 4. Default test key
  return DEFAULT_TEST_KEY;
};

export interface OpenPaystackParams {
  email: string;
  amountNgn: number;
  ref?: string;
  metadata?: Record<string, any>;
  onSuccess: (response: PaystackSuccessResponse) => void;
  onClose?: () => void;
}

export const openPaystackPopup = async (params: OpenPaystackParams): Promise<void> => {
  await loadPaystackScript();

  if (!window.PaystackPop) {
    throw new Error("Paystack SDK could not be initialized.");
  }

  const publicKey = await getPaystackPublicKey();
  if (!publicKey || !publicKey.startsWith("pk_")) {
    throw new Error("Invalid Paystack public key. Please configure a valid key starting with pk_.");
  }

  const koboAmount = Math.round(params.amountNgn * 100);

  const handler = window.PaystackPop.setup({
    key: publicKey,
    email: params.email.trim(),
    amount: koboAmount,
    currency: "NGN",
    ref: params.ref || `tioga_${Date.now()}`,
    metadata: {
      ...params.metadata,
      custom_fields: [
        {
          display_name: "Customer Email",
          variable_name: "customer_email",
          value: params.email,
        },
        ...(params.metadata?.order_number
          ? [
              {
                display_name: "Order Number",
                variable_name: "order_number",
                value: params.metadata.order_number,
              },
            ]
          : []),
      ],
    },
    callback: (response: PaystackSuccessResponse) => {
      params.onSuccess(response);
    },
    onClose: () => {
      if (params.onClose) params.onClose();
    },
  });

  handler.openIframe();
};
