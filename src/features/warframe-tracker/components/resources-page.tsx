import { useState, useMemo } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  useResources,
  useResourceInventory,
  useEnrichedWishlistItems,
  getAggregatedResourcesFromEnriched,
} from '../data/queries'
import { ResourceRow } from './resource-row'

interface DisplayResource {
  uniqueName: string
  name: string
  imageName?: string
  currentQuantity: number
  neededQuantity?: number
  neededBy: string[]
}

export function ResourcesPage() {
  const [search, setSearch] = useState('')
  const [showOnlyNeeded, setShowOnlyNeeded] = useState(false)
  const { data: resources, isLoading } = useResources()
  const { data: inventory } = useResourceInventory()
  const { data: enrichedItems, isLoading: enrichedLoading } =
    useEnrichedWishlistItems()

  const neededMap = useMemo(() => {
    if (!enrichedItems) return new Map()
    return getAggregatedResourcesFromEnriched(enrichedItems)
  }, [enrichedItems])

  const displayList = useMemo(() => {
    const resourceMap = new Map<string, DisplayResource>()

    for (const r of resources ?? []) {
      const currentQty =
        inventory?.find((i) => i.uniqueName === r.uniqueName)?.quantity ?? 0
      const needed = neededMap.get(r.uniqueName)
      resourceMap.set(r.uniqueName, {
        uniqueName: r.uniqueName,
        name: r.name,
        imageName: r.imageName,
        currentQuantity: currentQty,
        neededQuantity: needed?.needed,
        neededBy: needed?.sources ?? [],
      })
    }

    for (const [uniqueName, agg] of neededMap) {
      if (!resourceMap.has(uniqueName)) {
        const currentQty =
          inventory?.find((i) => i.uniqueName === uniqueName)?.quantity ?? 0
        resourceMap.set(uniqueName, {
          uniqueName,
          name: agg.name,
          imageName: undefined,
          currentQuantity: currentQty,
          neededQuantity: agg.needed,
          neededBy: agg.sources,
        })
      }
    }

    let result = Array.from(resourceMap.values())

    if (search.trim()) {
      const lower = search.toLowerCase()
      result = result.filter((r) => r.name.toLowerCase().includes(lower))
    }

    if (showOnlyNeeded) {
      result = result.filter(
        (r) => r.neededQuantity !== undefined && r.neededQuantity > 0
      )
    }

    return result.sort((a, b) => {
      if (showOnlyNeeded) {
        const aMissing = Math.max(
          0,
          (a.neededQuantity ?? 0) - a.currentQuantity
        )
        const bMissing = Math.max(
          0,
          (b.neededQuantity ?? 0) - b.currentQuantity
        )
        if (bMissing !== aMissing) return bMissing - aMissing
      }
      return a.name.localeCompare(b.name)
    })
  }, [resources, inventory, neededMap, search, showOnlyNeeded])

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-4'>
          <h2 className='text-2xl font-bold tracking-tight'>Inventory</h2>
          <p className='text-muted-foreground'>
            Track your resource inventory. Resources needed by your wishlist
            (including sub-components like Chassis, Neuroptics, Systems) are
            included automatically.
          </p>
        </div>

        <div className='space-y-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <div className='relative flex-1'>
              <SearchIcon className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
              <Input
                placeholder='Search resources...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-9'
              />
            </div>
            <div className='flex items-center gap-2'>
              <Switch
                id='show-needed'
                checked={showOnlyNeeded}
                onCheckedChange={setShowOnlyNeeded}
              />
              <Label htmlFor='show-needed' className='cursor-pointer text-sm'>
                Needed by Wishlist only
              </Label>
            </div>
          </div>

          {isLoading || enrichedLoading ? (
            <div className='text-muted-foreground py-12 text-center'>
              Loading resources...
            </div>
          ) : (
            <div className='space-y-2'>
              <p className='text-muted-foreground text-sm'>
                {displayList.length} resources found
              </p>
              {displayList.map((resource) => (
                <ResourceRow
                  key={resource.uniqueName}
                  uniqueName={resource.uniqueName}
                  resourceName={resource.name}
                  imageName={resource.imageName}
                  currentQuantity={resource.currentQuantity}
                  neededQuantity={resource.neededQuantity}
                  neededBy={resource.neededBy}
                />
              ))}
            </div>
          )}
        </div>
      </Main>
    </>
  )
}
