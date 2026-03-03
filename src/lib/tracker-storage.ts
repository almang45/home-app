import type {
  OwnedItem,
  MasteredItem,
  WishlistItem,
  ResourceEntry,
} from '@/features/warframe-tracker/data/types'

export interface TrackerStorage {
  getOwnedItems(userId: string): Promise<OwnedItem[]>
  addOwnedItem(item: OwnedItem): Promise<void>
  removeOwnedItem(userId: string, uniqueName: string): Promise<void>
  getMasteredItems(userId: string): Promise<MasteredItem[]>
  addMasteredItem(item: MasteredItem): Promise<void>
  removeMasteredItem(userId: string, uniqueName: string): Promise<void>
  getWishlistItems(userId: string): Promise<WishlistItem[]>
  addWishlistItem(item: WishlistItem): Promise<void>
  removeWishlistItem(userId: string, uniqueName: string): Promise<void>
  getResourceInventory(userId: string): Promise<ResourceEntry[]>
  updateResource(entry: ResourceEntry): Promise<void>
}

const LS_KEYS = {
  owned: 'wf-tracker-owned',
  mastered: 'wf-tracker-mastered',
  wishlist: 'wf-tracker-wishlist',
  resources: 'wf-tracker-resources',
} as const

function readJson<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function writeJson<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

class LocalStorageTracker implements TrackerStorage {
  async getOwnedItems(_userId: string): Promise<OwnedItem[]> {
    return readJson<OwnedItem>(LS_KEYS.owned)
  }

  async addOwnedItem(item: OwnedItem): Promise<void> {
    const items = readJson<OwnedItem>(LS_KEYS.owned)
    const exists = items.some((i) => i.uniqueName === item.uniqueName)
    if (!exists) {
      items.push(item)
      writeJson(LS_KEYS.owned, items)
    }
  }

  async removeOwnedItem(_userId: string, uniqueName: string): Promise<void> {
    const items = readJson<OwnedItem>(LS_KEYS.owned)
    writeJson(
      LS_KEYS.owned,
      items.filter((i) => i.uniqueName !== uniqueName)
    )
  }

  async getMasteredItems(_userId: string): Promise<MasteredItem[]> {
    return readJson<MasteredItem>(LS_KEYS.mastered)
  }

  async addMasteredItem(item: MasteredItem): Promise<void> {
    const items = readJson<MasteredItem>(LS_KEYS.mastered)
    const exists = items.some((i) => i.uniqueName === item.uniqueName)
    if (!exists) {
      items.push(item)
      writeJson(LS_KEYS.mastered, items)
    }
  }

  async removeMasteredItem(_userId: string, uniqueName: string): Promise<void> {
    const items = readJson<MasteredItem>(LS_KEYS.mastered)
    writeJson(
      LS_KEYS.mastered,
      items.filter((i) => i.uniqueName !== uniqueName)
    )
  }

  async getWishlistItems(_userId: string): Promise<WishlistItem[]> {
    return readJson<WishlistItem>(LS_KEYS.wishlist)
  }

  async addWishlistItem(item: WishlistItem): Promise<void> {
    const items = readJson<WishlistItem>(LS_KEYS.wishlist)
    const exists = items.some((i) => i.uniqueName === item.uniqueName)
    if (!exists) {
      items.push(item)
      writeJson(LS_KEYS.wishlist, items)
    }
  }

  async removeWishlistItem(_userId: string, uniqueName: string): Promise<void> {
    const items = readJson<WishlistItem>(LS_KEYS.wishlist)
    writeJson(
      LS_KEYS.wishlist,
      items.filter((i) => i.uniqueName !== uniqueName)
    )
  }

  async getResourceInventory(_userId: string): Promise<ResourceEntry[]> {
    return readJson<ResourceEntry>(LS_KEYS.resources)
  }

  async updateResource(entry: ResourceEntry): Promise<void> {
    const items = readJson<ResourceEntry>(LS_KEYS.resources)
    const idx = items.findIndex((i) => i.uniqueName === entry.uniqueName)
    if (idx >= 0) {
      items[idx] = entry
    } else {
      items.push(entry)
    }
    writeJson(LS_KEYS.resources, items)
  }
}

class PocketBaseTracker implements TrackerStorage {
  private async getPb() {
    const { pb } = await import('@/lib/pocketbase')
    return pb
  }

