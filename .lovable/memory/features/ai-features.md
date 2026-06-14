---
name: AI Features
description: Site AI chat (Volt), Admin Copilot, Solar Sizing AI, ai-recommend — all via Lovable AI Gateway
type: feature
---
**AI features overview** (June 2026):

- **Volt site chat widget** (`src/components/AiChatWidget.tsx` + `supabase/functions/ai-chat`): floating bottom-right, full-screen on mobile, FAB on desktop. localStorage-persisted single conversation. Tools: `search_products`, `get_finance_quote`, `start_consultation` (creates lead), `handoff_to_whatsapp`. Uses raw fetch + OpenAI-compatible tool calling against Lovable Gateway (NOT AI SDK — gateway+SDK version mismatch caused issues).
- **Admin Copilot** (`src/pages/AdminCopilot.tsx` + `supabase/functions/ai-copilot`): admin/staff gated. Tasks: `analyze_period`, `generate_blog`, `summarize_lead`, `draft_email`, `write_product_description`.
- **AI Solar Sizing** (`supabase/functions/ai-solar-size`): plain-English home description → recommended inverter/battery/panel count + matching package slug. Returns structured JSON.
- **ai-recommend** (existing): product recommender tied to lead-form context.

All use `google/gemini-2.5-flash` via `https://ai.gateway.lovable.dev/v1` with `LOVABLE_API_KEY`. Toggle via Settings → Feature Flags (`ai_chat_enabled`, etc.).
