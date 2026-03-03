/**
 * Dev-mode mock data — only used when import.meta.env.DEV is true.
 * Provides a mock authenticated user and seeds localStorage with sample
 * Warframe tracker data so all pages are testable without a PocketBase server.
 */
import type { AuthModel } from 'pocketbase'
import type {
  OwnedItem,
  MasteredItem,
  WishlistItem,
  ResourceEntry,
} from '@/features/warframe-tracker/data/types'

// Mock user — matches the fields read by nav-user.tsx and profile-dropdown
export const DEV_MOCK_USER: AuthModel = {
  id: 'dev-user-001',
  collectionId: '_pb_users_auth_',
  collectionName: 'users',
  created: '2026-01-01 00:00:00.000Z',
  updated: '2026-01-01 00:00:00.000Z',
  expand: {},
  username: 'devuser',
  email: 'dev@localhost',
  name: 'Dev User',
  avatar: '',
  verified: true,
}

// Bump this key to force a re-seed after changing SEED_* constants below
const SEED_KEY = 'wf-dev-seeded-v1'

const SEED_OWNED: OwnedItem[] = [
  {
    userId: 'dev-user-001',
    uniqueName: '/Lotus/Powersuits/Excalibur/Excalibur',
    itemName: 'Excalibur',
    category: 'Warframes',
    ownedAt: '2026-01-10T10:00:00.000Z',
  },
  {
    userId: 'dev-user-001',
    uniqueName: '/Lotus/Powersuits/Volt/Volt',
    itemName: 'Volt',
    category: 'Warframes',
    ownedAt: '2026-01-15T10:00:00.000Z',
  },
  {
    userId: 'dev-user-001',
    uniqueName: '/Lotus/Powersuits/Mag/Mag',
    itemName: 'Mag',
    category: 'Warframes',
    ownedAt: '2026-01-20T10:00:00.000Z',
  },
  {
    userId: 'dev-user-001',
    uniqueName: '/Lotus/Weapons/Tenno/Rifle/AssaultRifle/AssaultRifle',
    itemName: 'Braton',
    category: 'Primary',
    ownedAt: '2026-01-12T10:00:00.000Z',
  },
  {
    userId: 'dev-user-001',
    uniqueName: '/Lotus/Weapons/Tenno/Pistol/Pistol/LotusLightPistol',
    itemName: 'Lato',
    category: 'Secondary',
    ownedAt: '2026-01-18T10:00:00.000Z',
  },
  {
    userId: 'dev-user-001',
    uniqueName: '/Lotus/Weapons/Tenno/Melee/LotusKatana/LotusKatana',
    itemName: 'Skana',
    category: 'Melee',
    ownedAt: '2026-01-22T10:00:00.000Z',
  },
]

const SEED_MASTERED: MasteredItem[] = [
  {
    userId: 'dev-user-001',
    uniqueName: '/Lotus/Powersuits/Excalibur/Excalibur',
    itemName: 'Excalibur',
    category: 'Warframes',
    masteredAt: '2026-02-01T10:00:00.000Z',
  },
  {
    userId: 'dev-user-001',
    uniqueName: '/Lotus/Weapons/Tenno/Rifle/AssaultRifle/AssaultRifle',
    itemName: 'Braton',
    category: 'Primary',
    masteredAt: '2026-02-05T10:00:00.000Z',
  },
  {
    userId: 'dev-user-001',
    uniqueName: '/Lotus/Weapons/Tenno/Melee/LotusKatana/LotusKatana',
    itemName: 'Skana',
    category: 'Melee',
    masteredAt: '2026-02-08T10:00:00.000Z',
  },
]

const SEED_WISHLIST: WishlistItem[] = [
  {
    userId: 'dev-user-001',
    uniqueName: '/Lotus/Powersuits/Trinity/Trinity',
    itemName: 'Trinity',
    category: 'Warframes',
    priority: 1,
    addedAt: '2026-02-10T10:00:00.000Z',
  },
  {
    userId: 'dev-user-001',
    uniqueName: '/Lotus/Powersuits/Rhino/Rhino',
    itemName: 'Rhino',
    category: 'Warframes',
    priority: 2,
    addedAt: '2026-02-12T10:00:00.000Z',
  },
  {
    userId: 'dev-user-001',
    uniqueName: '/Lotus/Powersuits/Nova/Nova',
    itemName: 'Nova',
    category: 'Warframes',
    priority: 3,
    addedAt: '2026-02-14T10:00:00.000Z',
  },
]

const SEED_RESOURCES: ResourceEntry[] = [
  {
    userId: 'dev-user-001',
    uniqueName: '/Lotus/Types/Items/MiscItems/Alloy',
    resourceName: 'Alloy Plate',
    quantity: 12500,
  },
  {
    userId: 'dev-user-001',
    uniqueName: '/Lotus/Types/Items/MiscItems/CircuitBoard',
    resourceName: 'Circuits',
    quantity: 4800,
  },
  {
    userId: 'dev-user-001',
    uniqueName: '/Lotus/Types/Items/MiscItems/Polymer',
    resourceName: 'Polymer Bundle',
    quantity: 9200,
  },
  {
    userId: 'dev-user-001',
    uniqueName: '/Lotus/Types/Items/MiscItems/Salvage',
    resourceName: 'Salvage',
    quantity: 35000,
  },
  {
    userId: 'dev-user-001',
    uniqueName: '/Lotus/Types/Items/MiscItems/Ferrite',
    resourceName: 'Ferrite',
    quantity: 28000,
  },
]

/**
 * Seeds localStorage with sample Warframe tracker data.
 * Idempotent — only runs once (keyed by SEED_KEY).
 * Changes made during testing persist across page reloads.
 * Clear localStorage or bump SEED_KEY to re-seed.
 */
export function seedDevData(): void {
  if (localStorage.getItem(SEED_KEY)) return

  localStorage.setItem('wf-tracker-owned', JSON.stringify(SEED_OWNED))
  localStorage.setItem('wf-tracker-mastered', JSON.stringify(SEED_MASTERED))
  localStorage.setItem('wf-tracker-wishlist', JSON.stringify(SEED_WISHLIST))
  localStorage.setItem('wf-tracker-resources', JSON.stringify(SEED_RESOURCES))
  localStorage.setItem(SEED_KEY, '1')
}
