# Warframe Tracker Documentation

Welcome to the Warframe Tracker documentation. This feature is a comprehensive tool for tracking your Warframe game progress, including warframes, weapons, resources, and build plans.

---

## 📚 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture & Design](#architecture--design)
- [User Guide](#user-guide)
- [Developer Guide](#developer-guide)
- [Documentation Index](#documentation-index)

---

## Overview

The **Warframe Tracker** is a full-featured progression tracking system built into the home-app admin dashboard. It helps players track their collection, plan builds, manage resources, and stay updated with game news.

**Key Capabilities:**
- Track owned and mastered Warframes & Weapons
- Manage wishlist with component breakdown
- Inventory management with resource calculations
- Real-time news and events
- Recipe scraper for crafting data
- Export/Import and cloud sync via PocketBase

---

## Features

### 1. Overview Dashboard
**Route:** `/warframe-tracker`

Statistics dashboard showing:
- Total Warframes & Weapons
- Owned items count
- Mastered items count
- Wishlist count
- Quick navigation to sub-pages

### 2. News & Alerts
**Route:** `/warframe-tracker/news`

Real-time game information:
- Latest news from Warframe
- Active in-game events with countdown timers
- New releases (items released in last 90 days)
- Sorted and filtered by relevance

### 3. Warframes Library
**Route:** `/warframe-tracker/warframes`

Browse and manage Warframes:
- Grid view of all Warframes
- Search and filter capabilities
- Mark as Owned / Mastered
- Add to Wishlist
- Prime / Vaulted badges
- Detailed item dialog with stats and components
- Hide Owned / Hide Mastered toggles

### 4. Weapons Arsenal
**Route:** `/warframe-tracker/weapons`

Comprehensive weapons catalog:
- Category tabs (All, Primary, Secondary, Melee, Arch-Gun, Arch-Melee)
- Search and filtering
- Owned / Mastered / Wishlist tracking
- Item details with stats
- Same UI patterns as Warframes page

### 5. Resource Inventory
**Route:** `/warframe-tracker/resources`

Manage your crafting resources:
- List of all game resources
- Current quantity tracking (+/- controls)
- "Needed by Wishlist" calculations
- Shows which wishlist items need each resource
- "Need X more" vs "Enough" status indicators
- Filter: "Needed by Wishlist only" toggle

### 6. Wishlist Planner
**Route:** `/warframe-tracker/wishlist`

Build planning with detailed breakdowns:
- List of wishlist items
- Expandable component trees
- Shows owned vs needed components
- OK / Shortage badges
- Resource Breakdown sidebar
- Full nested material calculations
- Remove from wishlist option

### 7. Recipe Scraper
**Route:** `/warframe-tracker/recipe-scraper`

Developer tool for extracting crafting recipes:
- Batch URL processing from Warframe Wiki
- Real-time progress tracking
- Generates TypeScript code
- Copy to clipboard / Download features
- Pre-filled example URLs
- Backend Flask API integration

### 8. Data Management
**Route:** `/warframe-tracker/data-management`

Backup, restore, and migration:
- Export from Local Storage → JSON file
- Export from PocketBase → JSON file
- Import JSON → Local Storage
- Import JSON → PocketBase
- One-click migration: Local ↔ PocketBase
- Optional: Clear existing data before import
- Storage mode display (Local vs Cloud)

---

## Architecture & Design

### Data Sources

The Warframe Tracker uses a **hybrid data architecture**:

**1. Static Item Data (Primary)**
- **Source:** GitHub CDN (`WFCD/warframe-items`)
- **URL:** `https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/All.json`
- **Purpose:** Comprehensive, reliable item data
- **Benefits:** Works offline, 24h cache, no API keys needed

**2. Live Game Data (Secondary)**
- **Source:** WarframeStat.us API
- **URL:** `https://api.warframestat.us`
- **Purpose:** Real-time news, events, alerts
- **Fallback:** Returns empty arrays if API down (core functionality unaffected)

**3. Crafting Recipes (Manual)**
- **Source:** `src/lib/warframe-crafting-recipes.ts`
- **Purpose:** Nested material requirements for sub-blueprints
- **Update:** Recipe Scraper tool

### Storage Options

**Development (Default):**
- **Backend:** localStorage
- **Keys:** `wf-tracker-owned`, `wf-tracker-mastered`, `wf-tracker-wishlist`, `wf-tracker-resources`
- **Scope:** Device-specific

**Production (Optional):**
- **Backend:** PocketBase
- **Collections:** `warframe_owned_items`, `warframe_mastered_items`, `warframe_wishlist`, `warframe_resource_inventory`
- **Scope:** Cloud-synced, multi-device
- **Auth:** User isolation via `user_id` field

### Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19 + TypeScript |
| UI Library | Shadcn UI |
| Routing | TanStack Router |
| Server State | TanStack Query |
| HTTP Client | Axios |
| Backend | PocketBase (optional) |
| Recipe Scraper | Python Flask + BeautifulSoup |

### File Structure

```
src/features/warframe-tracker/
├── components/
│   ├── data-management-page.tsx
│   ├── item-card.tsx
│   ├── item-detail-dialog.tsx
│   ├── items-grid.tsx
│   ├── new-items-section.tsx
│   ├── news-card.tsx
│   ├── news-page.tsx
│   ├── owned-badge.tsx
│   ├── recipe-scraper-page.tsx
│   ├── resource-row.tsx
│   ├── resources-page.tsx
│   ├── warframes-page.tsx
│   ├── weapons-page.tsx
│   ├── wishlist-page.tsx
│   └── wishlist-summary.tsx
├── data/
│   ├── mutations.ts      # TanStack Query mutations
│   ├── queries.ts        # TanStack Query hooks
│   └── types.ts          # TypeScript type definitions
└── index.tsx             # Overview page

src/lib/
├── pocketbase.ts              # PocketBase client
├── tracker-export-import.ts   # Export/import utilities
├── tracker-storage.ts         # Storage abstraction layer
├── warframe-api.ts            # API client
└── warframe-crafting-recipes.ts # Manual crafting database

src/routes/_authenticated/warframe-tracker/
├── index.tsx
├── news.tsx
├── warframes.tsx
├── weapons.tsx
├── resources.tsx
├── wishlist.tsx
├── recipe-scraper.tsx
└── data-management.tsx

scripts/
├── api-server.py              # Flask REST API for scraper
├── scrape-warframe-recipes.py # CLI scraper
├── requirements.txt           # Python dependencies
├── BACKEND_SETUP.md          # Setup instructions
└── README.md                 # Scraper documentation
```

---

## User Guide

### Getting Started

1. **Navigate to Warframe Tracker**
   - Sidebar: Games → Warframe Tracker → Overview

2. **Browse Warframes/Weapons**
   - Click "Warframes" or "Weapons" from Overview
   - Search or filter items
   - Click on a card to view details

3. **Mark Items as Owned**
   - Click the "Own" button on any item card
   - Green border and "Owned" badge will appear
   - Item tracked in localStorage (dev) or PocketBase (prod)

4. **Mark Items as Mastered**
   - Click the Award icon on owned items
   - Amber border and Award badge will appear
   - Mastery progress tracked

5. **Add to Wishlist**
   - Click the Heart icon on any item
   - View all wishlist items at `/warframe-tracker/wishlist`
   - See component breakdown and resource requirements

6. **Manage Resources**
   - Go to "Inventory" page
   - Use +/- buttons or type quantity directly
   - Click checkmark to save
   - See "Need X more" status for wishlist items

### Advanced Features

**Export Your Data:**
1. Go to Data Management page
2. Click "Export from Local Storage" (or PocketBase)
3. Save JSON file as backup

**Import Data:**
1. Go to Data Management page
2. Choose import source (Local or PocketBase)
3. Upload JSON file
4. Toggle "Clear existing data" if needed
5. Click Import

**Migrate to Cloud (PocketBase):**
1. Set up PocketBase (see POCKETBASE_SCHEMA.md)
2. Log in to your app
3. Go to Data Management
4. Click "Migrate Local → PocketBase (Cloud)"
5. Your data is now synced!

**View Resource Breakdown:**
1. Add items to wishlist
2. Go to Wishlist page
3. Expand an item to see component tree
4. View Resource Breakdown sidebar for aggregated materials

---

## Developer Guide

### Setup

**1. Install Dependencies**
```bash
pnpm install
```

**2. Start Development Server**
```bash
pnpm dev
```

**3. (Optional) Set up PocketBase**
```bash
# Download PocketBase from https://pocketbase.io
./pocketbase serve

# Or use Docker
docker run -p 8090:8090 pocketbase/pocketbase
```

**4. Configure Environment**
```bash
# .env.local
VITE_POCKETBASE_URL=http://localhost:8090
```

### Adding New Features

**1. Create Component**
```bash
# Add to src/features/warframe-tracker/components/
touch src/features/warframe-tracker/components/my-new-page.tsx
```

**2. Add Route**
```bash
# Add to src/routes/_authenticated/warframe-tracker/
touch src/routes/_authenticated/warframe-tracker/my-new-page.tsx
```

**3. Update Sidebar**
```typescript
// src/components/layout/data/sidebar-data.ts
{
  title: 'My New Page',
  url: '/warframe-tracker/my-new-page',
  icon: MyIcon,
}
```

### Using TanStack Query Hooks

**Fetch All Items:**
```typescript
import { useAllItems } from '@/features/warframe-tracker/data/queries'

const { data: items, isLoading, error } = useAllItems()
```

**Fetch Warframes:**
```typescript
import { useWarframes } from '@/features/warframe-tracker/data/queries'

const { data: warframes } = useWarframes()
```

**Check if Item is Owned:**
```typescript
import { useIsOwned } from '@/features/warframe-tracker/data/queries'

const isOwned = useIsOwned(item.uniqueName)
```

**Add to Wishlist:**
```typescript
import { useAddToWishlist } from '@/features/warframe-tracker/data/mutations'

const addToWishlist = useAddToWishlist()

addToWishlist.mutate({
  uniqueName: item.uniqueName,
  itemName: item.name,
  category: item.category,
})
```

### Adding Crafting Recipes

**Manual Method:**
```typescript
// src/lib/warframe-crafting-recipes.ts
'My New Item Component': {
  itemName: 'My New Item Component',
  credits: 15000,
  ingredients: [
    { name: 'Resource Name', quantity: 100 },
    // ...
  ],
},
```

**Automated Method (Recommended):**
1. Start Flask backend: `cd scripts && python api-server.py`
2. Navigate to `/warframe-tracker/recipe-scraper`
3. Add Warframe Wiki URLs
4. Click "Scrape All"
5. Copy generated TypeScript code
6. Paste into `src/lib/warframe-crafting-recipes.ts`

### Testing

**Build & Lint:**
```bash
pnpm lint
pnpm format
pnpm build
```

**Manual Testing Checklist:**
- [ ] Overview page loads stats
- [ ] Warframes page displays items
- [ ] Weapons page tabs work
- [ ] Mark items owned/mastered
- [ ] Add to wishlist
- [ ] Update resource quantities
- [ ] Export/import data
- [ ] Migrate Local ↔ PocketBase

---

## Documentation Index

### Architecture Documents
- **[DATA_ARCHITECTURE.md](./DATA_ARCHITECTURE.md)** - Detailed data architecture and API integration
- **[GITHUB_FIRST_ARCHITECTURE.md](./GITHUB_FIRST_ARCHITECTURE.md)** - GitHub CDN-first design rationale

### Feature Implementation
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Complete feature implementation overview
- **[WARFRAME_NESTED_MATERIALS_FIX.md](./WARFRAME_NESTED_MATERIALS_FIX.md)** - Nested component materials solution

### Backend & Database
- **[POCKETBASE_SCHEMA.md](./POCKETBASE_SCHEMA.md)** - PocketBase collection schemas and migration
- **[RECIPE_SCRAPER_INTEGRATION.md](./RECIPE_SCRAPER_INTEGRATION.md)** - Recipe scraper setup and usage

### Testing & Quality
- **[WARFRAME_TRACKER_TEST_REPORT.md](./WARFRAME_TRACKER_TEST_REPORT.md)** - Comprehensive testing report and bug fixes

---

## Troubleshooting

### Common Issues

**1. "Unable to load Warframe item data"**
- Check internet connection
- Verify GitHub CDN is accessible
- Clear browser cache and reload

**2. News/Events not loading**
- This is expected if WarframeStat.us API is down
- Core functionality (items, wishlist, inventory) still works
- Wait for API to recover

**3. Wishlist resource calculations incomplete**
- Ensure crafting recipes are in `warframe-crafting-recipes.ts`
- Use Recipe Scraper to add missing recipes
- Check console for missing recipe warnings

**4. PocketBase connection errors**
- Verify PocketBase is running
- Check `VITE_POCKETBASE_URL` in `.env.local`
- Ensure collections are created (see POCKETBASE_SCHEMA.md)

**5. Recipe Scraper not responding**
- Start Flask backend: `cd scripts && python api-server.py`
- Check backend is on port 5000
- Look for CORS errors in browser console

---

## Contributing

### Adding Crafting Recipes
1. Use Recipe Scraper tool or manually add to `warframe-crafting-recipes.ts`
2. Test with wishlist calculations
3. Submit PR with new recipes

### Reporting Bugs
1. Check existing issues in GitHub
2. Provide detailed reproduction steps
3. Include browser console errors
4. Note your storage mode (Local vs PocketBase)

### Feature Requests
1. Describe the use case
2. Provide UI mockups if applicable
3. Consider data source requirements
4. Check feasibility with existing APIs

---

## Credits

**Data Sources:**
- [WFCD/warframe-items](https://github.com/WFCD/warframe-items) - Community-maintained item database
- [WarframeStat.us](https://docs.warframestat.us) - Live game state API
- [Warframe Wiki](https://warframe.fandom.com) - Crafting recipes

**Built with:**
- [React](https://react.dev)
- [Shadcn UI](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query)
- [PocketBase](https://pocketbase.io)

---

## License

Part of the [home-app](../../README.md) project. Licensed under MIT.
