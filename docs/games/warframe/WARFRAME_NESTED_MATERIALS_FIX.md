# Warframe Tracker - Nested Materials Fix

## Summary of Changes

This document explains the fixes made to address nested material breakdown in the wishlist and inventory pages.

## Issues Fixed

### 1. Wishlist Resource Breakdown
**Problem**: Sub-components (Chassis, Neuroptics, Systems) weren't showing their required materials in the breakdown.

**Root Cause**: The WFCD warframe-items data source doesn't include nested crafting recipes for sub-components. The main "Khora Prime" entry lists its components, but those components don't have their own `components` field with the materials they require.

**Solution**: Implemented a manual crafting recipes database (`src/lib/warframe-crafting-recipes.ts`) that stores the materials required for each sub-component. The enrichment logic now uses this database to populate nested materials.

**Files Changed**:
- `src/features/warframe-tracker/data/queries.ts` - Updated `useEnrichedWishlistItems()` to use manual crafting database
- `src/lib/warframe-crafting-recipes.ts` - New file with crafting recipes database
- `src/features/warframe-tracker/components/wishlist-summary.tsx` - Set default expand state to `true` for full breakdown
- `src/features/warframe-tracker/components/wishlist-page.tsx` - Set default expand state to `true` for full breakdown

### 2. Inventory Page Component Names
**Problem**: Resources showed "Blueprint for Khora Prime Chassis" instead of just "Khora Prime Chassis".

**Solution**: Added string replacement in the `ResourceRow` component to remove the "Blueprint for" prefix.

**Files Changed**:
- `src/features/warframe-tracker/components/resource-row.tsx` - Added `.replace(/^Blueprint for\s+/i, '')` to clean up names
- `src/features/warframe-tracker/data/queries.ts` - Updated `addComponentResources()` to properly track full component names

## Adding More Crafting Recipes

The crafting recipes database is in `src/lib/warframe-crafting-recipes.ts`. To add more recipes:

### Manual Addition
```typescript
'Warframe Name Component': {
  itemName: 'Warframe Name Component',
  credits: 15000,
  ingredients: [
    { name: 'Resource Name', quantity: 100 },
    // ... more ingredients
  ],
},
```

### Data Source for Recipes
Crafting recipes can be found at:
- **Warframe Wiki**: https://warframe.fandom.com
- Example: https://warframe.fandom.com/wiki/Khora_Prime

### Automated Scraping (TODO)
Consider implementing a scraper for the Warframe Wiki to automatically populate the `CRAFTING_RECIPES` database. This would require:
1. Wiki API integration or web scraping
2. Parsing the crafting tables
3. Mapping ingredient names to match the WFCD data format

## Testing

1. Add an item to your wishlist (e.g., "Khora Prime")
2. Navigate to the Wishlist page
3. Expand the item to see the full breakdown
4. Verify that sub-components (Chassis, Neuroptics, Systems) show their required materials
5. Navigate to the Inventory/Resources page
6. Verify that resources show proper component names without "Blueprint for" prefix

## Known Limitations

1. **Incomplete Recipe Database**: Only Khora Prime components are currently in the database. More recipes need to be added.
2. **Manual Maintenance**: The crafting database requires manual updates when new items are released or recipes change.
3. **Data Freshness**: The WFCD data updates automatically, but our crafting database is static.

## Future Improvements

1. **Wiki Scraper**: Implement automated scraping of Warframe Wiki for crafting recipes
2. **Community Contributions**: Create a PR template for users to contribute recipes
3. **Recipe Validation**: Add tests to ensure recipe data matches game data
4. **Alternative APIs**: Research if there are better data sources that include nested crafting materials
