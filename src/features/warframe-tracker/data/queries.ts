import { useQuery } from '@tanstack/react-query'
import { trackerStorage } from '@/lib/tracker-storage'
import {
  fetchAllItems,
  fetchNews,
  fetchEvents,
  filterByCategory,
  getRecentlyReleasedItems,
} from '@/lib/warframe-api'
import {
  getCraftingRecipe,
  type CraftingIngredient,
} from '@/lib/warframe-crafting-recipes'
import {
  getCachedBlueprintDB,
  lookupBlueprint,
  type WikiaBlueprintDB,
} from '@/lib/wikia-blueprint-scraper'
import {
  ALL_TRACKABLE_CATEGORIES,
  type ItemCategory,
  type ItemComponent,
  type WarframeItem,
} from './types'

const STALE_24H = 1000 * 60 * 60 * 24

const DEFAULT_USER_ID = 'local-user'

export function useAllItems() {
  return useQuery({
    queryKey: ['warframe', 'items'],
    queryFn: fetchAllItems,
    staleTime: STALE_24H,
    gcTime: STALE_24H,
  })
}

export function useWarframes() {
  const query = useAllItems()
  return {
    ...query,
    data: query.data
      ? filterByCategory(query.data, 'Warframes').filter(
          (i) => i.category === 'Warframes'
        )
      : undefined,
  }
}

// Companion weapons live in the 'Primary' WFCD category with type 'Companion Weapon'
const isCompanionWeapon = (i: WarframeItem) =>
  i.category === 'Primary' && i.type === 'Companion Weapon'

export function useWeapons(category?: ItemCategory) {
  const query = useAllItems()
  return {
    ...query,
    data: query.data
      ? category
        ? filterByCategory(query.data, category).filter(
            (i) => !isCompanionWeapon(i)
          )
        : query.data.filter(
            (i) =>
              (
                [
                  'Primary',
                  'Secondary',
                  'Melee',
                  'Arch-Gun',
                  'Arch-Melee',
                ] as string[]
              ).includes(i.category) && !isCompanionWeapon(i)
          )
      : undefined,
  }
}

/** Sentinel companion frames only (excludes sentinel weapons and resources) */
export function useSentinelBodies() {
  const query = useAllItems()
  return {
    ...query,
    data: query.data?.filter(
      (i) => i.category === 'Sentinels' && i.type === 'Sentinel'
    ),
  }
}

/** Sentinel & companion weapons: category 'Primary', type 'Companion Weapon' */
export function useCompanionWeapons() {
  const query = useAllItems()
  return {
    ...query,
    data: query.data?.filter(isCompanionWeapon),
  }
}

/** Pets: Kubrows, Kavats, MOAs, Hounds — category 'Pets', type 'Pets' */
export function usePets() {
  const query = useAllItems()
  return {
    ...query,
    data: query.data?.filter(
      (i) => i.category === 'Pets' && i.type === 'Pets'
    ),
  }
}

/** All companions combined: sentinel bodies + companion weapons + pets */
export function useCompanions() {
  const query = useAllItems()
  return {
    ...query,
    data: query.data?.filter(
      (i) =>
        (i.category === 'Sentinels' && i.type === 'Sentinel') ||
        isCompanionWeapon(i) ||
        (i.category === 'Pets' && i.type === 'Pets')
    ),
  }
}

export function useArchwings() {
  const query = useAllItems()
  return {
    ...query,
    data: query.data ? filterByCategory(query.data, 'Archwing') : undefined,
  }
}

/** Others: masterable Misc items — Amps, K-Drives, etc. */
export function useOthers() {
  const query = useAllItems()
  return {
    ...query,
    data: query.data?.filter(
      (i) => i.category === 'Misc' && i.masterable === true
    ),
  }
}

export function useResources() {
  const query = useAllItems()
  return {
    ...query,
    data: query.data ? filterByCategory(query.data, 'Resources') : undefined,
  }
}

export function useNewlyReleasedItems() {
  const query = useAllItems()
  return {
    ...query,
    data: query.data
      ? getRecentlyReleasedItems(query.data, 90).filter((i) =>
          ALL_TRACKABLE_CATEGORIES.includes(i.category as ItemCategory)
        )
      : undefined,
  }
}

export function useWarframeNews() {
  return useQuery({
    queryKey: ['warframe', 'news'],
    queryFn: fetchNews,
    staleTime: 1000 * 60 * 5,
  })
}

