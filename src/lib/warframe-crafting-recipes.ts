/**
 * Warframe crafting recipes database
 * 
 * Since WFCD data doesn't include nested materials for sub-components (Chassis, Systems, Neuroptics),
 * we maintain a manual database of crafting recipes here.
 * 
 * Data source: Warframe Wiki (https://warframe.fandom.com)
 * 
 * TODO: Implement automated scraping or find a better API source
 */

export interface CraftingIngredient {
  name: string
  uniqueName?: string
  quantity: number
}

export interface CraftingRecipe {
  /** Full item name, e.g., "Khora Prime Chassis" */
  itemName: string
  /** Credits cost */
  credits?: number
  /** Required materials */
  ingredients: CraftingIngredient[]
}

/**
 * Crafting recipes database
 * Format: key is the full component name (e.g., "Khora Prime Chassis")
 */
export const CRAFTING_RECIPES: Record<string, CraftingRecipe> = {
  // Example: Khora Prime components
  'Khora Prime Chassis': {
    itemName: 'Khora Prime Chassis',
    credits: 15000,
    ingredients: [
      { name: 'Tellurium', quantity: 2 },
      { name: 'Plastids', quantity: 450 },
      { name: 'Polymer Bundle', quantity: 1425 },
      { name: 'Alloy Plate', quantity: 5500 },
    ],
  },
  'Khora Prime Neuroptics': {
    itemName: 'Khora Prime Neuroptics',
    credits: 15000,
    ingredients: [
      { name: 'Argon Crystal', quantity: 2 },
      { name: 'Cryotic', quantity: 600 },
      { name: 'Circuits', quantity: 1100 },
      { name: 'Nano Spores', quantity: 4975 },
    ],
  },
  'Khora Prime Systems': {
    itemName: 'Khora Prime Systems',
    credits: 15000,
    ingredients: [
      { name: 'Nitain Extract', quantity: 2 },
      { name: 'Neurodes', quantity: 3 },
      { name: 'Rubedo', quantity: 1250 },
      { name: 'Salvage', quantity: 3800 },
    ],
  },
  
  // Add more recipes here as needed
  // You can populate this by scraping the Warframe Wiki or manually adding entries
}

/**
 * Get crafting recipe for a component
 */
export function getCraftingRecipe(itemName: string): CraftingRecipe | null {
  return CRAFTING_RECIPES[itemName] || null
}

/**
 * Check if we have a crafting recipe for an item
 */
export function hasRecipe(itemName: string): boolean {
  return itemName in CRAFTING_RECIPES
}