  async getOwnedItems(userId: string): Promise<OwnedItem[]> {
    const pb = await this.getPb()
    const records = await pb
      .collection('owned_items')
      .getFullList({ filter: `user_id="${userId}"` })
    return records.map((r) => ({
      userId: r.user_id,
      uniqueName: r.unique_name,
      itemName: r.item_name,
      category: r.category,
      ownedAt: r.owned_at,
      notes: r.notes,
    }))
  }

  async addOwnedItem(item: OwnedItem): Promise<void> {
    const pb = await this.getPb()
    await pb.collection('owned_items').create({
      user_id: item.userId,
      unique_name: item.uniqueName,
      item_name: item.itemName,
      category: item.category,
      owned_at: item.ownedAt,
      notes: item.notes || '',
    })
  }

  async removeOwnedItem(userId: string, uniqueName: string): Promise<void> {
    const pb = await this.getPb()
    const records = await pb.collection('owned_items').getFullList({
      filter: `user_id="${userId}" && unique_name="${uniqueName}"`,
    })
    for (const r of records) {
      await pb.collection('owned_items').delete(r.id)
    }
  }

  async getMasteredItems(userId: string): Promise<MasteredItem[]> {
    const pb = await this.getPb()
    const records = await pb
      .collection('mastered_items')
      .getFullList({ filter: `user_id="${userId}"` })
    return records.map((r) => ({
      userId: r.user_id,
      uniqueName: r.unique_name,
      itemName: r.item_name,
      category: r.category,
      masteredAt: r.mastered_at,
    }))
  }

  async addMasteredItem(item: MasteredItem): Promise<void> {
    const pb = await this.getPb()
    await pb.collection('mastered_items').create({
      user_id: item.userId,
      unique_name: item.uniqueName,
      item_name: item.itemName,
      category: item.category,
      mastered_at: item.masteredAt,
    })
  }

  async removeMasteredItem(userId: string, uniqueName: string): Promise<void> {
    const pb = await this.getPb()
    const records = await pb.collection('mastered_items').getFullList({
      filter: `user_id="${userId}" && unique_name="${uniqueName}"`,
    })
    for (const r of records) {
      await pb.collection('mastered_items').delete(r.id)
    }
  }

  async getWishlistItems(userId: string): Promise<WishlistItem[]> {
    const pb = await this.getPb()
    const records = await pb
      .collection('wishlist_items')
      .getFullList({ filter: `user_id="${userId}"` })
    return records.map((r) => ({
      userId: r.user_id,
      uniqueName: r.unique_name,
      itemName: r.item_name,
      category: r.category,
      priority: r.priority,
      addedAt: r.added_at,
    }))
  }

  async addWishlistItem(item: WishlistItem): Promise<void> {
    const pb = await this.getPb()
    await pb.collection('wishlist_items').create({
      user_id: item.userId,
      unique_name: item.uniqueName,
      item_name: item.itemName,
      category: item.category,
      priority: item.priority,
      added_at: item.addedAt,
    })
  }

  async removeWishlistItem(userId: string, uniqueName: string): Promise<void> {
    const pb = await this.getPb()
    const records = await pb.collection('wishlist_items').getFullList({
      filter: `user_id="${userId}" && unique_name="${uniqueName}"`,
    })
    for (const r of records) {
      await pb.collection('wishlist_items').delete(r.id)
    }
  }

  async getResourceInventory(userId: string): Promise<ResourceEntry[]> {
    const pb = await this.getPb()
    const records = await pb
      .collection('resource_inventory')
      .getFullList({ filter: `user_id="${userId}"` })
    return records.map((r) => ({
      userId: r.user_id,
      uniqueName: r.unique_name,
      resourceName: r.resource_name,
      quantity: r.quantity,
    }))
  }

  async updateResource(entry: ResourceEntry): Promise<void> {
    const pb = await this.getPb()
    const existing = await pb.collection('resource_inventory').getFullList({
      filter: `user_id="${entry.userId}" && unique_name="${entry.uniqueName}"`,
    })
    if (existing.length > 0) {
      await pb.collection('resource_inventory').update(existing[0].id, {
        quantity: entry.quantity,
      })
    } else {
      await pb.collection('resource_inventory').create({
        user_id: entry.userId,
        unique_name: entry.uniqueName,
        resource_name: entry.resourceName,
        quantity: entry.quantity,
      })
    }
  }
}

export const trackerStorage: TrackerStorage = import.meta.env.DEV
  ? new LocalStorageTracker()
  : new PocketBaseTracker()