export function useWarframeEvents() {
  return useQuery({
    queryKey: ['warframe', 'events'],
    queryFn: fetchEvents,
    staleTime: 1000 * 60 * 5,
  })
}

export function useOwnedItems() {
  return useQuery({
    queryKey: ['tracker', 'owned'],
    queryFn: () => trackerStorage.getOwnedItems(DEFAULT_USER_ID),
  })
}

export function useMasteredItems() {
  return useQuery({
    queryKey: ['tracker', 'mastered'],
    queryFn: () => trackerStorage.getMasteredItems(DEFAULT_USER_ID),
  })
}

export function useWishlistItems() {
  return useQuery({
    queryKey: ['tracker', 'wishlist'],
    queryFn: () => trackerStorage.getWishlistItems(DEFAULT_USER_ID),
  })
}

export function useResourceInventory() {
  return useQuery({
    queryKey: ['tracker', 'resources'],
    queryFn: () => trackerStorage.getResourceInventory(DEFAULT_USER_ID),
  })
}

/**
 * Loads the wikia blueprint database from localStorage cache.
 * Returns null when no cache exists — user must trigger a sync via
 * `loadWikiaBlueprintDB()` from the UI (sync button in wishlist page).
 *
 * Mimics WFCD's WikiaDataScraper bulk-fetch strategy: one request for ALL
 * blueprints rather than per-item wiki page scraping.
 */
export function useWikiaBlueprintDB() {
  return useQuery<WikiaBlueprintDB | null>({
    queryKey: ['wikia', 'blueprints'],
    queryFn: () => getCachedBlueprintDB(),
    // Re-read from cache on every mount but don't auto-refetch
    staleTime: STALE_24H,
    gcTime: STALE_24H,
    refetchOnWindowFocus: false,
  })
}

export function useIsOwned(uniqueName: string): boolean {
  const { data } = useOwnedItems()
  return data?.some((i) => i.uniqueName === uniqueName) ?? false
}

export function useIsMastered(uniqueName: string): boolean {
  const { data } = useMasteredItems()
  return data?.some((i) => i.uniqueName === uniqueName) ?? false
}

export function useIsInWishlist(uniqueName: string): boolean {
  const { data } = useWishlistItems()
  return data?.some((i) => i.uniqueName === uniqueName) ?? false
}

const SUB_BLUEPRINT_NAMES = new Set([
  'Neuroptics',
  'Chassis',
  'Systems',
  'Blueprint',
  'Barrel',
  'Receiver',
  'Stock',
  'Blade',
  'Handle',
  'Hilt',
  'String',
  'Grip',
  'Lower Limb',
  'Upper Limb',
  'Link',
  'Disc',
  'Guard',
  'Head',
  'Boot',
  'Gauntlet',
  'Stars',
  'Pouch',
  'Ornament',
])

/**
 * Converts a wikia blueprint's ingredients into ItemComponent[] format.
 */
function wikiaIngredientsToComponents(
  ingredients: { name: string; count: number }[],
  buildPrice?: number
): ItemComponent[] {
  const components: ItemComponent[] = ingredients.map((ing) => ({
    uniqueName:
      `/Lotus/Types/Items/Resources/${ing.name.replace(/\s+/g, '')}`,
    name: ing.name,
    itemCount: ing.count,
    imageName: ing.name.toLowerCase().replace(/\s+/g, '-') + '.png',
    tradable: false,
    type: 'Resource',
  }))

  if (buildPrice) {
    components.unshift({
      uniqueName: '/Lotus/Types/Items/MiscItems/Credits',
      name: 'Credits',
      itemCount: buildPrice,
      imageName: 'credits.png',
      tradable: false,
      type: 'Resource',
    })
  }

  return components
}

/**
 * Enriches wishlist items with sub-component crafting materials.
 *
 * Source priority (mimics WFCD's two-source strategy):
 *   1. Wikia blueprint DB (Module:Blueprints/data) — bulk-fetched & cached
 *   2. Manual crafting recipe database (fallback for items not in wikia DB)
 *
 * Returns enriched WarframeItem[] with components populated with sub-materials.
 */
