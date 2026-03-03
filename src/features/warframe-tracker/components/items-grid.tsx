import { useState, useMemo } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useOwnedItems, useMasteredItems } from '../data/queries'
import type { WarframeItem } from '../data/types'
import { ItemCard } from './item-card'
import { ItemDetailDialog } from './item-detail-dialog'

interface ItemsGridProps {
  items: WarframeItem[] | undefined
  isLoading: boolean
  searchPlaceholder?: string
  showFilters?: boolean
}

export function ItemsGrid({
  items,
  isLoading,
  searchPlaceholder = 'Search items...',
  showFilters = false,
}: ItemsGridProps) {
  const [search, setSearch] = useState('')
  const [hideOwned, setHideOwned] = useState(false)
  const [hideMastered, setHideMastered] = useState(false)
  const [selectedItem, setSelectedItem] = useState<WarframeItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: ownedItems } = useOwnedItems()
  const { data: masteredItems } = useMasteredItems()

  const ownedSet = useMemo(
    () => new Set((ownedItems ?? []).map((i) => i.uniqueName)),
    [ownedItems]
  )
  const masteredSet = useMemo(
    () => new Set((masteredItems ?? []).map((i) => i.uniqueName)),
    [masteredItems]
  )

  const filtered = useMemo(() => {
    if (!items) return []
    let result = items

    if (search.trim()) {
      const lower = search.toLowerCase()
      result = result.filter((item) => item.name.toLowerCase().includes(lower))
    }

    if (showFilters && hideOwned) {
      result = result.filter((item) => !ownedSet.has(item.uniqueName))
    }

    if (showFilters && hideMastered) {
      result = result.filter((item) => !masteredSet.has(item.uniqueName))
    }

    return result
  }, [
    items,
    search,
    hideOwned,
    hideMastered,
    showFilters,
    ownedSet,
    masteredSet,
  ])

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-muted-foreground'>Loading items...</div>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <div className='relative flex-1'>
          <SearchIcon className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>

        {showFilters && (
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              <Switch
                id='hide-owned'
                checked={hideOwned}
                onCheckedChange={setHideOwned}
              />
              <Label htmlFor='hide-owned' className='cursor-pointer text-sm'>
                Hide Owned
              </Label>
            </div>
            <div className='flex items-center gap-2'>
              <Switch
                id='hide-mastered'
                checked={hideMastered}
                onCheckedChange={setHideMastered}
              />
              <Label htmlFor='hide-mastered' className='cursor-pointer text-sm'>
                Hide Mastered
              </Label>
            </div>
          </div>
        )}
      </div>

      <div className='text-muted-foreground text-sm'>
        {filtered.length} items found
      </div>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
        {filtered.map((item) => (
          <ItemCard
            key={item.uniqueName}
            item={item}
            onClick={(i) => {
              setSelectedItem(i)
              setDialogOpen(true)
            }}
          />
        ))}
      </div>

      {filtered.length === 0 && !isLoading && (
        <div className='text-muted-foreground py-12 text-center'>
          No items found matching your search.
        </div>
      )}

      <ItemDetailDialog
        item={selectedItem}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
