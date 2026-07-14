## 1. Fix premature "Paid" deposit status

**File:** `src/pages/AccountFinance.tsx` (line 85)

Current logic:

```ts
const depositPaid = !deposit || deposit.status === "paid";
```

The `!deposit` fallback marks the deposit as Paid whenever no deposit schedule row exists yet (pending/unapproved applications). Change to strict check:

```ts
const depositPaid = !!deposit && deposit.status === "paid";
```

Also update the deposit summary rendering (line ~128) so pending applications show "Pending" instead of "Paid", and only show "Paid" when there's a real paid schedule row (which is only written by `paystack-webhook` on `charge.success`). For applications with no deposit row yet, show "Awaiting approval" or nothing.

No backend change needed — the webhook already correctly gates `status = 'paid'` on the real `charge.success` event.

## 2. Auth gate for core features + preserve in-progress data

Add a lightweight auth-required pattern that redirects guests to `/auth` and returns them afterward with any partial input restored.

**New helper:** `src/lib/authGate.ts`

- `saveDraft(key, data)` → `sessionStorage.setItem("draft:"+key, JSON.stringify(data))`
- `loadDraft(key)` and `clearDraft(key)`
- `requireAuth(user, opts)` → if no user, save draft + `navigate("/auth?next=" + encodeURIComponent(location.pathname + location.search))`.

**Auth page (`src/pages/Auth.tsx`):** honor `?next=` param, redirect back on successful sign-in / sign-up.

**Gate these entry points** (redirect if guest, saving form/cart context):

- `src/pages/Checkout.tsx` — on mount if `!user`, save cart+form draft and redirect.
- `src/components/CartDrawer.tsx` — "Send Order" button: gate quick-order submit.
- `src/pages/FinanceApply.tsx` — on mount, gate; persist current form step to sessionStorage on every change; restore after auth.
- `src/components/AiChatWidget.tsx` — on first open or first send, if `!user`, show a friendly inline prompt ("Sign up free to chat with Volt AI") with Sign in / Sign up buttons linking to `/auth?next=<current>`. Keep the draft message queued.
- `src/pages/SolarAssessment.tsx` — gate the "Run assessment" submit (assessment already partially gated; extend to guests entering data).

The prompt UX: a small modal / inline card, not a hard error. Copy: "Create a free account to continue. Your details are saved."

## 3. Remove "Pay Online" from Quick Order (CartDrawer)

**File:** `src/components/CartDrawer.tsx` (lines ~156–172, ~196–210)

- Change grid from `grid-cols-3` to `grid-cols-2`.
- Delete the third button ("Pay Online / Paystack — soon") and the `mode === "paystack"` disabled-button branch.
- Keep only WhatsApp and Callback.

**Clarification on unification:** The screenshot is the **CartDrawer "Quick order" flow** (opened from the cart drawer's "Quick order (WhatsApp / callback)" button), which is separate from the full `/checkout` page (`src/pages/Checkout.tsx`) that already handles Card/Paystack, Bank Transfer, Easy Flex, delivery/pickup, etc. They're intentionally distinct: the full checkout is the primary flow (surfaced as "Proceed to Checkout"), and quick-order is a low-friction fallback for users who prefer WhatsApp/callback. **Recommendation:** keep them distinct as-is — the quick-order flow is genuinely useful on mobile for buyers who don't want to fill the full form. Removing the non-functional Paystack option is enough. If you'd rather collapse quick-order into the main checkout entirely, say so and I'll remove the CartDrawer checkout step and route both buttons to `/checkout`.

&nbsp;

I'd agree with keeping them separate — a low-friction WhatsApp/callback option is genuinely useful for mobile buyers who don't want to fill the full form, and merging them would remove that convenience for no real benefit. I'd just reply to Lovable confirming: "Keep them distinct as recommended, just remove the Pay Online button."

## 4. Mobile responsiveness on account/finance cards

**Root cause (from screenshot):** The AccountFinance card rows put labels and green pill buttons on the same row without wrapping; on narrow viewports the buttons and totals overflow off-screen.

**Files to audit and fix:**

- `src/pages/AccountFinance.tsx` — application card header, deposit/monthly/total summary grid, and the schedule row buttons ("Pay next installment", "Liquidate"). Apply:
  - `flex-wrap gap-2` on action rows
  - Full-width buttons on `sm:` breakpoint down (`w-full sm:w-auto`)
  - `min-w-0` + `truncate` on price labels only where safe; otherwise allow wrap
  - Ensure the outer `<main>` uses `px-4` (it does) and cards use `overflow-hidden` without fixed widths
- `src/pages/Account.tsx` — the "Flexible payment" summary section shown in screenshot 3 (buttons cut off).
- `src/pages/AccountAssessments.tsx`, `src/pages/AccountSubscription.tsx`, `src/pages/AffiliateDashboard.tsx` — quick pass for the same pattern (button rows next to totals).

Global fix pattern:

```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
  <div className="min-w-0">…totals…</div>
  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
    <button className="w-full sm:w-auto …">Pay next installment</button>
    <button className="w-full sm:w-auto …">Liquidate</button>
  </div>
</div>
```

No new dependencies. No DB migrations. All changes are frontend except the AccountFinance depositPaid logic tweak (also frontend).

## Verification

- Run Playwright at 375px width against `/account/finance` after fixes → screenshot to confirm no horizontal overflow and deposit shows "Pending" for a pending application.
- Manual: sign out, click AI widget → sign-in prompt appears; sign in via `/auth?next=…` → returns to widget with draft message intact.
- Cart drawer quick-order → only 2 options visible.