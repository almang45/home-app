# AGENTS.md — Shadcn Admin Dashboard (home-app)

## Project Overview

An admin dashboard built with **React 19**, **TypeScript**, **Vite**, and **Shadcn UI**. Features include light/dark mode, responsive layout, accessibility, global search (cmdk), RTL support, and 10+ pages (Dashboard, Users, Tasks, Settings, Chats, Apps, Help Center, error pages).

**Special Features:**
- **Warframe Tracker** - Full-featured game progression tracking system with cloud sync capabilities (see `docs/games/warframe/`)

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
├── features/          # Feature modules (auth, dashboard, users, tasks, settings, chats, apps, errors, warframe-tracker, etc.)
│   └── warframe-tracker/  # Warframe game progression tracker (see docs/games/warframe/)
├── hooks/             # Custom React hooks
├── lib/               # Utilities (cn, cookies, handleServerError, warframe-api, tracker-storage, etc.)
├── routes/            # TanStack Router file-based routes
│   ├── __root.tsx
│   ├── _authenticated/    # Protected routes wrapped in AuthenticatedLayout
│   │   └── warframe-tracker/  # Warframe tracker routes (8 pages)
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
- **PocketBase** is the backend. API integration patterns exist in feature directories.
- **Clerk** is partially integrated for auth. The primary auth flow uses a custom Zustand store with cookie-backed tokens.
- **`@faker-js/faker`** is a dev dependency used for mock/seed data — do not include in production bundles.

---

## Warframe Tracker Feature

A comprehensive game progression tracking system located in `src/features/warframe-tracker/`.

### Overview

The Warframe Tracker helps Warframe players track their collection, plan builds, manage resources, and stay updated with game news. It uses a hybrid data architecture with GitHub CDN for static item data and localStorage/PocketBase for user data.

### Key Components

**Pages (8 total):**
1. **Overview** (`/warframe-tracker`) - Dashboard with statistics
2. **News & Alerts** (`/warframe-tracker/news`) - Real-time game news and events
3. **Warframes** (`/warframe-tracker/warframes`) - Browse and track Warframes
4. **Weapons** (`/warframe-tracker/weapons`) - Browse and track weapons by category
5. **Resources** (`/warframe-tracker/resources`) - Inventory management
6. **Wishlist** (`/warframe-tracker/wishlist`) - Build planner with component breakdown
7. **Recipe Scraper** (`/warframe-tracker/recipe-scraper`) - Developer tool for extracting crafting data
8. **Data Management** (`/warframe-tracker/data-management`) - Export/import and cloud sync

**Data Flow:**
```
GitHub CDN (Static Items) → TanStack Query Cache → React Components
                                    ↓
                     localStorage or PocketBase (User Data)
```

**Storage Abstraction:**
- `src/lib/tracker-storage.ts` - Unified interface for localStorage and PocketBase
- Auto-detects auth state and switches storage backend
- `LocalStorageTracker` - Device-specific storage (default)
- `PocketBaseTracker` - Cloud-synced storage (when authenticated)

**Data Sources:**
- **Static Items**: GitHub CDN (`WFCD/warframe-items`) - Cached 24h
- **Live Data**: WarframeStat.us API - News, events, alerts
- **Crafting Recipes**: Manual database (`src/lib/warframe-crafting-recipes.ts`)

**TanStack Query Hooks:**
- `useAllItems()` - All items from GitHub CDN
- `useWarframes()` - Filtered Warframes
- `useWeapons(category?)` - Filtered weapons by category
- `useResources()` - All resources
- `useOwnedItems()` - User's owned items
- `useMasteredItems()` - User's mastered items
- `useWishlistItems()` - User's wishlist
- `useResourceInventory()` - User's resource quantities
- `useEnrichedWishlistItems()` - Wishlist with full component trees
- `useWarframeNews()` - Live news from API
- `useWarframeEvents()` - Live events from API

