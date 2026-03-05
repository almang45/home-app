/** Utilities for parsing Warframe public profile API responses */

export interface ProfileXPInfo {
  ItemType: string
  XP: number
}

export interface ProfilePlayerSkills {
  LPS_GUNNERY?: number
  LPS_TACTICAL?: number
  LPS_PILOTING?: number
  LPS_ENGINEERING?: number
  LPS_COMMAND?: number
  LPS_DRIFT_COMBAT?: number
  LPS_DRIFT_ENDURANCE?: number
  LPS_DRIFT_OPPORTUNITY?: number
  LPS_DRIFT_RIDING?: number
}

export interface ProfileRaw {
  Results?: Array<{
    DisplayName?: string
    PlayerLevel?: number
    LoadOutInventory?: {
      XPInfo?: ProfileXPInfo[]
    }
    PlayerSkills?: ProfilePlayerSkills
  }>
}

export interface WarframeProfileResult {
  displayName: string
  playerLevel: number
  xpInfo: ProfileXPInfo[]
  playerSkills: ProfilePlayerSkills
}

// Warframe mastery rank names (0–30, then Legendary N)
const MR_NAMES: string[] = [
  'Unranked',
  'Initiate',
  'Novice',
  'Disciple',
  'Hunter',
  'Journeyman',
  'Artisan',
  'Warrior',
  'Guardian',
  'Stalwart',
  'Hero',
  'Soldier',
  'Veteran',
  'Expert',
  'Champion',
  'Sage',
  'Master',
  'Paladin',
  'Prophet',
  'Oracle',
  'Enlightened',
  'Grand Master',
  'Exemplar',
  'Transcendent',
  'Ancient',
  'Legendary',
  'Illustrious',
  'Prime',
  'Grand Prime',
  'True Prime',
  'Glorious',
]

export function getMasteryRankName(mr: number): string {
  if (mr <= 0) return MR_NAMES[0]
  if (mr < MR_NAMES.length) return MR_NAMES[mr]
  return `Legendary ${mr - 30}`
}

export function parseProfile(raw: ProfileRaw): WarframeProfileResult | null {
  const result = raw.Results?.[0]
  if (!result) return null
  return {
    displayName: result.DisplayName ?? 'Unknown',
    playerLevel: result.PlayerLevel ?? 0,
    xpInfo: result.LoadOutInventory?.XPInfo ?? [],
    playerSkills: result.PlayerSkills ?? {},
  }
}

export interface MasteryCategory {
  label: string
  /** Approximate mastery XP this item type contributes when maxed (200 XP/rank × 30 = 6000 for frames, 100 × 30 = 3000 for weapons) */
  xpContribution: number
}

// Ordered from most-specific to least-specific prefix
const PATH_CATEGORIES: Array<{ prefix: string } & MasteryCategory> = [
  { prefix: '/Lotus/Powersuits/Archwing/', label: 'Archwing', xpContribution: 6000 },
  { prefix: '/Lotus/Powersuits/', label: 'Warframes', xpContribution: 6000 },
  { prefix: '/Lotus/Types/Sentinels/SentinelPowersuits/', label: 'Sentinels', xpContribution: 6000 },
  { prefix: '/Lotus/Types/Sentinels/SentinelWeapons/', label: 'Sentinel Weapons', xpContribution: 3000 },
  { prefix: '/Lotus/Types/Companion/', label: 'Companions', xpContribution: 6000 },
  { prefix: '/Lotus/Types/Robotic/', label: 'Mechs', xpContribution: 6000 },
  { prefix: '/Lotus/Types/Vehicles/', label: 'K-Drives', xpContribution: 6000 },
  { prefix: '/Lotus/Weapons/Tenno/Archwing/', label: 'Archwing Weapons', xpContribution: 3000 },
  { prefix: '/Lotus/Weapons/', label: 'Weapons', xpContribution: 3000 },
]

export function getCategoryFromPath(itemType: string): MasteryCategory {
  for (const cat of PATH_CATEGORIES) {
    if (itemType.startsWith(cat.prefix)) {
      return { label: cat.label, xpContribution: cat.xpContribution }
    }
  }
  return { label: 'Other', xpContribution: 3000 }
}

export interface MasteryBreakdownEntry {
  label: string
  count: number
  estimatedXP: number
}

/** Calculates estimated mastery XP breakdown by item category from XPInfo */
export function calculateMasteryBreakdown(xpInfo: ProfileXPInfo[]): MasteryBreakdownEntry[] {
  const map = new Map<string, MasteryBreakdownEntry>()

  for (const item of xpInfo) {
    const cat = getCategoryFromPath(item.ItemType)
    const existing = map.get(cat.label)
    if (existing) {
      existing.count++
      existing.estimatedXP += cat.xpContribution
    } else {
      map.set(cat.label, { label: cat.label, count: 1, estimatedXP: cat.xpContribution })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.estimatedXP - a.estimatedXP)
}

export function getRailjackIntrinsicsTotal(skills: ProfilePlayerSkills): number {
  return (
    (skills.LPS_GUNNERY ?? 0) +
    (skills.LPS_TACTICAL ?? 0) +
    (skills.LPS_PILOTING ?? 0) +
    (skills.LPS_ENGINEERING ?? 0) +
    (skills.LPS_COMMAND ?? 0)
  )
}

export function getDrifterIntrinsicsTotal(skills: ProfilePlayerSkills): number {
  return (
    (skills.LPS_DRIFT_COMBAT ?? 0) +
    (skills.LPS_DRIFT_ENDURANCE ?? 0) +
    (skills.LPS_DRIFT_OPPORTUNITY ?? 0) +
    (skills.LPS_DRIFT_RIDING ?? 0)
  )
}
