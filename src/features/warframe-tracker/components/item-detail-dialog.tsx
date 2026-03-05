import { useState } from 'react'
import {
  Award,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Coins,
  Heart,
  HeartOff,
  MapPin,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getItemImageUrl } from '@/lib/warframe-api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  useToggleOwned,
  useToggleMastered,
  useToggleWishlist,
} from '../data/mutations'
import { useIsOwned, useIsMastered, useIsInWishlist } from '../data/queries'
import type { ItemComponent, WarframeItem } from '../data/types'

interface ItemDetailDialogProps {
  item: WarframeItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ItemDetailDialog({
  item,
  open,
  onOpenChange,
}: ItemDetailDialogProps) {
  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {item.name}
            {item.isPrime && <Badge variant='secondary'>Prime</Badge>}
            {item.vaulted && <Badge variant='outline'>Vaulted</Badge>}
          </DialogTitle>
          <DialogDescription className='text-left'>
            {item.description || `${item.category} item`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='max-h-[60vh]'>
          <div className='space-y-4 pr-4'>
            <ItemImage item={item} />
            <ItemActions item={item} />
            <ItemStats item={item} />

            {item.abilities && item.abilities.length > 0 && (
              <AbilitiesSection abilities={item.abilities} />
            )}

            {item.components && item.components.length > 0 && (
              <ComponentsSection item={item} />
            )}

            {item.drops && item.drops.length > 0 && (
              <DropsSection drops={item.drops} />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function ItemImage({ item }: { item: WarframeItem }) {
  return (
    <div className='flex justify-center'>
      <div className='bg-muted flex size-28 items-center justify-center rounded-lg'>
        <img
          src={getItemImageUrl(item.imageName)}
          alt={item.name}
          className='size-24 object-contain'
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
    </div>
  )
}

function ItemActions({ item }: { item: WarframeItem }) {
  const isOwned = useIsOwned(item.uniqueName)
  const isMastered = useIsMastered(item.uniqueName)
  const isInWishlist = useIsInWishlist(item.uniqueName)
  const toggleOwned = useToggleOwned()
  const toggleMastered = useToggleMastered()
  const toggleWishlist = useToggleWishlist()

  return (
    <div className='flex gap-2'>
      <Button
        variant={isOwned ? 'default' : 'outline'}
        size='sm'
        className='flex-1'
        onClick={() =>
          toggleOwned.mutate({
            uniqueName: item.uniqueName,
            itemName: item.name,
            category: item.category,
            isOwned,
          })
        }
      >
        {isOwned ? (
          <CheckCircle className='mr-2 size-4' />
        ) : (
          <XCircle className='mr-2 size-4' />
        )}
        {isOwned ? 'Owned' : 'Mark as Owned'}
      </Button>
      <Button
        variant={isMastered ? 'default' : 'outline'}
        size='sm'
        className={cn(
          'flex-1',
          isMastered && 'bg-amber-600 text-white hover:bg-amber-700'
        )}
        onClick={() =>
          toggleMastered.mutate({
            uniqueName: item.uniqueName,
            itemName: item.name,
            category: item.category,
            isMastered,
          })
        }
      >
        <Award className='mr-2 size-4' />
        {isMastered ? 'Mastered' : 'Mark Mastered'}
      </Button>
      <Button
        variant={isInWishlist ? 'destructive' : 'outline'}
        size='sm'
        className='flex-1'
        onClick={() =>
          toggleWishlist.mutate({
            uniqueName: item.uniqueName,
            itemName: item.name,
            category: item.category,
            isInWishlist,
          })
        }
      >
        {isInWishlist ? (
          <HeartOff className='mr-2 size-4' />
        ) : (
          <Heart className='mr-2 size-4' />
        )}
        {isInWishlist ? 'Remove Wishlist' : 'Add Wishlist'}
      </Button>
    </div>
  )
}

function ItemStats({ item }: { item: WarframeItem }) {
  const stats: { label: string; value: string | number }[] = []

  if (item.masteryReq)
    stats.push({ label: 'Mastery Req', value: item.masteryReq })
  if (item.health) stats.push({ label: 'Health', value: item.health })
  if (item.shield) stats.push({ label: 'Shield', value: item.shield })
  if (item.armor) stats.push({ label: 'Armor', value: item.armor })
  if (item.power) stats.push({ label: 'Energy', value: item.power })
  if (item.sprintSpeed) stats.push({ label: 'Sprint', value: item.sprintSpeed })
  if (item.criticalChance)
    stats.push({
      label: 'Crit Chance',
      value: `${(item.criticalChance * 100).toFixed(1)}%`,
    })
  if (item.criticalMultiplier)
    stats.push({ label: 'Crit Multi', value: `${item.criticalMultiplier}x` })
  if (item.fireRate)
    stats.push({ label: 'Fire Rate', value: item.fireRate.toFixed(1) })

  if (stats.length === 0) return null

  return (
    <div>
      <h4 className='mb-2 text-sm font-semibold'>Stats</h4>
      <div className='grid grid-cols-2 gap-2 text-sm'>
        {stats.map((s) => (
          <div
            key={s.label}
            className='bg-muted flex justify-between rounded px-2 py-1'
          >
            <span className='text-muted-foreground'>{s.label}</span>
            <span className='font-medium'>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AbilitiesSection({
  abilities,
}: {
  abilities: NonNullable<WarframeItem['abilities']>
}) {
  return (
    <div>
      <h4 className='mb-2 text-sm font-semibold'>Abilities</h4>
      <div className='space-y-2'>
        {abilities.map((a) => (
          <div key={a.uniqueName} className='rounded border p-2'>
            <div className='flex items-center gap-2'>
              <img
                src={getItemImageUrl(a.imageName)}
                alt={a.name}
                className='size-6 object-contain'
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <span className='text-sm font-medium'>{a.name}</span>
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>
              {a.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ComponentRow({
  component,
  parentName,
  depth,
}: {
  component: ItemComponent
  parentName: string
  depth: number
}) {
  const [expanded, setExpanded] = useState(false)
  const hasSubComponents =
    component.components && component.components.length > 0

  const displayName = `${parentName} ${component.name}`

  return (
    <div>
      <div
        className={cn(
          'flex items-center justify-between rounded px-2 py-1 text-sm',
          depth === 0 ? 'bg-muted' : 'bg-muted/50',
          hasSubComponents && 'hover:bg-muted/80 cursor-pointer'
        )}
        style={{ marginLeft: depth * 12 }}
        onClick={() => hasSubComponents && setExpanded(!expanded)}
      >
        <div className='flex items-center gap-2'>
          {hasSubComponents &&
            (expanded ? (
              <ChevronDown className='text-muted-foreground size-3.5 shrink-0' />
            ) : (
              <ChevronRight className='text-muted-foreground size-3.5 shrink-0' />
            ))}
          <img
            src={getItemImageUrl(component.imageName)}
            alt={component.name}
            className='size-5 object-contain'
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <span className={cn(hasSubComponents && 'font-medium')}>
            {displayName}
          </span>
        </div>
        <span className='font-medium'>x{component.itemCount}</span>
      </div>

      {expanded && hasSubComponents && (
        <div className='mt-1 space-y-1'>
          {component.components!.map((sub) => (
            <ComponentRow
              key={sub.uniqueName}
              component={sub}
              parentName={displayName}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ComponentsSection({ item }: { item: WarframeItem }) {
  if (!item.components) return null

  return (
    <div>
      <Separator className='my-2' />
      <h4 className='mb-2 text-sm font-semibold'>Build Requirements</h4>
      {item.buildPrice && (
        <div className='text-muted-foreground mb-2 flex items-center gap-1 text-xs'>
          <Coins className='size-3' />
          {item.buildPrice.toLocaleString()} Credits
        </div>
      )}
      {item.buildTime && (
        <div className='text-muted-foreground mb-2 flex items-center gap-1 text-xs'>
          <Clock className='size-3' />
          {Math.floor(item.buildTime / 3600)}h build time
        </div>
      )}
      <div className='space-y-1'>
        {item.components.map((c) => (
          <ComponentRow
            key={c.uniqueName}
            component={c}
            parentName={item.name}
            depth={0}
          />
        ))}
      </div>
    </div>
  )
}

function DropsSection({
  drops,
}: {
  drops: NonNullable<WarframeItem['drops']>
}) {
  const limitedDrops = drops.slice(0, 10)

  return (
    <div>
      <Separator className='my-2' />
      <h4 className='mb-2 text-sm font-semibold'>Drop Locations</h4>
      <div className='space-y-1'>
        {limitedDrops.map((d, i) => (
          <div
            key={`${d.location}-${i}`}
            className='bg-muted flex items-center justify-between rounded px-2 py-1 text-xs'
          >
            <div className='flex items-center gap-1'>
              <MapPin className='size-3 shrink-0' />
              <span className='truncate'>{d.location}</span>
            </div>
            {d.chance !== null && (
              <span className='shrink-0 font-medium'>
                {(d.chance * 100).toFixed(1)}%
              </span>
            )}
          </div>
        ))}
        {drops.length > 10 && (
          <p className='text-muted-foreground text-center text-xs'>
            +{drops.length - 10} more locations
          </p>
        )}
      </div>
    </div>
  )
}
