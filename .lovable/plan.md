

## Plan: Premium Admin Dashboard with Full Content Management

This is a significant upgrade to transform the admin panel into a comprehensive content management system. The work is split into phases.

---

### Phase 1: Database Schema Updates

**New tables and columns via migration:**

- `form_questions` table: stores configurable form questions per category (solar/automation/security) with fields for `id`, `category`, `step_key`, `question_text`, `subtitle`, `question_type` (multi_select, single_select, text_input), `options` (jsonb array), `sort_order`, `is_active`. RLS: admin full access, anon read active.
- Add `status` column to `leads` table: enum-like text field (`new`, `contacted`, `converted`, `closed`) defaulting to `new`.
- `landing_content` table: stores editable content blocks for every landing page section (problem, solution, offers, FAQ, stats, how-it-works, trust, target-users) as JSONB. Key-value structure like site_settings. RLS: admin write, public read.

---

### Phase 2: Admin Navigation Expansion

Update `AdminLayout.tsx` sidebar to add new nav items:
- Dashboard (existing)
- Products (existing)
- Leads (existing, enhanced)
- **Form Builder** (new)
- **Landing Page** (new)
- **Email** (new)
- Settings (existing)

---

### Phase 3: Enhanced Leads Management (`AdminLeads.tsx`)

- Add status column with colored badges (new=blue, contacted=yellow, converted=green, closed=gray)
- Inline status change dropdown per lead
- Search/filter by name, status, budget, date range
- "Send WhatsApp" button per lead (opens wa.me link with pre-filled message)
- "Send Email" button per lead (compose modal that invokes `notify-new-lead` edge function with custom message)
- Lead count by status at top (mini stat cards)

---

### Phase 4: Form Builder Page (`AdminFormQuestions.tsx`)

- New page at `/admin/forms`
- Tab per category: Solar | Automation | Security
- Displays all steps for selected category in a sortable list
- Each step shows: question text, type, options list
- Can edit question text, add/remove options, toggle active/inactive
- Can reorder steps via sort_order
- Changes saved to `form_questions` table
- Seed the table with current hardcoded questions on first load (or via migration)
- Update the lead form flows to read questions from DB instead of hardcoded arrays

---

### Phase 5: Landing Page Content Editor (`AdminLandingPage.tsx`)

- New page at `/admin/landing`
- Accordion or tab sections for each landing page block:
  - **Hero**: title, subtitle (already in settings, link here too)
  - **Problem Section**: edit 4 problem cards (title + description each)
  - **Solution Section**: edit solution text
  - **Offers**: edit 3 offer cards (title, description, highlights)
  - **Stats**: edit 4 stat values and labels
  - **How It Works**: edit 4 steps
  - **FAQ**: add/edit/remove FAQ items
  - **Trust/Why Us**: edit 4 reason cards
  - **Target Users**: edit 4 user segment cards
- Each section loads from / saves to `landing_content` table
- Landing page components updated to fetch from DB with hardcoded fallbacks

---

### Phase 6: Email Composer (`AdminEmail.tsx`)

- New page at `/admin/email`
- Shows list of leads with email addresses
- Compose form: select lead(s), subject, message body (rich text area)
- Send button invokes an updated edge function
- Email history log (optional, stored in a simple `email_log` table or just fire-and-forget)

---

### Phase 7: Enhanced Product Management

- Add multiple image upload support (gallery, not just single image)
- Add specifications field (JSONB) for structured key-value specs
- Add "tags" field for flexible tagging
- Bulk actions: select multiple products, bulk activate/deactivate/delete
- Product preview button that opens the catalog view for that product

---

### Phase 8: Landing Page Components Refactor

Update all landing page components to:
1. Accept props from a context or fetch from `landing_content` table
2. Fall back to current hardcoded defaults if DB data is empty
3. Create a `useLandingContent` hook that fetches all landing content once

Similarly update lead form flows to read from `form_questions` table with hardcoded fallbacks.

---

### Technical Details

**Files to create:**
- `src/pages/AdminFormQuestions.tsx` - form builder UI
- `src/pages/AdminLandingPage.tsx` - landing content editor
- `src/pages/AdminEmail.tsx` - email composer
- `src/hooks/useLandingContent.ts` - hook to fetch landing content
- `src/hooks/useFormQuestions.ts` - hook to fetch form questions

**Files to modify:**
- `src/components/admin/AdminLayout.tsx` - add nav items
- `src/App.tsx` - add routes
- `src/pages/AdminLeads.tsx` - add status, search, email/whatsapp actions
- `src/pages/AdminProducts.tsx` - add tags, specs, multi-image, bulk actions
- All landing page components (Hero, ProblemSection, SolutionSection, etc.) - use DB content
- Lead form flows (SolarFlow, AutomationFlow, SecurityFlow) - use DB questions
- Migration SQL for new tables/columns

**Database migration:**
- Create `form_questions`, `landing_content` tables
- Add `status` to `leads`
- Seed `landing_content` and `form_questions` with current hardcoded content
- RLS policies for all new tables

This is a large scope. I recommend implementing it in order of phases, starting with the database changes, then the most impactful admin pages (leads enhancement, form builder, landing editor, email), then the product enhancements and landing page refactor.

