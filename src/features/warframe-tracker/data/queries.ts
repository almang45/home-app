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

export function useWeapons(category?: ItemCategory) {
  const query = useAllItems()
  return {
    ...query,
    data: query.data
      ? category
        ? filterByCategory(query.data, category)
        : query.data.filter((i) =>
            (
              [
                'Primary',
                'Secondary',
                'Melee',
                'Arch-Gun',
                'Arch-Melee',
              ] as string[]
            ).includes(i.category)
          )
      : undefined,
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
 * Enriches wishlist items with sub-component crafting materials.
 * Uses manual crafting database since WFCD data doesn't include nested materials.
 * Returns enriched WarframeItem[] with components populated with sub-materials.
 */
export function useEnrichedWishlistItems() {
  const { data: wishlist } = useWishlistItems()
  const { data: allItems } = useAllItems()

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

          // Try to get crafting recipe from manual database
          const fullName = `${item.name} ${comp.name}`
          const recipe = getCraftingRecipe(fullName)
          
          if (recipe) {
            // Convert crafting ingredients to ItemComponent format
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

            // Add credits as a component if specified
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
