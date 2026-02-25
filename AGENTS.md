# AGENTS.md — Shadcn Admin Dashboard (home-app)

## Project Overview

An admin dashboard built with **React 19**, **TypeScript**, **Vite**, and **Shadcn UI**. Features include light/dark mode, responsive layout, accessibility, global search (cmdk), RTL support, and 10+ pages (Dashboard, Users, Tasks, Settings, Chats, Apps, Help Center, error pages).

**Special Features:**
- **Finance** - Kakeibo-style personal finance tracker with budgets, debts, and subscriptions (see `docs/features/finance/`)
- **Inventory** - Home supplies tracker with AI receipt scanning and PDF shopping lists (see `docs/features/inventory/`)
- **HTML Viewer** - Browse and open local HTML files (see `docs/features/html-viewer/`)

**Based on**: [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin)

---

## Tech Stack

| Category           | Technology                                        |
| ------------------ | ------------------------------------------------- |
| Framework          | React 19                                          |
| Build Tool         | Vite 7                                            |
| Language           | TypeScript 5.9                                    |
| UI Library         | Shadcn UI (Tailwind CSS 4 + Radix UI)             |
| Routing            | TanStack Router (file-based)                      |
| Server State       | TanStack Query (React Query)                      |
| Client State       | Zustand                                           |
| Forms              | React Hook Form + Zod                             |
| HTTP Client        | Axios                                             |
| Auth               | Clerk (partial) + custom auth store               |
| Tables             | TanStack Table                                    |
| Charts             | Recharts                                          |
| Backend/BaaS       | PocketBase                                        |
| Package Manager    | pnpm                                              |
| Linting/Formatting | ESLint 9 (flat config) + Prettier                 |

---

## Directory Structure

```
src/
├── assets/            # Brand icons, custom assets
├── components/
│   ├── ui/            # Shadcn UI primitives (do NOT modify without reason)
│   ├── layout/        # AppSidebar, Header, Main, ProfileDropdown
│   └── data-table/    # Reusable table components
├── config/            # App-level configuration
├── context/           # React context providers (theme, direction, font, layout, search)
├── features/          # Feature modules (auth, dashboard, users, tasks, settings, chats, apps, errors, finance, inventory, html-viewer, etc.)
│   ├── finance/           # Kakeibo-style personal finance tracker (see docs/features/finance/)
│   ├── inventory/         # Home supplies inventory with AI receipt scanning (see docs/features/inventory/)
│   └── html-viewer/       # Local HTML file browser (see docs/features/html-viewer/)
├── hooks/             # Custom React hooks
├── lib/               # Utilities (cn, cookies, handleServerError, pocketbase, gemini, etc.)
├── routes/            # TanStack Router file-based routes
│   ├── __root.tsx
│   ├── _authenticated/    # Protected routes wrapped in AuthenticatedLayout
│   │   ├── finance/       # Finance dashboard route
│   │   ├── inventory/     # Inventory routes (supplies, purchases)
│   │   └── html-viewer/   # HTML Viewer route
│   ├── (auth)/            # Sign-in, sign-up, OTP, forgot-password
│   ├── (errors)/          # 401, 403, 404, 500, 503 pages
│   └── clerk/             # Clerk auth routes
├── stores/            # Zustand stores
├── styles/            # Global CSS, theme variables
├── main.tsx           # App entry point
└── routeTree.gen.ts   # Auto-generated — NEVER edit manually
```

---

## Key Conventions

### File and Naming

- **File names**: `kebab-case` (e.g., `user-profile.tsx`, `auth-store.ts`).
- **Components**: PascalCase exports (e.g., `export function UserProfile()`).
- **Hooks**: camelCase prefixed with `use` (e.g., `useAuth`, `useTheme`).
- **Stores**: camelCase prefixed with `use` (e.g., `useAuthStore`).
- **Path alias**: Use `@/*` which resolves to `src/*`. Never use relative `../../` paths crossing more than one level.

### Component Patterns

