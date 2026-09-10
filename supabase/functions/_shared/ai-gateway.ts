// Shared AI provider resolution for Supabase Edge Functions.
//
// The site was built on Lovable and every AI call went to Lovable's gateway
// using LOVABLE_API_KEY. When that key is not set on the project, AI chat, the
// product recommender and solar sizing all fail with a 500 - which is exactly
// what happened here. All three gateways speak the OpenAI chat-completions
// protocol, so the provider is now chosen from whichever key is present.
//
// Set ONE of these as a Supabase Edge Function secret:
//   OPENROUTER_API_KEY - recommended. Same "provider/model" ids already used
//                        in this codebase, so nothing else has to change.
//   OPENAI_API_KEY     - falls back to an OpenAI model id automatically.
//   LOVABLE_API_KEY    - the original gateway; still works if you have a key.
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@1.0.18";

/** The model id used across the AI functions, in OpenRouter/Lovable format. */
export const DEFAULT_MODEL = "google/gemini-2.5-flash";

/** OpenAI does not host Gemini, so map to a comparable OpenAI model there. */
const OPENAI_FALLBACK_MODEL = "gpt-4o-mini";

export interface AiGateway {
  name: "openrouter" | "openai" | "lovable";
  baseURL: string;
  headers: Record<string, string>;
  /** Model id valid for the resolved provider. */
  model: string;
}

/**
 * Resolves the active gateway, or null when no provider key is configured.
 * Callers should return a clear "AI is not configured" error rather than a
 * generic 500 so the problem is diagnosable from the browser.
 */
export function resolveAiGateway(model = DEFAULT_MODEL): AiGateway | null {
  const openrouter = Deno.env.get("OPENROUTER_API_KEY");
  if (openrouter) {
    return {
      name: "openrouter",
      baseURL: "https://openrouter.ai/api/v1",
      headers: {
        Authorization: `Bearer ${openrouter}`,
        "HTTP-Referer": "https://tiogatechnologies.com",
        "X-Title": "Tioga Technologies",
      },
      model,
    };
  }

  const openai = Deno.env.get("OPENAI_API_KEY");
  if (openai) {
    return {
      name: "openai",
      baseURL: "https://api.openai.com/v1",
      headers: { Authorization: `Bearer ${openai}` },
      // "google/..." is meaningless to OpenAI; use a native model instead.
      model: model.includes("/") ? OPENAI_FALLBACK_MODEL : model,
    };
  }

  const lovable = Deno.env.get("LOVABLE_API_KEY");
  if (lovable) {
    return {
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: { Authorization: `Bearer ${lovable}` },
      model,
    };
  }

  return null;
}

/** Convenience wrapper: POST to the resolved gateway's chat-completions. */
export async function aiChatCompletion(
  gw: AiGateway,
  body: Record<string, unknown>,
): Promise<Response> {
  return await fetch(`${gw.baseURL}/chat/completions`, {
    method: "POST",
    headers: { ...gw.headers, "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, model: body.model ?? gw.model }),
  });
}

/** Vercel AI SDK provider for the resolved gateway. */
export function createAiProvider(gw: AiGateway) {
  return createOpenAICompatible({
    name: gw.name,
    baseURL: gw.baseURL,
    headers: gw.name === "lovable"
      ? { "Lovable-API-Key": Deno.env.get("LOVABLE_API_KEY") ?? "", "X-Lovable-AIG-SDK": "vercel-ai-sdk" }
      : gw.headers,
  });
}

/** Kept so existing imports continue to resolve. */
export function createLovableAiGatewayProvider(lovableApiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
