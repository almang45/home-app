/**
 * Browser-based Warframe Recipe Scraper
 * 
 * Scrapes crafting recipes directly from Warframe Wiki using CORS proxy
 */

interface ScrapedRecipe {
  itemName: string
  credits?: number
  ingredients: Array<{ name: string; quantity: number }>
}

interface ScrapeResult {
  url: string
  warframe: string
  recipes: Record<string, ScrapedRecipe>
  success: boolean
  error?: string
}

// Multiple CORS proxies as fallbacks
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://cors-anywhere.herokuapp.com/',
]

let currentProxyIndex = 0

// Component names to look for
const SUB_COMPONENTS = [
  'Neuroptics',
  'Chassis',
  'Systems',
  'Blueprint',
]

/**
 * Extract warframe name from URL
 */
export function extractWarframeName(url: string): string {
  const parts = url.split('/')
  return parts[parts.length - 1].replace(/_/g, ' ')
}

/**
 * Clean text content
 */
function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Extract number from text
 */
function parseNumber(text: string): number {
  const match = text.match(/[\d,]+/)
  if (match) {
    return parseInt(match[0].replace(/,/g, ''), 10)
  }
  return 0
}

/**
 * Parse HTML table for crafting ingredients
 */
function parseTableForRecipes(
  html: string,
  warframeName: string
): Record<string, ScrapedRecipe> {
  const recipes: Record<string, ScrapedRecipe> = {}
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Find all tables
  const tables = doc.querySelectorAll('table')

  tables.forEach((table) => {
    // Look for component blueprint tables
    let componentName: string | null = null

    // Check caption
    const caption = table.querySelector('caption')
    if (caption) {
      const captionText = cleanText(caption.textContent || '')
      for (const comp of SUB_COMPONENTS) {
        if (captionText.includes(comp)) {
          componentName = comp
          break
        }
      }
    }

    // Check previous heading if no caption
    if (!componentName) {
      let prev = table.previousElementSibling
      while (prev && !componentName) {
        if (prev.tagName === 'H2' || prev.tagName === 'H3') {
          const headingText = cleanText(prev.textContent || '')
          for (const comp of SUB_COMPONENTS) {
            if (headingText.includes(comp)) {
              componentName = comp
              break
            }
          }
        }
        prev = prev.previousElementSibling
      }
    }

    if (!componentName) return

    // Parse table rows for ingredients
    let credits = 0
    const ingredients: Array<{ name: string; quantity: number }> = []
    const seen = new Set<string>()

    const rows = table.querySelectorAll('tr')
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td, th')
      if (cells.length < 2) return

      cells.forEach((cell, index) => {
        const links = cell.querySelectorAll('a')

        // Check for credits
        const cellText = cleanText(cell.textContent || '')
        if (cellText.includes('Credits') || cellText.includes('credits')) {
          const amount = parseNumber(cellText)
          if (amount > 0) credits = amount
        }

        // Check for materials
        links.forEach((link) => {
          const materialName = cleanText(link.textContent || '')

          // Skip non-material links
          if (
            !materialName ||
            materialName === 'Credits' ||
            materialName === 'Time' ||
            materialName === 'Rush' ||
            materialName === 'Blueprints'
          ) {
            return
          }

          // Try to find quantity
          let quantity = 0

          // Check current cell
          quantity = parseNumber(cellText)

          // Check next cell if no quantity found
          if (quantity === 0 && index + 1 < cells.length) {
            const nextCellText = cleanText(
              cells[index + 1].textContent || ''
            )
            quantity = parseNumber(nextCellText)
          }

          if (quantity > 0) {
            const key = `${materialName}-${quantity}`
            if (!seen.has(key)) {
              seen.add(key)
              ingredients.push({ name: materialName, quantity })
            }
          }
        })
      })
    })

    // Add recipe if we found ingredients
    if (ingredients.length > 0) {
      const fullName = `${warframeName} ${componentName}`
      recipes[fullName] = {
        itemName: fullName,
        credits: credits > 0 ? credits : undefined,
        ingredients,
      }
    }
  })

  return recipes
}

/**
 * Fetch with retry logic using multiple CORS proxies
 */
async function fetchWithProxy(url: string): Promise<string> {
  const errors: string[] = []

  // Try each proxy
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyIndex = (currentProxyIndex + i) % CORS_PROXIES.length
    const proxy = CORS_PROXIES[proxyIndex]
    const proxyUrl = `${proxy}${encodeURIComponent(url)}`

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()

      // Update successful proxy for next time
      currentProxyIndex = proxyIndex

      return html
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Proxy ${proxyIndex + 1} (${proxy}): ${errorMsg}`)

      // Continue to next proxy
      continue
    }
  }

  // All proxies failed
  throw new Error(
    `All CORS proxies failed:\n${errors.join('\n')}\n\n` +
    `Try these alternatives:\n` +
    `1. Use wiki.warframe.com instead of warframe.fandom.com\n` +
    `2. Install a CORS browser extension\n` +
    `3. Use the Python backend scraper`
  )
}

/**
 * Scrape a single URL
 */
export async function scrapeWarframeRecipes(
  url: string
): Promise<ScrapeResult> {
  const warframeName = extractWarframeName(url)

  try {
    const html = await fetchWithProxy(url)

    // Parse recipes from HTML
    const recipes = parseTableForRecipes(html, warframeName)

    if (Object.keys(recipes).length === 0) {
      throw new Error(
        'No recipes found. The wiki page structure may have changed, ' +
        'or this warframe may not have craftable components.'
      )
    }

    return {
      url,
      warframe: warframeName,
      recipes,
      success: true,
    }
  } catch (error) {
    return {
      url,
      warframe: warframeName,
      recipes: {},
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Scrape multiple URLs in sequence
 */
export async function scrapeMultipleRecipes(
  urls: string[],
  onProgress?: (current: number, total: number) => void
): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = []

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]

    if (onProgress) {
      onProgress(i, urls.length)
    }

    const result = await scrapeWarframeRecipes(url)
    results.push(result)

    // Small delay between requests to be nice to the server
    if (i < urls.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  if (onProgress) {
    onProgress(urls.length, urls.length)
  }

  return results
}

/**
 * Generate TypeScript code from scraped recipes
 */
export function generateTypeScriptCode(
  results: ScrapeResult[]
): string {
  const allRecipes: Record<string, ScrapedRecipe> = {}

  results.forEach((result) => {
    if (result.success && result.recipes) {
      Object.assign(allRecipes, result.recipes)
    }
  })

  if (Object.keys(allRecipes).length === 0) {
    return '// No recipes found'
  }

  let output = ''
  for (const [itemName, recipe] of Object.entries(allRecipes)) {
    output += `  '${itemName}': {\n`
    output += `    itemName: '${itemName}',\n`

    if (recipe.credits) {
      output += `    credits: ${recipe.credits},\n`
    }

    output += `    ingredients: [\n`
    recipe.ingredients.forEach((ing) => {
      output += `      { name: '${ing.name}', quantity: ${ing.quantity} },\n`
    })
    output += `    ],\n`
    output += `  },\n`
  }

  return output
}
