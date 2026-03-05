import { useState } from 'react'
import { ChevronDown, ChevronRight, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getItemImageUrl } from '@/lib/warframe-api'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { ItemComponent, ResourceEntry, WarframeItem } from '../data/types'

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

function getDisplayName(comp: ItemComponent, parentName: string): string {
  if (isSubBlueprint(comp)) {
    return `${parentName} ${comp.name}`
  }
  return comp.name
}

function SummaryComponentNode({
  component,
  parentName,
  inventoryMap,
  depth,
}: {
  component: ItemComponent
  parentName: string
  inventoryMap: Map<string, number>
  depth: number
}) {
  // Expand all levels by default to show nested material breakdown
  const [expanded, setExpanded] = useState(true)
  const hasSubs = component.components && component.components.length > 0
  const displayName = getDisplayName(component, parentName)
  const subParentName = isSubBlueprint(component) ? displayName : parentName
  const isResource = !hasSubs

  const owned = inventoryMap.get(component.uniqueName) ?? 0
  const missing = Math.max(0, component.itemCount - owned)

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs',
          hasSubs && 'hover:bg-muted/60 cursor-pointer'
        )}
        style={{ paddingLeft: 4 + depth * 14 }}
        onClick={() => hasSubs && setExpanded(!expanded)}
      >
        {hasSubs ? (
          expanded ? (
            <ChevronDown className='text-muted-foreground size-3 shrink-0' />
          ) : (
            <ChevronRight className='text-muted-foreground size-3 shrink-0' />
          )
        ) : (
          <span className='w-3 shrink-0' />
        )}
        <img
          src={getItemImageUrl(component.imageName)}
          alt={displayName}
          className='size-3.5 shrink-0 object-contain'
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        <span
          className={cn('min-w-0 flex-1 truncate', hasSubs && 'font-medium')}
        >
          {displayName}
        </span>
        <span className='text-muted-foreground shrink-0 tabular-nums'>
          {component.itemCount.toLocaleString()}
        </span>
        {isResource && (
          <>
            <span className='text-muted-foreground w-12 shrink-0 text-right tabular-nums'>
              {owned.toLocaleString()}
            </span>
            <span
              className={cn(
                'w-12 shrink-0 text-right font-medium tabular-nums',
                missing > 0 ? 'text-destructive' : 'text-green-600'
              )}
            >
              {missing > 0 ? `-${missing.toLocaleString()}` : '0'}
            </span>
          </>
        )}
        {hasSubs && (
          <>
            <span className='w-12 shrink-0' />
            <span className='w-12 shrink-0' />
          </>
        )}
      </div>

      {expanded && hasSubs && (
        <div>
          {component.components!.map((sub) => (
            <SummaryComponentNode
              key={sub.uniqueName}
              component={sub}
              parentName={subParentName}
              inventoryMap={inventoryMap}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SummaryItemSection({
  item,
  inventoryMap,
}: {
  item: WarframeItem
  inventoryMap: Map<string, number>
}) {
  const [expanded, setExpanded] = useState(true)

  if (!item.components || item.components.length === 0) return null

  return (
    <div className='rounded-md border'>
      <div
        className='flex cursor-pointer items-center gap-2 px-2 py-1.5'
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className='text-muted-foreground size-3.5 shrink-0' />
        ) : (
          <ChevronRight className='text-muted-foreground size-3.5 shrink-0' />
        )}
        <img
          src={getItemImageUrl(item.imageName)}
          alt={item.name}
          className='size-5 shrink-0 object-contain'
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        <span className='flex-1 truncate text-sm font-semibold'>
          {item.name}
        </span>
      </div>

      {expanded && (
        <div className='border-t pb-1'>
          {/* Column headers */}
          <div
            className='text-muted-foreground flex items-center gap-1.5 px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase'
            style={{ paddingLeft: 4 + 14 }}
          >
            <span className='w-3 shrink-0' />
            <span className='w-3.5 shrink-0' />
            <span className='min-w-0 flex-1'>Component</span>
            <span className='shrink-0'>Req</span>
            <span className='w-12 shrink-0 text-right'>Owned</span>
            <span className='w-12 shrink-0 text-right'>Missing</span>
          </div>

          {item.components!.map((comp) => (
            <SummaryComponentNode
              key={comp.uniqueName}
              component={comp}
              parentName={item.name}
              inventoryMap={inventoryMap}
              depth={0}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface WishlistSummaryProps {
  enrichedItems: WarframeItem[]
  resourceInventory: ResourceEntry[]
  isLoading?: boolean
}

export function WishlistSummary({
  enrichedItems,
  resourceInventory,
  isLoading = false,
}: WishlistSummaryProps) {
  const inventoryMap = new Map(
    resourceInventory.map((r) => [r.uniqueName, r.quantity])
  )

  const wishlistDetails = enrichedItems.filter(
    (item): item is WarframeItem => !!item && !!item.components
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Package className='size-4' />
            Resource Breakdown
          </CardTitle>
          <CardDescription>Loading resource breakdown...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (wishlistDetails.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Package className='size-4' />
            Resource Breakdown
          </CardTitle>
          <CardDescription>
            Add items to your wishlist to see per-item resource needs.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const totalShortages = countShortages(wishlistDetails, inventoryMap)

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Package className='size-4' />
          Resource Breakdown
          {totalShortages > 0 && (
            <Badge variant='destructive' className='text-[10px]'>
              {totalShortages} shortage{totalShortages > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Per-item breakdown: components, sub-materials, owned vs. needed.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-2'>
        {wishlistDetails.map((item) => (
          <SummaryItemSection
            key={item.uniqueName}
            item={item}
            inventoryMap={inventoryMap}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function countLeafShortages(
  components: ItemComponent[] | undefined,
  inventoryMap: Map<string, number>
): number {
  if (!components) return 0
  let count = 0
  for (const comp of components) {
    if (comp.components && comp.components.length > 0) {
      count += countLeafShortages(comp.components, inventoryMap)
    } else {
      const owned = inventoryMap.get(comp.uniqueName) ?? 0
      if (owned < comp.itemCount) count++
    }
  }
  return count
}

function countShortages(
  items: WarframeItem[],
  inventoryMap: Map<string, number>
): number {
  let total = 0
  for (const item of items) {
    total += countLeafShortages(item.components, inventoryMap)
  }
  return total
}
