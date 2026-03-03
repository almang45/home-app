import type {
  OwnedItem,
  MasteredItem,
  WishlistItem,
  ResourceEntry,
} from '@/features/warframe-tracker/data/types'
import { pb } from './pocketbase'
import { trackerStorage } from './tracker-storage'

/**
 * Warframe Tracker Data Export/Import Utility
 *
 * Supports migration between:
 * - localStorage (development)
 * - PocketBase (production)
 */

// Portable types without userId/timestamps
export interface ExportOwnedItem {
  uniqueName: string
  itemName: string
  category: string
  notes?: string
}

export interface ExportMasteredItem {
  uniqueName: string
  itemName: string
  category: string
}

export interface ExportWishlistItem {
  uniqueName: string
  itemName: string
  category: string
  priority: number
}

export interface ExportResourceEntry {
  uniqueName: string
  resourceName: string
  quantity: number
}

export interface ExportData {
  version: string
  exportedAt: string
  userId: string
  ownedItems: ExportOwnedItem[]
  masteredItems: ExportMasteredItem[]
  wishlistItems: ExportWishlistItem[]
  resourceInventory: ExportResourceEntry[]
}

/**
 * Export all Warframe Tracker data from localStorage
 */
export async function exportFromLocalStorage(
  userId: string = 'local-user'
): Promise<ExportData> {
  const [ownedItems, masteredItems, wishlistItems, resourceInventory] =
    await Promise.all([
      trackerStorage.getOwnedItems(userId),
      trackerStorage.getMasteredItems(userId),
      trackerStorage.getWishlistItems(userId),
      trackerStorage.getResourceInventory(userId),
    ])

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    userId,
    ownedItems: ownedItems.map((item) => ({
      uniqueName: item.uniqueName,
      itemName: item.itemName,
      category: item.category,
      notes: item.notes,
    })),
    masteredItems: masteredItems.map((item) => ({
      uniqueName: item.uniqueName,
      itemName: item.itemName,
      category: item.category,
    })),
    wishlistItems: wishlistItems.map((item) => ({
      uniqueName: item.uniqueName,
      itemName: item.itemName,
      category: item.category,
      priority: item.priority,
    })),
    resourceInventory: resourceInventory.map((item) => ({
      uniqueName: item.uniqueName,
      resourceName: item.resourceName,
      quantity: item.quantity,
    })),
  }
}

/**
 * Export all Warframe Tracker data from PocketBase
 */
export async function exportFromPocketBase(
  userId: string
): Promise<ExportData> {
  if (!pb.authStore.isValid) {
    throw new Error('User must be authenticated to export from PocketBase')
  }

  const [ownedItems, masteredItems, wishlistItems, resourceInventory] =
    await Promise.all([
      pb
        .collection('warframe_owned_items')
        .getFullList<OwnedItem>({ filter: `user_id="${userId}"` }),
      pb
        .collection('warframe_mastered_items')
        .getFullList<MasteredItem>({ filter: `user_id="${userId}"` }),
      pb
        .collection('warframe_wishlist')
        .getFullList<WishlistItem>({ filter: `user_id="${userId}"` }),
      pb
        .collection('warframe_resource_inventory')
        .getFullList<ResourceEntry>({ filter: `user_id="${userId}"` }),
    ])

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    userId,
    ownedItems: ownedItems.map((item) => ({
      uniqueName: item.uniqueName,
      itemName: item.itemName,
      category: item.category,
    })),
    masteredItems: masteredItems.map((item) => ({
      uniqueName: item.uniqueName,
      itemName: item.itemName,
      category: item.category,
    })),
    wishlistItems: wishlistItems.map((item) => ({
      uniqueName: item.uniqueName,
      itemName: item.itemName,
      category: item.category,
      priority: item.priority,
    })),
    resourceInventory: resourceInventory.map((item) => ({
      uniqueName: item.uniqueName,
      resourceName: item.resourceName,
      quantity: item.quantity,
    })),
  }
}

/**
 * Import data into localStorage
 */
export async function importToLocalStorage(
  data: ExportData,
  userId: string = 'local-user',
  options: { clearExisting?: boolean } = {}
): Promise<void> {
  if (options.clearExisting) {
    await clearLocalStorage(userId)
  }

  const now = new Date().toISOString()

  // Import owned items
  for (const item of data.ownedItems) {
    await trackerStorage.addOwnedItem({
      userId,
      uniqueName: item.uniqueName,
      itemName: item.itemName,
      category: item.category,
      ownedAt: now,
      notes: item.notes,
    })
  }

  // Import mastered items
  for (const item of data.masteredItems) {
    await trackerStorage.addMasteredItem({
      userId,
      uniqueName: item.uniqueName,
      itemName: item.itemName,
      category: item.category,
      masteredAt: now,
    })
  }

  // Import wishlist items
  for (const item of data.wishlistItems) {
    await trackerStorage.addWishlistItem({
      userId,
      uniqueName: item.uniqueName,
      itemName: item.itemName,
      category: item.category,
      priority: item.priority,
      addedAt: now,
    })
  }

  // Import resource inventory
  for (const resource of data.resourceInventory) {
    await trackerStorage.updateResource({
      userId,
      uniqueName: resource.uniqueName,
      resourceName: resource.resourceName,
      quantity: resource.quantity,
    })
  }
}

