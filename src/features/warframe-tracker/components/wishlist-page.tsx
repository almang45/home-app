import { useState } from 'react'
import { ChevronDown, ChevronRight, Heart, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getItemImageUrl } from '@/lib/warframe-api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useToggleWishlist } from '../data/mutations'
import {
  useWishlistItems,
  useAllItems,
  useResourceInventory,
  useEnrichedWishlistItems,
} from '../data/queries'
import type { ItemComponent, WarframeItem } from '../data/types'
import { ItemDetailDialog } from './item-detail-dialog'
import { WishlistSummary } from './wishlist-summary'

/** Sub-blueprint component names that should be prefixed with the parent item name */
const SUB_BLUEPRINT_NAMES = new Set([
  'Neuroptics',
  'Chassis',
  'Systems',
  'Blueprint',
  'Barrel',
  'Receiver',
  'Stock',
  'Blade',
  'Handle',
  'Hilt',
  'String',
  'Grip',
  'Lower Limb',
  'Upper Limb',
  'Link',
  'Disc',
  'Guard',
  'Head',
  'Boot',
  'Gauntlet',
  'Stars',
  'Pouch',
  'Ornament',
])

function isSubBlueprint(comp: ItemComponent): boolean {
  return (
    SUB_BLUEPRINT_NAMES.has(comp.name) ||
    (comp.components !== undefined && comp.components.length > 0)
  )
}

function getDisplayName(comp: ItemComponent, parentItemName: string): string {
  if (isSubBlueprint(comp)) {
    return `${parentItemName} ${comp.name}`
  }
  return comp.name
}

