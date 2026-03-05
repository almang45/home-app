/**
 * Wikia Blueprint Scraper
 *
 * Browser-side port of WFCD/warframe-items WikiaDataScraper.mjs.
 *
 * WFCD approach:
 *   1. Fetch Module:Blueprints/data from wiki (one bulk request)
 *   2. Convert Lua table → JSON via Lua CLI (server-side)
 *   3. Use as the canonical sub-blueprint ingredient database
 *
 * Browser equivalent:
 *   1. Fetch the raw Lua module via CORS proxy (?action=raw)
 *   2. Parse Lua table with a JS parser built for the exact wiki schema
 *   3. Cache in localStorage (24 h TTL)
 *
 * Actual wiki schema (Module:Blueprints/data):
 *   return {
 *     Blueprints = {
 *       Acceltra = {                           -- bare key (no spaces)
 *         Credits = 25000,
 *         Time    = 86400,
 *         Name    = "Acceltra Blueprint",
 *         Result  = "Acceltra",
 *         Rush    = 35,
 *         Parts   = {
 *           { Count = 4,    Name = "Neurodes",    Type = "Resource" },
 *           { Count = 8000, Name = "Nano Spores", Type = "Resource" },
 *         },
 *       },
 *       ["Acceltra Prime"] = {                 -- quoted key (has spaces / special chars)
 *         Credits = 15000,
 *         ...
 *       },
 *     }
 *   }
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WikiaBlueprintIngredient {
  name: string
  count: number
  type: string
}

export interface WikiaBlueprint {
  /** The result item name — matches the Lua table key */
  name: string
  /** In-game blueprint display name (e.g. "Acceltra Blueprint") */
  blueprintName: string
  /** Credits cost */
  buildPrice?: number
  /** Build time in seconds */
  buildTime?: number
  ingredients: WikiaBlueprintIngredient[]
}

/** Map from lowercase item name → blueprint data */
export type WikiaBlueprintDB = Map<string, WikiaBlueprint>

// ─── Constants ────────────────────────────────────────────────────────────────

const BLUEPRINT_MODULE_URL =
  'https://wiki.warframe.com/w/Module:Blueprints/data?action=raw'

const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://cors-anywhere.herokuapp.com/',
]

const CACHE_KEY = 'wf-wikia-blueprint-db'
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 // 24 h

// ─── Cache ────────────────────────────────────────────────────────────────────

interface CachePayload {
  timestamp: number
  entries: [string, WikiaBlueprint][]
}

export function getCachedBlueprintDB(): WikiaBlueprintDB | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const payload: CachePayload = JSON.parse(raw)
    if (Date.now() - payload.timestamp > CACHE_TTL_MS) return null
    return new Map(payload.entries)
  } catch {
    return null
  }
}

export function saveBlueprintDB(db: WikiaBlueprintDB): void {
  try {
    const payload: CachePayload = {
      timestamp: Date.now(),
      entries: Array.from(db.entries()),
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore quota errors — cache is best-effort
  }
}

export function getBlueprintDBCacheAge(): number | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const payload: CachePayload = JSON.parse(raw)
    return Date.now() - payload.timestamp
  } catch {
    return null
  }
}

export function clearBlueprintDBCache(): void {
  localStorage.removeItem(CACHE_KEY)
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchLuaModule(): Promise<string> {
  const errors: string[] = []

  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyUrl = `${CORS_PROXIES[i]}${encodeURIComponent(BLUEPRINT_MODULE_URL)}`
    try {
      const controller = new AbortController()
      const tid = setTimeout(() => controller.abort(), 20_000)

      const res = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: { Accept: 'text/plain,text/html' },
      })
      clearTimeout(tid)

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (err) {
      errors.push(
        `Proxy ${i + 1}: ${err instanceof Error ? err.message : 'unknown'}`
      )
    }
  }

  throw new Error(`All CORS proxies failed:\n${errors.join('\n')}`)
}

// ─── Lua Table Parser ─────────────────────────────────────────────────────────

/**
 * Extracts the brace-delimited Lua block starting at `startIdx`
 * (which must point at the opening `{`). Returns the inner content.
 */
function extractBlock(src: string, startIdx: number): string | null {
  if (src[startIdx] !== '{') return null
  let depth = 0
  for (let i = startIdx; i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}') {
      depth--
      if (depth === 0) return src.slice(startIdx + 1, i)
    }
  }
  return null
}

/**
 * Parses the `Parts` array block (inner content, without outer braces).
 *
 * Each Part:  { Count = N, Name = "...", Type = "..." }
 */
function parseParts(src: string): WikiaBlueprintIngredient[] {
  const results: WikiaBlueprintIngredient[] = []
  const partRe = /\{([^{}]+)\}/g
  let m: RegExpExecArray | null

  while ((m = partRe.exec(src)) !== null) {
    const body = m[1]

    const countMatch = /\bCount\s*=\s*(\d+)/.exec(body)
    const nameMatch = /\bName\s*=\s*"([^"]+)"/.exec(body)
    const typeMatch = /\bType\s*=\s*"([^"]+)"/.exec(body)

    if (countMatch && nameMatch) {
      results.push({
        name: nameMatch[1],
        count: parseInt(countMatch[1], 10),
        type: typeMatch?.[1] ?? 'Resource',
      })
    }
  }

  return results
}

/**
 * Parses the inner body of a single blueprint entry.
 * Fields: Credits, Time, Name, Result, Parts.
 */