/**
 * Import data into PocketBase
 */
export async function importToPocketBase(
  data: ExportData,
  userId: string,
  options: { clearExisting?: boolean } = {}
): Promise<void> {
  if (!pb.authStore.isValid) {
    throw new Error('User must be authenticated to import to PocketBase')
  }

  if (options.clearExisting) {
    await clearPocketBase(userId)
  }

  // Import owned items
  for (const item of data.ownedItems) {
    try {
      await pb.collection('warframe_owned_items').create({
        user_id: userId,
        unique_name: item.uniqueName,
        item_name: item.itemName,
        category: item.category,
      })
    } catch (error) {
      // Skip if duplicate (unique constraint)
      console.warn(`Skipping duplicate owned item: ${item.itemName}`)
    }
  }

  // Import mastered items
  for (const item of data.masteredItems) {
    try {
      await pb.collection('warframe_mastered_items').create({
        user_id: userId,
        unique_name: item.uniqueName,
        item_name: item.itemName,
        category: item.category,
      })
    } catch (error) {
      console.warn(`Skipping duplicate mastered item: ${item.itemName}`)
    }
  }

  // Import wishlist items
  for (const item of data.wishlistItems) {
    try {
      await pb.collection('warframe_wishlist').create({
        user_id: userId,
        unique_name: item.uniqueName,
        item_name: item.itemName,
        category: item.category,
        priority: item.priority ?? 2,
      })
    } catch (error) {
      console.warn(`Skipping duplicate wishlist item: ${item.itemName}`)
    }
  }

  // Import resource inventory
  for (const resource of data.resourceInventory) {
    try {
      await pb.collection('warframe_resource_inventory').create({
        user_id: userId,
        unique_name: resource.uniqueName,
        resource_name: resource.resourceName,
        quantity: resource.quantity,
      })
    } catch (error) {
      console.warn(`Skipping duplicate resource: ${resource.resourceName}`)
    }
  }
}

/**
 * Clear all localStorage data for a user
 */
async function clearLocalStorage(userId: string): Promise<void> {
  const keys = [
    `wf-tracker-owned-${userId}`,
    `wf-tracker-mastered-${userId}`,
    `wf-tracker-wishlist-${userId}`,
    `wf-tracker-resources-${userId}`,
  ]

  keys.forEach((key) => localStorage.removeItem(key))
}

/**
 * Clear all PocketBase data for a user
 */
async function clearPocketBase(userId: string): Promise<void> {
  if (!pb.authStore.isValid) {
    throw new Error('User must be authenticated to clear PocketBase data')
  }

  const collections = [
    'warframe_owned_items',
    'warframe_mastered_items',
    'warframe_wishlist',
    'warframe_resource_inventory',
  ]

  for (const collectionName of collections) {
    const records = await pb
      .collection(collectionName)
      .getFullList({ filter: `user_id="${userId}"` })

    for (const record of records) {
      await pb.collection(collectionName).delete(record.id)
    }
  }
}

/**
 * Download export data as JSON file
 */
export function downloadExport(data: ExportData, filename?: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename || `warframe-tracker-${data.userId}-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Parse uploaded JSON export file
 */
export async function parseImportFile(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)

        // Validate structure
        if (
          !data.version ||
          !data.exportedAt ||
          !Array.isArray(data.ownedItems) ||
          !Array.isArray(data.masteredItems) ||
          !Array.isArray(data.wishlistItems) ||
          !Array.isArray(data.resourceInventory)
        ) {
          throw new Error('Invalid export file format')
        }

        resolve(data as ExportData)
      } catch (error) {
        reject(new Error('Failed to parse export file'))
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

/**
 * Migrate data from localStorage to PocketBase
 */
export async function migrateLocalToPocketBase(
  localUserId: string = 'local-user',
  pocketbaseUserId: string,
  options: { clearPocketBaseFirst?: boolean } = {}
): Promise<void> {
  // Export from localStorage
  const data = await exportFromLocalStorage(localUserId)

  // Import to PocketBase
  await importToPocketBase(data, pocketbaseUserId, {
    clearExisting: options.clearPocketBaseFirst,
  })
}

/**
 * Migrate data from PocketBase to localStorage
 */
export async function migratePocketBaseToLocal(
  pocketbaseUserId: string,
  localUserId: string = 'local-user',
  options: { clearLocalStorageFirst?: boolean } = {}
): Promise<void> {
  // Export from PocketBase
  const data = await exportFromPocketBase(pocketbaseUserId)

  // Import to localStorage
  await importToLocalStorage(data, localUserId, {
    clearExisting: options.clearLocalStorageFirst,
  })
}