function ComponentTreeNode({
  component,
  parentItemName,
  inventory,
  depth,
}: {
  component: ItemComponent
  parentItemName: string
  inventory: Map<string, number>
  depth: number
}) {
  // Expand all levels by default to show full material breakdown
  const [expanded, setExpanded] = useState(true)
  const hasSubs = component.components && component.components.length > 0
  const displayName = getDisplayName(component, parentItemName)
  const subParentName = isSubBlueprint(component) ? displayName : parentItemName

  const owned = inventory.get(component.uniqueName) ?? 0
  const missing = Math.max(0, component.itemCount - owned)
  const isResource = !hasSubs

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 rounded px-2 py-1 text-sm',
          depth === 0 && 'bg-muted/60',
          depth > 0 && 'bg-muted/30',
          hasSubs && 'hover:bg-muted/80 cursor-pointer'
        )}
        style={{ paddingLeft: 8 + depth * 16 }}
        onClick={() => hasSubs && setExpanded(!expanded)}
      >
        {hasSubs ? (
          expanded ? (
            <ChevronDown className='text-muted-foreground size-3.5 shrink-0' />
          ) : (
            <ChevronRight className='text-muted-foreground size-3.5 shrink-0' />
          )
        ) : (
          <span className='w-3.5 shrink-0' />
        )}
        <img
          src={getItemImageUrl(component.imageName)}
          alt={displayName}
          className='size-4 shrink-0 object-contain'
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        <span className={cn('flex-1 truncate', hasSubs && 'font-medium')}>
          {displayName}
        </span>
        <span className='shrink-0 tabular-nums'>x{component.itemCount}</span>
        {isResource && (
          <div className='flex shrink-0 items-center gap-1.5 text-xs'>
            <span className='text-muted-foreground'>
              owned: {owned.toLocaleString()}
            </span>
            {missing > 0 ? (
              <Badge variant='destructive' className='px-1 py-0 text-[10px]'>
                -{missing.toLocaleString()}
              </Badge>
            ) : (
              <Badge
                variant='outline'
                className='border-green-600/50 px-1 py-0 text-[10px] text-green-600'
              >
                OK
              </Badge>
            )}
          </div>
        )}
      </div>

      {expanded && hasSubs && (
        <div className='space-y-0.5'>
          {component.components!.map((sub) => (
            <ComponentTreeNode
              key={sub.uniqueName}
              component={sub}
              parentItemName={subParentName}
              inventory={inventory}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function WishlistItemRow({
  wish,
  detail,
  inventory,
  onClickDetail,
  onRemove,
}: {
  wish: { uniqueName: string; itemName: string; category: string }
  detail: WarframeItem | undefined
  inventory: Map<string, number>
  onClickDetail: () => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const hasComponents = detail?.components && detail.components.length > 0

  return (
    <div className='rounded-lg border'>
      {/* Header row */}
      <div className='flex items-center gap-3 px-3 py-2'>
        <div
          className='bg-muted flex size-10 shrink-0 cursor-pointer items-center justify-center rounded'
          onClick={onClickDetail}
        >
          <img
            src={getItemImageUrl(detail?.imageName)}
            alt={wish.itemName}
            className='size-8 object-contain'
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>

        <div
          className='min-w-0 flex-1 cursor-pointer'
          onClick={() => {
            if (hasComponents) setExpanded(!expanded)
            else onClickDetail()
          }}
        >
          <div className='flex items-center gap-2'>
            <span className='truncate text-sm font-medium'>
              {wish.itemName}
            </span>
            <Badge variant='outline' className='text-[10px]'>
              {wish.category}
            </Badge>
            {hasComponents && (
              <span className='text-muted-foreground text-xs'>
                {detail!.components!.length} components
              </span>
            )}
          </div>
        </div>

        {hasComponents && (
          <Button
            variant='ghost'
            size='icon'
            className='size-7 shrink-0'
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronDown className='size-4' />
            ) : (
              <ChevronRight className='size-4' />
            )}
          </Button>
        )}

        <Button
          variant='ghost'
          size='icon'
          className='text-destructive hover:text-destructive size-8 shrink-0'
          onClick={onRemove}
        >
          <Trash2 className='size-4' />
        </Button>
      </div>

      {/* Expandable component tree */}
      {expanded && hasComponents && (
        <div className='space-y-0.5 border-t px-1 py-2'>
          {detail!.components!.map((comp) => (
            <ComponentTreeNode
              key={comp.uniqueName}
              component={comp}
              parentItemName={wish.itemName}
              inventory={inventory}
              depth={0}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function WishlistPage() {
  const { data: wishlist, isLoading: wlLoading } = useWishlistItems()
  const { data: allItems, isLoading: itemsLoading } = useAllItems()
  const { data: enrichedItems, isLoading: enrichedLoading } =
    useEnrichedWishlistItems()
  const { data: inventory } = useResourceInventory()
  const toggleWishlist = useToggleWishlist()
  const [selectedItem, setSelectedItem] = useState<WarframeItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const isLoading = wlLoading || itemsLoading

  const wishlistWithDetails = (wishlist ?? []).map((w) => {
    const detail = allItems?.find((i) => i.uniqueName === w.uniqueName)
    return { ...w, detail }
  })

  const inventoryMap = new Map(
    (inventory ?? []).map((r) => [r.uniqueName, r.quantity])
  )

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
          <h2 className='text-2xl font-bold tracking-tight'>
            Wishlist / Build Queue
          </h2>
          <p className='text-muted-foreground'>
            Items you want to build with aggregated resource requirements.
          </p>
        </div>

        {isLoading ? (
          <div className='text-muted-foreground py-12 text-center'>
            Loading wishlist...
          </div>
        ) : (
          <div className='grid gap-6 lg:grid-cols-[1fr_400px]'>
            <div className='space-y-3'>
              <h3 className='flex items-center gap-2 text-sm font-semibold'>
                <Heart className='size-4' />
                Wishlist Items ({wishlistWithDetails.length})
              </h3>

              {wishlistWithDetails.length === 0 ? (
                <div className='bg-muted/50 rounded-lg border py-12 text-center'>
                  <Heart className='text-muted-foreground mx-auto mb-3 size-10' />
                  <p className='text-muted-foreground text-sm'>
                    Your wishlist is empty. Browse warframes and weapons to add
                    items.
                  </p>
                </div>
              ) : (
                <div className='space-y-2'>
                  {wishlistWithDetails.map((w) => (
                    <WishlistItemRow
                      key={w.uniqueName}
                      wish={w}
                      detail={w.detail}
                      inventory={inventoryMap}
                      onClickDetail={() => {
                        if (w.detail) {
                          setSelectedItem(w.detail)
                          setDialogOpen(true)
                        }
                      }}
                      onRemove={() =>
                        toggleWishlist.mutate({
                          uniqueName: w.uniqueName,
                          itemName: w.itemName,
                          category: w.category,
                          isInWishlist: true,
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <WishlistSummary
                enrichedItems={enrichedItems ?? []}
                resourceInventory={inventory ?? []}
                isLoading={enrichedLoading}
              />
            </div>
          </div>
        )}

        <ItemDetailDialog
          item={selectedItem}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </Main>
    </>
  )
}