export function useEnrichedWishlistItems() {
  const { data: wishlist } = useWishlistItems()
  const { data: allItems } = useAllItems()
  const { data: wikiaDB } = useWikiaBlueprintDB()

  const enrichedItems: WarframeItem[] = (wishlist ?? [])
    .map((wish) => {
      const item = allItems?.find((i) => i.uniqueName === wish.uniqueName)
      if (!item) return null

      if (!item.components) return { ...item }

      const enrichedComponents: ItemComponent[] = item.components.map(
        (comp) => {
          // Skip if already has components or not a sub-blueprint
          if (
            !SUB_BLUEPRINT_NAMES.has(comp.name) ||
            (comp.components && comp.components.length > 0)
          ) {
            return comp
          }

          const fullName = `${item.name} ${comp.name}`

          // ── Priority 1: wikia blueprint DB (WFCD wikia scraper approach) ──
          if (wikiaDB) {
            const wikiaBp = lookupBlueprint(wikiaDB, fullName)
            if (wikiaBp && wikiaBp.ingredients.length > 0) {
              return {
                ...comp,
                components: wikiaIngredientsToComponents(
                  wikiaBp.ingredients,
                  wikiaBp.buildPrice
                ),
              }
            }
          }

          // ── Priority 2: manual crafting recipe database (fallback) ─────────
          const recipe = getCraftingRecipe(fullName)

          if (recipe) {
            const subComponents: ItemComponent[] = recipe.ingredients.map(
              (ing: CraftingIngredient) => ({
                uniqueName:
                  ing.uniqueName ||
                  `/Lotus/Types/Items/Resources/${ing.name.replace(/\s+/g, '')}`,
                name: ing.name,
                itemCount: ing.quantity,
                imageName: ing.name.toLowerCase().replace(/\s+/g, '-') + '.png',
                tradable: false,
                type: 'Resource',
              })
            )

            if (recipe.credits) {
              subComponents.unshift({
                uniqueName: '/Lotus/Types/Items/MiscItems/Credits',
                name: 'Credits',
                itemCount: recipe.credits,
                imageName: 'credits.png',
                tradable: false,
                type: 'Resource',
              })
            }

            return { ...comp, components: subComponents }
          }

          return comp
        }
      )

      return { ...item, components: enrichedComponents }
    })
    .filter((item): item is WarframeItem => item !== null)

  return { data: enrichedItems, isLoading: false }
}

interface AggregatedResource {
  name: string
  needed: number
  uniqueName: string
  /** Parent blueprint names that require this resource, for traceability */
  sources: string[]
}

function addComponentResources(
  components: WarframeItem['components'],
  parentName: string,
  resourceMap: Map<string, AggregatedResource>,
  multiplier: number = 1
): void {
  if (!components) return

  for (const comp of components) {
    const isBlueprintLike = comp.components && comp.components.length > 0
    const isSubBlueprint = SUB_BLUEPRINT_NAMES.has(comp.name)
    
    // Create full name for sub-blueprints (e.g., "Khora Prime Chassis" instead of just "Khora Prime")
    const fullComponentName = isSubBlueprint ? `${parentName} ${comp.name}` : parentName

    if (isBlueprintLike) {
      addComponentResources(
        comp.components,
        fullComponentName,
        resourceMap,
        multiplier * comp.itemCount
      )
    } else if (comp.type === 'Resource' || (!comp.type && comp.itemCount > 0)) {
      const existing = resourceMap.get(comp.uniqueName)
      const needed = comp.itemCount * multiplier
      if (existing) {
        existing.needed += needed
        if (!existing.sources.includes(fullComponentName)) {
          existing.sources.push(fullComponentName)
        }
      } else {
        resourceMap.set(comp.uniqueName, {
          name: comp.name,
          needed,
          uniqueName: comp.uniqueName,
          sources: [fullComponentName],
        })
      }
    }
  }
}

export function getAggregatedResources(
  wishlistItems: { uniqueName: string }[],
  allItems: WarframeItem[]
): Map<string, AggregatedResource> {
  const resourceMap = new Map<string, AggregatedResource>()

  for (const wish of wishlistItems) {
    const item = allItems.find((i) => i.uniqueName === wish.uniqueName)
    if (!item?.components) continue

    addComponentResources(item.components, item.name, resourceMap)
  }

  return resourceMap
}

export function getAggregatedResourcesFromEnriched(
  enrichedItems: WarframeItem[]
): Map<string, AggregatedResource> {
  const resourceMap = new Map<string, AggregatedResource>()

  for (const item of enrichedItems) {
    if (!item?.components) continue
    addComponentResources(item.components, item.name, resourceMap)
  }

  return resourceMap
}