**Mutations:**
- `useAddOwnedItem()` / `useRemoveOwnedItem()`
- `useAddMasteredItem()` / `useRemoveMasteredItem()`
- `useAddToWishlist()` / `useRemoveFromWishlist()`
- `useUpdateResourceQuantity()`

### Developer Guidelines

**Adding Warframe Features:**
1. Create components in `src/features/warframe-tracker/components/`
2. Add routes in `src/routes/_authenticated/warframe-tracker/`
3. Use existing TanStack Query hooks from `data/queries.ts`
4. Follow storage abstraction patterns from `tracker-storage.ts`
5. Update sidebar navigation in `src/components/layout/data/sidebar-data.ts`

**Data Fetching Patterns:**
```typescript
// Good: Use existing hooks
const { data: warframes } = useWarframes()
const isOwned = useIsOwned(item.uniqueName)

// Bad: Direct API calls
const warframes = await fetchWarframes() // Don't do this
```

**Mutation Patterns:**
```typescript
// Good: Use mutations with automatic invalidation
const addOwned = useAddOwnedItem()
addOwned.mutate({ uniqueName, itemName, category })

// Bad: Direct storage manipulation
trackerStorage.addOwnedItem(...) // Don't do this directly
```

**Recipe Management:**
- Use Recipe Scraper tool (`/warframe-tracker/recipe-scraper`) to extract recipes from Warframe Wiki
- Generated TypeScript code goes into `src/lib/warframe-crafting-recipes.ts`
- Backend Flask API in `scripts/api-server.py` for web scraping

**PocketBase Setup:**
- Schema and migration scripts in `docs/games/warframe/POCKETBASE_SCHEMA.md`
- Collections: `warframe_owned_items`, `warframe_mastered_items`, `warframe_wishlist`, `warframe_resource_inventory`
- User isolation via `user_id` field
- API rules enforce authentication and user-owned data access

### Documentation

Complete documentation in `docs/games/warframe/`:
- `README.md` - Feature overview and user guide
- `DATA_ARCHITECTURE.md` - Data architecture and API integration
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `POCKETBASE_SCHEMA.md` - Database schema
- `RECIPE_SCRAPER_INTEGRATION.md` - Recipe scraper setup
- `WARFRAME_NESTED_MATERIALS_FIX.md` - Nested materials solution
- `WARFRAME_TRACKER_TEST_REPORT.md` - Testing report

### Common Patterns

**Check ownership status:**
```typescript
const isOwned = useIsOwned(item.uniqueName)
const isMastered = useIsMastered(item.uniqueName)
const isInWishlist = useIsInWishlist(item.uniqueName)
```

**Toggle states:**
```typescript
const addOwned = useAddOwnedItem()
const removeOwned = useRemoveOwnedItem()

const handleToggle = () => {
  if (isOwned) {
    removeOwned.mutate(item.uniqueName)
  } else {
    addOwned.mutate({ uniqueName, itemName, category })
  }
}
```

**Resource calculations:**
```typescript
const enrichedItems = useEnrichedWishlistItems()
// enrichedItems includes full component trees with nested materials
```

### Conventions

- **File names**: `kebab-case` (e.g., `wishlist-summary.tsx`)
- **Components**: Export as named functions (e.g., `export function WishlistPage()`)
- **Types**: Define in `data/types.ts`
- **Queries**: Define in `data/queries.ts`
- **Mutations**: Define in `data/mutations.ts`
- **Storage**: Use `trackerStorage` abstraction from `src/lib/tracker-storage.ts`
- **Icons**: Use Lucide icons (Shield, Crosshair, Package, Award, Heart, etc.)

### Performance Considerations

- Items cached in TanStack Query for 24h (GitHub CDN data)
- News/events cached for 5 minutes (live data)
- localStorage reads are synchronous (fast)
- PocketBase queries cached per TanStack Query defaults
- Enriched wishlist items fetch sub-components individually (may trigger multiple API lookups)
- Consider batching or lazy-loading for large wishlists
