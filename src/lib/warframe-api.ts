import axios from 'axios'
import type {
  WarframeItem,
  WarframeNews,
  WarframeEvent,
  ItemCategory,
} from '@/features/warframe-tracker/data/types'

// Use GitHub CDN as primary source for static item data
const GITHUB_DATA_BASE =
  'https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json'

// Only use API for live data (news, events)
export const warframeApi = axios.create({
  baseURL: 'https://api.warframestat.us',
  timeout: 10000,
})

let cachedItems: WarframeItem[] | null = null

/**
 * Fetch all items from GitHub CDN (primary source for static data)
 * This is always available and doesn't depend on the API
 */
async function fetchItemsFromGitHub(): Promise<WarframeItem[]> {
  if (cachedItems) {
    return cachedItems
  }

  try {
    const response = await axios.get(`${GITHUB_DATA_BASE}/All.json`, {
      timeout: 30000,
    })

    cachedItems = response.data
      .filter((item: { category?: string }) =>
        [
          'Warframes',
          'Primary',
          'Secondary',
          'Melee',
          'Arch-Gun',
          'Arch-Melee',
          'Resources',
        ].includes(item.category || '')
      )
      .map((item: {
        uniqueName?: string
        name?: string
        category?: string
        type?: string
        description?: string
        imageName?: string
        tradable?: boolean
        masteryReq?: number
        vaulted?: boolean
        releaseDate?: string
        buildPrice?: number
        buildTime?: number
        buildQuantity?: number
        components?: unknown
        drops?: unknown
        introduced?: unknown
        health?: number
        shield?: number
        armor?: number
        power?: number
        sprintSpeed?: number
        abilities?: unknown
        passiveDescription?: string
        totalDamage?: number
        fireRate?: number
        criticalChance?: number
        criticalMultiplier?: number
        procChance?: number
        magazineSize?: number
        reloadTime?: number
      }) => ({
        uniqueName: item.uniqueName || '',
        name: item.name || '',
        category: item.category || '',
        type: item.type,
        description: item.description,
        imageName: item.imageName,
        tradable: item.tradable || false,
        masterable: item.masteryReq !== undefined,
        masteryReq: item.masteryReq,
        isPrime: item.name?.includes('Prime') || false,
        vaulted: item.vaulted || false,
        releaseDate: item.releaseDate,
        buildPrice: item.buildPrice,
        buildTime: item.buildTime,
        buildQuantity: item.buildQuantity,
        components: item.components,
        drops: item.drops,
        introduced: item.introduced,
        // Warframe-specific
        health: item.health,
        shield: item.shield,
        armor: item.armor,
        power: item.power,
        sprintSpeed: item.sprintSpeed,
        abilities: item.abilities,
        passiveDescription: item.passiveDescription,
        // Weapon-specific
        totalDamage: item.totalDamage,
        fireRate: item.fireRate,
        criticalChance: item.criticalChance,
        criticalMultiplier: item.criticalMultiplier,
        procChance: item.procChance,
        magazineSize: item.magazineSize,
        reloadTime: item.reloadTime,
      })) as WarframeItem[]

    return cachedItems
  } catch (_error) {
    throw new Error('Unable to load Warframe item data. Please check your internet connection.')
  }
}

export const WF_IMAGE_CDN = 'https://cdn.warframestat.us/img'

export function getItemImageUrl(imageName?: string): string {
  if (!imageName) return '/placeholder-item.png'
  return `${WF_IMAGE_CDN}/${imageName}`
}

/**
 * Fetch all items (from GitHub CDN - always offline-capable)
 */
export async function fetchAllItems(): Promise<WarframeItem[]> {
  return await fetchItemsFromGitHub()
}

/**
 * Fetch item detail by name or uniqueName (from cached GitHub data)
 */
export async function fetchItemDetail(
  nameOrUniqueName: string
): Promise<WarframeItem | null> {
  const items = await fetchItemsFromGitHub()
  const exact = items.find(
    (i) =>
      i.name.toLowerCase() === nameOrUniqueName.toLowerCase() ||
      i.uniqueName === nameOrUniqueName
  )
  return exact || null
}

/**
 * Search items (from cached GitHub data)
 */
export async function searchItems(query: string): Promise<WarframeItem[]> {
  const items = await fetchItemsFromGitHub()
  const lowerQuery = query.toLowerCase()
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.uniqueName.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Fetch news from live API
 * This requires the API to be online
 */
export async function fetchNews(): Promise<WarframeNews[]> {
  try {
    const { data } = await warframeApi.get<WarframeNews[]>('/pc/news')
    return data
  } catch (_error) {
    return []
  }
}

/**
 * Fetch events from live API
 * This requires the API to be online
 */
export async function fetchEvents(): Promise<WarframeEvent[]> {
  try {
    const { data } = await warframeApi.get<WarframeEvent[]>('/pc/events')
    return data
  } catch (_error) {
    return []
  }
}

/**
 * Check if live API is available
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    await warframeApi.get('/pc', { timeout: 5000 })
    return true
  } catch (_error) {
    return false
  }
}

export function filterByCategory(
  items: WarframeItem[],
  category: ItemCategory
): WarframeItem[] {
  return items.filter((item) => item.category === category)
}

export function filterBuildableItems(items: WarframeItem[]): WarframeItem[] {
  return items.filter((item) => item.components && item.components.length > 0)
}

export function getRecentlyReleasedItems(
  items: WarframeItem[],
  daysAgo: number = 90
): WarframeItem[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysAgo)

  return items.filter((item) => {
    const dateStr = item.releaseDate || item.introduced?.date
    if (!dateStr) return false
    const releaseDate = new Date(dateStr)
    return releaseDate >= cutoff
  })
}

/**
 * Clear cached items (useful for forcing a refresh)
 */
export function clearItemCache(): void {
  cachedItems = null
}
