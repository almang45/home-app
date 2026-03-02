# Refactoring Ideas

This document tracks pending refactoring suggestions for the Home App. Items are organized by priority.

> **Note:** Items #1 (environment variables) and #2 (React Query) have already been implemented.

---

## High Priority

### #3 — Unify Error Handling

**Problem:** `useEffect` + `setState` data fetching in forms has no error handling (e.g., `transaction-form.tsx:60-73`). Users receive no feedback when API calls fail.

**Affected Files:**
- `src/features/finance/components/transaction-form.tsx` (lines 60–73)
- Other form components with similar data-fetching patterns

**Recommended Fix:** Extract a consistent hook or utility for async data loading that handles error, loading, and success states uniformly across all forms.

---

### #4 — Remove `as any` Type Casts in Forms

**Problem:** Type safety is bypassed with `as any` casts on Zod form resolvers (e.g., `resolver: zodResolver(transactionSchema) as any`), defeating TypeScript's protections and allowing runtime errors to slip through.

**Affected Files:**
- `src/features/finance/components/transaction-form.tsx`
- Any form component using `zodResolver()` with an `as any` cast

**Recommended Fix:** Use `z.infer<typeof schema>` to properly type the form values instead of casting the resolver to `any`.

---

### #5 — Break Up Large Form Components

**Problem:** `transaction-form.tsx` is 294 lines long, mixing data fetching, form validation, and rendering in one component. This makes it hard to test, maintain, and reuse individual pieces.

**Affected Files:**
- `src/features/finance/components/transaction-form.tsx` (entire file)

**Recommended Fix:** Split into smaller, focused field components. Separate form-level state management from rendering concerns.

---

## Medium Priority

### #6 — Replace Faker Users with Real PocketBase Data

**Problem:** `src/features/users/data/users.ts` generates 500 fake records using faker instead of fetching actual user data from the PocketBase API, which is inconsistent with every other feature in the app.

**Affected Files:**
- `src/features/users/data/users.ts` (entire file)

**Recommended Fix:** Replace the fake data generation with a real PocketBase API call to fetch user records.

---

### #7 — Add Loading Skeletons

**Problem:** Most data tables and form components show no loading state. Users have no visual feedback while data is being fetched.

**Affected Files:**
- `src/features/finance/components/finance-dashboard.tsx`
- All data table components
- All form components that fetch data on mount

**Recommended Fix:** Add skeleton loaders or loading spinners for all async data operations.

---

### #8 — Standardize Settings Routes

**Problem:** Settings pages (Account, Profile, Notifications, Appearance) are separate routes with no shared layout structure or consistent data-fetching patterns.

**Affected Files:**
- `src/routes/_authenticated/settings/` (all settings routes)
- Account, profile, notifications, and appearance page components

**Recommended Fix:** Create a unified settings layout with a shared template and consistent data-fetching patterns across all settings pages.

---

## Low Priority

### #9 — Remove Unimplemented OAuth Buttons

**Problem:** GitHub and Facebook OAuth buttons in the sign-in form have no event handlers or implementation. They appear functional but fail silently, creating a confusing user experience.

**Affected Files:**
- `src/features/auth/sign-in/components/user-auth-form.tsx`

**Recommended Fix:** Either remove the unimplemented OAuth buttons or implement the full OAuth integration with proper handlers and error feedback.

---

### #10 — Replace Inline SVGs in Dashboard with lucide-react Icons

**Problem:** The dashboard component contains raw inline SVG code (`src/features/dashboard/index.tsx`, lines 68–155) instead of using the lucide-react icon library that the rest of the app relies on.

**Affected Files:**
- `src/features/dashboard/index.tsx` (lines 68–155)

**Recommended Fix:** Replace all inline SVG definitions with corresponding lucide-react icons to maintain visual consistency and reduce code complexity.
