

## Plan: Improve AI Recommendations Accuracy and Add Combo Packages

### Problem Analysis
The AI recommendation is inaccurate because:
1. It returns a single `recommendedPackage` string that must fuzzy-match product names in the DB, which often fails
2. The AI prompt lists products with different names than what's in the database (e.g., prompt says "Geta 1.5K" but DB has "Geta 1.5K" -- some match, many don't)
3. It recommends one item instead of a curated set of the best-matching products

### Phase 1: Create Combo/Bundle Packages (Database)

Insert pre-configured combo packages into the `products` table with a new series name per category:

**Solar Combos** (series: "Solar Combo Packages"):
- Starter Home Solar Kit: Bread BIS3500 + Bread 5.12KWH battery + 4x 500W panels (~₦1.5M)
- Standard Home Solar Kit: SNA5000 + TAICO 5.12KWH + 6x 500W panels (~₦2.3M)
- Premium Home Solar Kit: GEN EU 8K + TAICO 10.24KWH + 8x 550W panels (~₦5.2M)
- Full Duplex Solar Kit: GEN EU 10K + TAICO 20.48KWH + 12x 550W panels (~₦8M)
- Commercial Solar Kit: Three Phase 20K + 2x TAICO 20.48KWH + 20x 550W panels (~₦14M+)

**Security Combos** (series: "Security Combo Packages"):
- Home Security Starter: 1x Pro Series lock + 2x indoor cameras (~₦200k)
- Full Home Security: 1x Apex lock + 2x outdoor cameras + 1x dome camera (~₦500k)
- Business Security Suite: 2x Elite locks + 4x bullet cameras + DVR system (~₦1M+)

**Smart Home Combos** (series: "Smart Home Combo Packages"):
- Smart Starter: 4x 1 Gang Smart Switches + 1x Granite Display
- Smart Home Complete: 8 Gang switch + 4x 1 Gang switches + Granite Display + Pro Series lock

### Phase 2: Fix AI Recommendation Engine (Edge Function)

Rewrite the `ai-recommend` edge function to return **multiple ranked product names** that exactly match database entries:

- Change the tool schema to return `recommendedProducts` (array of 3-5 exact product names from the catalog) instead of a single `recommendedPackage` string
- Add explicit instructions to the AI: "You MUST use the exact product names listed above. Return the top 3-5 products ranked by fit."
- Include combo packages in the prompt so the AI can recommend bundles
- Add a `recommendedCombo` field for when a bundle fits best

### Phase 3: Update Catalog Matching Logic (Catalog.tsx)

- Update the `isRecommended()` function to check against the new `recommendedProducts` array (exact match by name)
- Show combo packages prominently at the top when the AI recommends one
- Show individual recommended products with numbered badges ("Pick #1", "Pick #2")
- Display a "Recommended Setup" card that shows the full combo breakdown (inverter + battery + panels) with total price

### Technical Details

**Edge function changes** (`supabase/functions/ai-recommend/index.ts`):
- Tool schema adds `recommendedProducts: { type: "array", items: { type: "string" } }` and `recommendedCombo: { type: "string" }`
- Prompt explicitly lists combo packages with exact names
- System message emphasizes: "Only return product names exactly as listed"

**Catalog changes** (`src/pages/Catalog.tsx`):
- `AIRecommendation` interface adds `recommendedProducts: string[]` and `recommendedCombo?: string`
- `isRecommended()` does exact name matching against the array
- Combo packages highlighted with a special "Complete Package" badge
- Recommended products sorted to top in order of AI ranking

**Database inserts**: ~12 new combo products across solar, security, and smart home categories

### Files to modify
- `supabase/functions/ai-recommend/index.ts` - Rewrite prompts and tool schema
- `src/pages/Catalog.tsx` - Update recommendation display and matching

### Files unchanged
- Form components (no changes needed)
- Admin dashboard (combos appear as regular products)

