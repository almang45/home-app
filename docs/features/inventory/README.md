# Inventory Feature

A home supplies and grocery inventory management system. Track stock levels, record purchases with a shopping history, generate PDF shopping lists, and scan receipts with AI.

## Overview

The Inventory feature has two main pages:

- **Supplies** (`/inventory/supplies`) — Manage your item catalog with stock levels
- **Purchases** (`/inventory/purchases`) — Record shopping trips and view purchase history

Both pages are powered by PocketBase and optionally use the Google Gemini API for AI receipt scanning.

## Features

### Supplies Page (`InventoryManager`)

- Grid view of all inventory items with stock indicators
- Color-coded cards: green border = adequate stock, red border = low stock
- **LOW STOCK** badge with pulse animation when stock ≤ min_threshold
- Search by name or brand
- Filter by category
- Consume stock (decrement by 1 with `-` button)
- Restock item (opens `PurchaseModal` to record a purchase)
- Add new item (via `InventoryForm`)
- Edit existing item (hover to reveal edit button → `InventoryForm`)
- Bulk add multiple items at once (`BulkAddDialog`)
- Generate PDF shopping list (`ReportDialog` → jsPDF)

### Purchases Page (`PurchasesPage`)

**New Purchase Tab:**
- Log a shopping trip with store name, date, and multiple items
- Items linked to inventory via searchable combobox
- Auto-fills last price when item is selected
- **AI Receipt Scanning**: Upload a receipt photo → Gemini API extracts store name, date, and all items automatically
- Scanned items that don't match inventory show a yellow "Scanned: [name]" hint

**History Tab:**
- Grouped purchase history by trip (same store + date = one group via `group_id`)
- Collapsible rows showing individual item breakdown
- Total spend per trip

### PDF Report

Generated via `jsPDF` + `jspdf-autotable`:
- Title: "HomeOS Shopping List"
- Columns: Item Name, Brand, Location, Stock/Goal, Est. Price
- Option to include all items OR only low-stock items

## Data Architecture

### Backend: PocketBase

| Collection | Purpose |
|---|---|
| `items_inventory` | Catalog of tracked items with stock levels |
| `items_purchases` | Individual purchase line items grouped by trip |
| `items_categories` | Item categories (used for filtering) |
| `items_locations` | Storage locations (kitchen, bathroom, etc.) |

### Item Fields (`items_inventory`)
- `name` (text)
- `brand` (text)
- `category` (relation → items_categories)
- `stored_in` (relation → items_locations)
- `current_stock` (number)
- `min_threshold` (number) – triggers LOW STOCK warning
- `last_price` (number)

### Purchase Fields (`items_purchases`)
- `item` (relation → items_inventory)
- `price` (number, per unit)
- `quantity` (number)
- `store_name` (text)
- `buy_date` (date)
- `group_id` (text) – groups line items into a single shopping trip
- `user` (relation → users)

### Purchase Grouping

Purchases are grouped by `group_id` (generated from store + date + random suffix):
```
group_id = `${dateStr}_${cleanStoreName}_${randomSuffix}`
// e.g. "2026_02_25_Walmart_x7f3ab12"
```

On record, each item in the trip shares the same `group_id`. The History tab groups by this ID to reconstruct the full shopping session.

### Stock Update on Purchase

When a purchase is recorded:
1. A `items_purchases` record is created
2. The linked `items_inventory` record is updated:
   - `current_stock` increases by quantity purchased
   - `last_price` is updated to the price paid

## File Structure

```
src/features/inventory/
└── components/
    ├── inventory-manager.tsx  # Main supplies list + grid
    ├── inventory-form.tsx     # Add/edit item dialog
    ├── purchase-modal.tsx     # Restock item (single purchase)
    ├── bulk-add-dialog.tsx    # Bulk add multiple new items
    └── report-dialog.tsx      # PDF report options dialog

src/routes/_authenticated/inventory/
├── supplies.tsx               # Route → InventoryManager
└── purchases.tsx              # Route → PurchasesPage (inline component)
```

## AI Receipt Scanning (`src/lib/gemini.ts`)

Uses **Google Gemini 1.5 Flash** to extract structured data from receipt photos.

### Setup

```bash
# .env.local
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### What it extracts
```json
{
  "store_name": "Walmart",
  "buy_date": "2026-02-25",
  "items": [
    { "name": "Milk 2%", "quantity": 2, "price": 3.49 },
    { "name": "Bread", "quantity": 1, "price": 2.99 }
  ]
}
```

### Matching Logic

After scanning, each extracted item is auto-matched to existing inventory items by name similarity. If no match is found, the scanned name is shown as a yellow hint and the user must manually select the inventory item.

## Dependencies

| Package | Purpose |
|---|---|
| `jspdf` | PDF generation |
| `jspdf-autotable` | Table formatting in PDFs |
| `@google/generative-ai` | Gemini AI for receipt scanning |
| `pocketbase` | Backend data layer |

## Developer Guidelines

### Adding Inventory Features

1. Create components in `src/features/inventory/components/`
2. Add new routes in `src/routes/_authenticated/inventory/`
3. Use direct PocketBase calls via `pb` from `@/lib/pocketbase`
4. Update sidebar in `src/components/layout/data/sidebar-data.ts`

### PocketBase Usage Pattern

```typescript
import pb from '@/lib/pocketbase'

// Fetch with relations expanded
const records = await pb.collection('items_inventory').getFullList({
  sort: 'name',
  expand: 'stored_in,category',
})

// Update stock
await pb.collection('items_inventory').update(id, {
  current_stock: newStock,
  last_price: price,
})
```

## PocketBase Setup

### Required Collections

**`items_categories`**
- `name` (text, required)

**`items_locations`**
- `name` (text, required)

**`items_inventory`**
- `name` (text, required)
- `brand` (text)
- `category` (relation → items_categories)
- `stored_in` (relation → items_locations)
- `current_stock` (number, default 0)
- `min_threshold` (number, default 1)
- `last_price` (number)

**`items_purchases`**
- `item` (relation → items_inventory)
- `price` (number)
- `quantity` (number)
- `store_name` (text)
- `buy_date` (date)
- `group_id` (text)
- `user` (relation → users)

## Troubleshooting

### PDF not generating
- Ensure `jspdf` and `jspdf-autotable` are installed
- Check browser console for errors
- Verify at least one item exists

### Receipt scan fails
- Check `VITE_GEMINI_API_KEY` is set in `.env`
- Ensure the image is a clear, well-lit receipt photo
- The Gemini API requires an active internet connection

### Items not updating after purchase
- PocketBase must be running and accessible
- Check browser console for API errors
- Verify the item exists in `items_inventory`
