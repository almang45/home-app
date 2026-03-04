# Plans

Planned features and integrations for the home-app.

---

## Plan #1 — Warframe Public Profile API Integration

**Status:** Planning

**API:** `https://api.warframe.com/cdn/getProfileViewingData.php?playerId=<id>`
**Sample stored at:** `src/resources/warframe/profile-sample.json`
**Rate limit:** Unknown — treat as low-request; cache aggressively.

---

### Profile JSON Structure (analysed from sample)

| Key | Description |
|---|---|
| `Results[0].DisplayName` | In-game display name (includes Unicode clan tag) |
| `Results[0].PlayerLevel` | Mastery Rank (0–30+) |
| `Results[0].GuildName` | Clan name |
| `Results[0].GuildTier` | Clan tier (1 = Ghost … 7 = Moon) |
| `Results[0].GuildXp` | Clan XP |
| `Results[0].LoadOutPreset` | Active loadout: Warframe, primary, secondary, melee, archwing, focus school |
| `Results[0].LoadOutInventory` | Equipped items — `Suits`, `LongGuns`, `Pistols`, `Melee`, `WeaponSkins`, `XPInfo` |
| `Results[0].ChallengeProgress[]` | Array of 488 completed challenges with counters |
| `Results[0].Missions[]` | Array of 289 completed missions (node + score) |
| `Stats.Weapons[]` | Per-weapon kills, headshots, assists, XP (722 weapons) |
| `Stats.Enemies[]` | Per-enemy kills and headshots (873 enemy types) |
| `Stats.MissionsCompleted` | Total missions completed |
| `Stats.MissionsFailed/Quit` | Abandons and failures |
| `Stats.TimePlayedSec` | Total time played in seconds |
| `Stats.MeleeKills` | Total melee kills |
| `Stats.CiphersSolved` | Hacking puzzles completed |

---

### Integration Plan

#### Phase 1 — Fetch & Cache
- Add `VITE_WARFRAME_PLAYER_ID` to `.env.example` (player ID to fetch)
- Add `src/lib/warframe-profile-api.ts`:
  - `fetchProfileData(playerId: string): Promise<WarframeProfile>`
  - Cache result in `localStorage` with a 24h TTL key `wf-profile-<playerId>`
  - On cache miss: hit the API; on cache hit: return stored JSON
  - Expose a TanStack Query hook: `useWarframeProfile(playerId)`

#### Phase 2 — Type definitions
- Add `WarframeProfile`, `ProfileResult`, `ProfileStats`, `WeaponStat`, `EnemyStat` types to `src/features/warframe-tracker/data/types.ts`
- Type the profile fully from the sample JSON (no `any`)

#### Phase 3 — Surface in Tracker UI

**Overview page (`/warframe-tracker`)** — add a "Your Profile" stats card:
- Mastery Rank badge
- Time played (formatted as hours)
- Missions completed / failed / quit
- Total kills (derived from `Stats.Weapons[].kills` sum)
- Active loadout (Warframe + weapons from `LoadOutPreset`)

**Warframes page** — highlight the currently equipped Warframe (`LoadOutPreset.s`)

**Weapons pages** — highlight equipped weapons; show per-weapon stats from `Stats.Weapons[]` (kills, headshots, XP) next to each item card

**New page: Stats (`/warframe-tracker/stats`)** — dedicated statistics page:
- Top 10 weapons by kill count
- Top 10 enemies killed
- Missions breakdown (completed vs failed vs quit vs interrupted)
- Cipher stats
- Time played timeline (if missions have timestamps)

#### Phase 4 — Player ID configuration
- Allow user to enter their own player ID in **Data Management** page
- Persist to `localStorage` key `wf-player-id`
- Show a "Link your profile" prompt on the Overview page if not set

---

### Rate-Limit Strategy

The API is public but rate-limited. Mitigations:
1. **24h localStorage TTL** — never fetch more than once per day
2. **Manual refresh only** — no automatic background polling
3. **Single player scope** — only fetch the configured player's profile
4. **Offline fallback** — if fetch fails, surface stale cached data with a staleness warning

---

### Files to Create / Modify

| File | Action |
|---|---|
| `src/lib/warframe-profile-api.ts` | New — fetch + cache logic + TanStack Query hook |
| `src/features/warframe-tracker/data/types.ts` | Add `WarframeProfile` types |
| `src/features/warframe-tracker/index.tsx` | Add profile stats card |
| `src/features/warframe-tracker/components/warframes-page.tsx` | Highlight equipped Warframe |
| `src/features/warframe-tracker/components/weapons-page.tsx` | Per-weapon kill stats overlay |
| `src/routes/_authenticated/warframe-tracker/stats.tsx` | New route — stats page |
| `src/features/warframe-tracker/components/stats-page.tsx` | New — stats page component |
| `src/components/layout/data/sidebar-data.ts` | Add Stats nav item under Warframe Tracker |
| `src/routeTree.gen.ts` | Auto-generated on next `pnpm dev` |
| `.env.example` | Add `VITE_WARFRAME_PLAYER_ID=` |
| `src/resources/warframe/profile-sample.json` | Already stored (371 KB) |

---

### Open Questions

- Does the API support CORS from browser? If not, needs a proxy (Vite dev proxy or Netlify function).
- Is the `playerId` the same as the MongoDB ObjectId in `AccountId.$oid`? Yes — confirmed from sample.
- `LoadOutInventory` only shows equipped items, not full inventory. Full ownership tracking still relies on our localStorage/PocketBase tracker.
