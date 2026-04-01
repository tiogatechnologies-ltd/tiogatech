## Plan: Smart Form + Solar Packages + AI Recommendations

### Phase 1: Add Solar Inverter Packages from PDF
- Add 17 solar system packages to the database with real prices from the catalog (₦1.1M to ₦40.5M)
- Include package details: inverter, panels, battery, appliances supported
- Update product data with actual pricing

### Phase 2: Add Tioga Logos
- Copy both logo variants (dark/light background) to `src/assets`
- Update the landing page header/footer to use the real logo

### Phase 3: Smart Solar Watts Calculator in Form
- Add a wattage database of common Nigerian appliances (bulbs, fans, TVs, fridges, ACs, freezers, water pumps, etc.)
- In the solar appliances step, let users:
  - Select appliances from predefined list OR type custom ones
  - Set quantity for each (e.g., "TV × 2")
  - Auto-show wattage range per appliance
  - Display running total wattage
- Use AI (Lovable AI) to auto-suggest wattage for custom-typed appliances

### Phase 4: Budget-Aware Dynamic Form
- After budget selection, validate subsequent choices against budget
- Show warning messages like "This setup may exceed your budget" when selections don't match
- Recommend appropriate package tiers based on total watts + budget
- Disable/grey out options clearly outside budget range

### Phase 5: AI-Powered Recommendations (Edge Function)
- Create edge function that takes form responses (appliances, quantities, watts, budget, property type)
- Uses Lovable AI to analyze and recommend the best matching solar package
- Returns personalized recommendation text shown on the catalog page
- Matches calculated wattage to appropriate inverter size

### Phase 6: Update Form Data Types
- Add `applianceQuantities` map to LeadFormData (appliance → {qty, watts})
- Add `totalWatts` calculated field
- Update form submission to include watts data

### Files to create:
- `src/data/applianceWatts.ts` - wattage database
- `src/components/lead-form/WattsCalculator.tsx` - calculator UI component
- `supabase/functions/ai-recommend/index.ts` - AI recommendation edge function

### Files to modify:
- `src/components/lead-form/types.ts` - add quantity/watts fields
- `src/components/lead-form/SolarFlow.tsx` - integrate watts calculator
- `src/components/LeadForm.tsx` - budget validation logic
- `src/pages/Catalog.tsx` - show AI recommendation
- `src/data/products.ts` - add solar packages with prices
- Landing page components - add logo