- Use **functional components** only. No class components.
- Prefer **named exports** over default exports.
- Colocate feature-specific components inside `src/features/<feature>/components/`.
- Shared, reusable components go in `src/components/`.
- Shadcn primitives live in `src/components/ui/` — customize sparingly and document RTL changes.

### State Management

- **Zustand** for global client state (auth, UI preferences). Keep stores minimal.
- **TanStack Query** for all server/async state. Never store server data in Zustand.
- **React Context** for theme, direction (RTL), font, layout, and search. Do not use context for frequently changing state.

### Routing

- Routes are file-based via TanStack Router. Add new routes by creating files in `src/routes/`.
- `routeTree.gen.ts` is **auto-generated** — never edit it manually.
- Protected routes go under `src/routes/_authenticated/`.
- Error pages go under `src/routes/(errors)/`.

### Forms and Validation

- Use **React Hook Form** with **Zod** schemas via `@hookform/resolvers`.
- Define Zod schemas close to the form that uses them, typically in the feature directory.

### Styling

- **Tailwind CSS 4** with utility classes. No custom CSS unless absolutely necessary.
- Use the `cn()` helper from `@/lib/utils` for conditional class merging.
- Follow existing theme variables in `src/styles/theme.css`.
- Use `tw-animate-css` for animations.

### Error Handling

- Use `handleServerError` from `@/lib/handle-server-error` for API error responses.
- TanStack Query's global `QueryCache` handles 401/403 redirects automatically.
- All user-facing errors should display via `sonner` toasts or dedicated error pages.

---

## Development Workflow

### Commands

| Command              | Description                   |
| -------------------- | ----------------------------- |
| `pnpm dev`           | Start Vite dev server         |
| `pnpm build`         | Type-check and build for prod |
| `pnpm lint`          | Run ESLint                    |
| `pnpm format`        | Format code with Prettier     |
| `pnpm format:check`  | Check formatting              |
| `pnpm preview`       | Preview production build      |
| `pnpm knip`          | Detect unused exports/deps    |

### Before Committing

1. Run `pnpm lint` and fix all errors.
2. Run `pnpm format:check` (or `pnpm format` to auto-fix).
3. Run `pnpm build` to ensure no TypeScript errors.
4. Follow **conventional commits** (configured via Commitizen in `cz.yaml`).

### CI Pipeline

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `main`:
- Checkout → Node 20 → pnpm → install (frozen lockfile) → lint → format check → build.

### Deployment

- Deployed to **Netlify** (SPA mode with `/*` → `/index.html` redirect).
- Config in `netlify.toml`.

---

## Adding a New Feature

1. Create a directory under `src/features/<feature-name>/`.
2. Add route files under `src/routes/_authenticated/<feature-name>/`.
3. Define API queries/mutations using TanStack Query inside the feature directory.
4. Add navigation entries in `src/components/layout/data/sidebar-data.ts` (or equivalent config).
5. Use existing Shadcn components from `src/components/ui/` — add new ones via `npx shadcn@latest add <component>`.

---

## Important Notes

- **No test framework** is currently configured. If adding tests, prefer Vitest + React Testing Library.
- **`src/components/ui/`** contains customized Shadcn components (RTL support, behavior tweaks). Review existing customizations before modifying.
- **PocketBase** is the backend. API integration patterns exist in feature directories. Client configured in `src/lib/pocketbase.ts`.
- **Clerk** is partially integrated for auth. The primary auth flow uses a custom Zustand store with cookie-backed tokens.
- **`@faker-js/faker`** is a dev dependency used for mock/seed data — do not include in production bundles.
- **Google Gemini API** (`@google/generative-ai`) is used for AI receipt scanning in the Inventory feature. Requires `VITE_GEMINI_API_KEY`.
- **jsPDF + jspdf-autotable** are used for PDF report generation in the Inventory feature.

---

## Finance Feature

A Kakeibo-style personal finance management system at `/finance`.

### Overview

Tracks income/expenses across multiple financial sources (bank, savings, credit card, e-wallet, cash) using a tabbed dashboard. Categorizes spending using the Japanese Kakeibo method (needs, wants, culture, unexpected, savings).

### Tabs