function parseEntry(key: string, body: string): WikiaBlueprint | null {
  const creditsMatch = /\bCredits\s*=\s*(\d+)/.exec(body)
  const timeMatch = /\bTime\s*=\s*(\d+)/.exec(body)
  const nameMatch = /\bName\s*=\s*"([^"]+)"/.exec(body)
  const resultMatch = /\bResult\s*=\s*"([^"]+)"/.exec(body)

  // Find Parts = { ... } block
  const partsIdx = body.search(/\bParts\s*=\s*\{/)
  let ingredients: WikiaBlueprintIngredient[] = []

  if (partsIdx !== -1) {
    const braceStart = body.indexOf('{', partsIdx)
    const partsBlock = extractBlock(body, braceStart)
    if (partsBlock) {
      ingredients = parseParts(partsBlock)
    }
  }

  // Skip entries with no ingredients (assembly blueprints that only list sub-blueprints)
  if (ingredients.length === 0) return null

  return {
    name: resultMatch?.[1] ?? key,
    blueprintName: nameMatch?.[1] ?? `${key} Blueprint`,
    buildPrice: creditsMatch ? parseInt(creditsMatch[1], 10) : undefined,
    buildTime: timeMatch ? parseInt(timeMatch[1], 10) : undefined,
    ingredients,
  }
}

/**
 * Parses one top-level section block (e.g. the content of `Blueprints = { ... }`
 * or `Suits = { ... }`) and merges results into `db`.
 */
function parseSectionBlock(sectionBlock: string, db: WikiaBlueprintDB): void {
  // Entries start with either:
  //   ["Key with spaces"] = {
  //   BareKey = {        (bare keys contain NO whitespace — stops at the space before =)
  const entryRe = /(?:\["([^"]+)"\]|([A-Za-z][A-Za-z0-9&'_-]*))\s*=\s*\{/g
  let match: RegExpExecArray | null

  while ((match = entryRe.exec(sectionBlock)) !== null) {
    const key = (match[1] ?? match[2]).trim()
    if (!key || key === 'Parts' || key === 'Cost') continue

    const braceStart = match.index + match[0].length - 1
    const body = extractBlock(sectionBlock, braceStart)
    if (!body) continue

    const bp = parseEntry(key, body)
    if (!bp) continue

    db.set(key.toLowerCase(), bp)
    if (bp.name.toLowerCase() !== key.toLowerCase()) {
      db.set(bp.name.toLowerCase(), bp)
    }
  }
}

/**
 * Main Lua parser — mimics WFCD's convertLuaDataToJson().
 *
 * The wiki module has multiple top-level tables inside `return { ... }`:
 *   - `Blueprints` — weapons, companions, archwings, etc.
 *   - `Suits`      — warframes and their sub-blueprints (Chassis, Neuroptics, Systems)
 *
 * We parse ALL top-level tables and merge them into a single DB,
 * indexed by lowercase key AND lowercase result name.
 */
export function parseLuaBlueprintModule(lua: string): WikiaBlueprintDB {
  const db: WikiaBlueprintDB = new Map()

  // Strip Lua comments
  const clean = lua
    .replace(/--\[\[[\s\S]*?\]\]/g, '')
    .replace(/--[^\n]*/g, '')

  // Find the outer return { ... } block
  const returnBrace = clean.indexOf('{')
  const returnBlock = extractBlock(clean, returnBrace)
  if (!returnBlock) {
    console.warn('[wikia-blueprint-scraper] Failed to extract return block')
    return db
  }

  // Walk every top-level section (Blueprints, Suits, etc.)
  // Each section is a bare key followed by = {
  const sectionRe = /\b([A-Za-z]\w*)\s*=\s*\{/g
  let sMatch: RegExpExecArray | null

  while ((sMatch = sectionRe.exec(returnBlock)) !== null) {
    const sectionName = sMatch[1]
    const sectionBrace = sMatch.index + sMatch[0].length - 1
    const sectionBlock = extractBlock(returnBlock, sectionBrace)
    if (!sectionBlock) continue

    parseSectionBlock(sectionBlock, db)
  }

  return db
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ScrapeBlueprintResult {
  db: WikiaBlueprintDB
  fromCache: boolean
  entriesCount: number
  cachedAt?: string
}

export async function loadWikiaBlueprintDB(
  forceRefresh = false
): Promise<ScrapeBlueprintResult> {
  if (!forceRefresh) {
    const cached = getCachedBlueprintDB()
    if (cached) {
      const ageMs = getBlueprintDBCacheAge() ?? 0
      return {
        db: cached,
        fromCache: true,
        entriesCount: cached.size,
        cachedAt: new Date(Date.now() - ageMs).toISOString(),
      }
    }
  }

  const luaContent = await fetchLuaModule()
  const db = parseLuaBlueprintModule(luaContent)

  if (db.size === 0) {
    throw new Error(
      'Blueprint DB parsed 0 entries — the wiki module format may have changed.'
    )
  }

  saveBlueprintDB(db)

  return {
    db,
    fromCache: false,
    entriesCount: db.size,
    cachedAt: new Date().toISOString(),
  }
}

/**
 * Look up a sub-blueprint by its result name.
 *
 * Tries (all lowercase):
 *   1. Exact key               e.g. "ash prime neuroptics"
 *   2. Without " blueprint"    e.g. "ash prime neuroptics" from "ash prime neuroptics blueprint"
 *   3. With " blueprint"       e.g. "ash prime neuroptics blueprint"
 *
 * WFCD uses the wiki key as the lookup anchor; we mirror that here.
 */
export function lookupBlueprint(
  db: WikiaBlueprintDB,
  fullName: string
): WikiaBlueprint | undefined {
  const key = fullName.toLowerCase()
  return (
    db.get(key) ??
    db.get(key.replace(/\s+blueprint$/, '')) ??
    db.get(`${key} blueprint`)
  )
}
