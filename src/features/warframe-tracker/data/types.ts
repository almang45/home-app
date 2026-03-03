/** Types for WarframeStat.us API responses */

export interface WarframeAbility {
  uniqueName: string
  name: string
  description: string
  imageName: string
}

export interface ItemComponent {
  uniqueName: string
  name: string
  description?: string
  itemCount: number
  imageName: string
  tradable: boolean
  drops?: ItemDrop[]
  type?: string
  /** Sub-components for blueprints (Chassis, Systems, Neuroptics each have their own materials) */
  components?: ItemComponent[]
}

export interface ItemDrop {
  location: string
  type: string
  rarity?: string
  chance: number | null
  rotation?: string
}

export interface ItemIntroduced {
  name: string
  url: string
  aliases: string[]
  parent: string
  date: string
}

export interface WarframeItem {
  uniqueName: string
  name: string
  category: string
  type?: string
  description?: string
  imageName?: string
  tradable: boolean
  masterable?: boolean
  masteryReq?: number
  isPrime?: boolean
  vaulted?: boolean
  releaseDate?: string
  introduced?: ItemIntroduced
  buildPrice?: number
  buildTime?: number
  buildQuantity?: number
  components?: ItemComponent[]
  drops?: ItemDrop[]
  /** Warframe-specific */
  health?: number
  shield?: number
  armor?: number
  power?: number
  sprintSpeed?: number
  abilities?: WarframeAbility[]
  passiveDescription?: string
  /** Weapon-specific */
  totalDamage?: number
  fireRate?: number
  criticalChance?: number
  criticalMultiplier?: number
  procChance?: number
  magazineSize?: number
  reloadTime?: number
  /** Resource-specific */
  fusionPoints?: number
}

export type ItemCategory =
  | 'Warframes'
  | 'Primary'
  | 'Secondary'
  | 'Melee'
  | 'Arch-Gun'
  | 'Arch-Melee'
  | 'Resources'

export const WEAPON_CATEGORIES: ItemCategory[] = [
  'Primary',
  'Secondary',
  'Melee',
  'Arch-Gun',
  'Arch-Melee',
]

export const ALL_TRACKABLE_CATEGORIES: ItemCategory[] = [
  'Warframes',
  ...WEAPON_CATEGORIES,
]

/** News from /pc/news */
export interface WarframeNews {
  id: string
  message: string
  link: string
  imageLink: string
  priority: boolean
  date: string
  update: boolean
  primeAccess: boolean
  stream: boolean
  translations?: Record<string, string>
  expiry?: string
  activation?: string
}

/** Events from /pc/events */
export interface WarframeEvent {
  id: string
  activation: string
  expiry: string
  description: string
  tooltip?: string
  node: string
  rewards: EventReward[]
  health?: number
  tag: string
  maximumScore?: number
  currentScore?: number
}

export interface EventReward {
  items: string[]
  credits: number
  thumbnail?: string
}

/** Tracker storage record types */
export interface OwnedItem {
  userId: string
  uniqueName: string
  itemName: string
  category: string
  ownedAt: string
  notes?: string
}

export interface MasteredItem {
  userId: string
  uniqueName: string
  itemName: string
  category: string
  masteredAt: string
}

export interface WishlistItem {
  userId: string
  uniqueName: string
  itemName: string
  category: string
  priority: number
  addedAt: string
}

export interface ResourceEntry {
  userId: string
  uniqueName: string
  resourceName: string
  quantity: number
}