1. **Overview** — Recent transactions + balance summary
2. **Accounts** — Manage financial sources (bank accounts, wallets)
3. **Budget** — Monthly budgets per spending category
4. **Debts** — Payable and receivable debt tracking
5. **Subs** — Recurring subscription tracker
6. **Analysis** — Monthly summary + Kakeibo reflection journal

### PocketBase Collections

| Collection | Purpose |
|---|---|
| `finance_sources` | Financial accounts |
| `finance_categories` | Transaction categories (income/expense) |
| `finance_subcategories` | Sub-categories linked to categories |
| `finance_transactions` | All income/expense records |
| `finance_budgets` | Monthly budget targets |
| `finance_debts` | Debt tracker |
| `finance_subscriptions` | Recurring subscriptions |
| `finance_reflections` | Monthly Kakeibo journal entries |

### Key Files

- `src/features/finance/data/schema.ts` — Zod schemas + TypeScript types
- `src/features/finance/data/api.ts` — All PocketBase API calls
- `src/features/finance/components/finance-dashboard.tsx` — Main entry point

### Developer Guidelines

1. Add new finance sub-features as tabs or components in `src/features/finance/components/`
2. Define types and schemas in `data/schema.ts`
3. Add API functions in `data/api.ts` following existing patterns
4. Balance updates happen automatically inside `createTransaction()` — always use this function

**Transaction Patterns:**
```typescript
// Single transaction (updates source balance automatically)
await createTransaction({ amount, type, category, source_id, date })

// Bulk transactions (sequential, each updates balance)
await createBulkTransactions([tx1, tx2, tx3])

// Upsert budget/reflection (creates or updates)
await setBudget({ category, amount, month: '2026-02' })
await saveReflection({ month: '2026-02', content: '...' })
```

**Documentation:** `docs/features/finance/README.md`

---

## Inventory Feature

A home supplies inventory tracker at `/inventory/supplies` and `/inventory/purchases`.

### Overview

Tracks groceries and home supplies with stock levels, low-stock alerts, and purchase history. Includes AI-powered receipt scanning (Gemini API) and PDF shopping list generation.

### Pages

1. **Supplies** (`/inventory/supplies`) — Item grid with stock controls, search, category filter
2. **Purchases** (`/inventory/purchases`) — Log shopping trips; view grouped purchase history

### PocketBase Collections

| Collection | Purpose |
|---|---|
| `items_inventory` | Item catalog with stock levels |
| `items_purchases` | Purchase line items grouped by trip |
| `items_categories` | Item categories |
| `items_locations` | Storage locations (kitchen, bathroom, etc.) |

### Key Files

- `src/features/inventory/components/inventory-manager.tsx` — Supplies page
- `src/routes/_authenticated/inventory/purchases.tsx` — Purchases page (inline)
- `src/lib/gemini.ts` — Gemini AI receipt parsing

### Developer Guidelines

1. Use `pb` from `@/lib/pocketbase` directly (no TanStack Query abstraction layer)
2. Always expand relations: `expand: 'stored_in,category'`
3. When recording a purchase, update both `items_purchases` and `items_inventory.current_stock`
4. Gemini API key required in `.env`: `VITE_GEMINI_API_KEY`

```typescript
// Pattern for fetching with relations
const records = await pb.collection('items_inventory').getFullList({
  sort: 'name',
  expand: 'stored_in,category',
})
```

**Documentation:** `docs/features/inventory/README.md`

---

## HTML Viewer Feature

A static HTML file browser at `/html-viewer`.

### Overview

Displays a searchable grid of registered HTML files from `public/html-files/`. Files open in a new browser tab. No backend required.

### Adding Files

1. Place HTML file in `public/html-files/`
2. Register in `src/features/html-viewer/data/files.ts`

```typescript
// src/features/html-viewer/data/files.ts
export const htmlFiles: HtmlFile[] = [
  {
    id: '6',
    name: 'My Report',
    description: 'Description here',
    path: '/html-files/my-report.html',
    createdAt: '2026-02-25',
    size: '120 KB',
  },
]
```

**Documentation:** `docs/features/html-viewer/README.md`
