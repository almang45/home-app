import {
  Star,
  Heart,
  HeartOff,
  CheckCircle,
  XCircle,
  Award,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getItemImageUrl } from '@/lib/warframe-api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  useToggleOwned,
  useToggleMastered,
  useToggleWishlist,
} from '../data/mutations'
import { useIsOwned, useIsMastered, useIsInWishlist } from '../data/queries'
import type { WarframeItem } from '../data/types'

interface ItemCardProps {
  item: WarframeItem
  onClick?: (item: WarframeItem) => void
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  const isOwned = useIsOwned(item.uniqueName)
  const isMastered = useIsMastered(item.uniqueName)
  const isInWishlist = useIsInWishlist(item.uniqueName)
  const toggleOwned = useToggleOwned()
  const toggleMastered = useToggleMastered()
  const toggleWishlist = useToggleWishlist()

  return (
    <div
      className={cn(
        'group bg-card relative flex cursor-pointer flex-col overflow-hidden rounded-lg border transition-all hover:shadow-md',
        isOwned && 'border-primary/40 bg-primary/5',
        isMastered && 'border-amber-500/40 bg-amber-500/5'
      )}
      onClick={() => onClick?.(item)}
    >
      {/* Badges row -- absolute top-right */}
      <div className='absolute top-1 right-1 z-10 flex gap-0.5'>
        {item.isPrime && (
          <Badge variant='secondary' className='px-1 py-0 text-[10px]'>
            <Star className='mr-0.5 size-2.5' />
            Prime
          </Badge>
        )}
        {item.vaulted && (
          <Badge
            variant='outline'
            className='bg-background/80 px-1 py-0 text-[10px]'
          >
            Vaulted
          </Badge>
        )}
      </div>

      {/* Fixed-height image area */}
      <div className='bg-muted/50 flex h-24 items-center justify-center'>
        <img
          src={getItemImageUrl(item.imageName)}
          alt={item.name}
          className='size-16 object-contain'
          loading='lazy'
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>

      {/* Content area */}
      <div className='flex flex-1 flex-col gap-2 p-2'>
        {/* Name - fixed two-line height with truncation */}
        <h3 className='line-clamp-2 min-h-[2.5rem] text-sm leading-tight font-semibold'>
          {item.name}
        </h3>

        {/* Meta row */}
        <div className='text-muted-foreground flex items-center justify-between text-xs'>
          {item.masteryReq !== undefined && item.masteryReq > 0 ? (
            <span>MR {item.masteryReq}</span>
          ) : (
            <span />
          )}
          <span className='capitalize'>{item.category}</span>
        </div>

        {/* Action buttons */}
        <div className='mt-auto flex gap-1'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isOwned ? 'default' : 'outline'}
                  size='sm'
                  className='h-7 flex-1 text-xs'
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleOwned.mutate({
                      uniqueName: item.uniqueName,
                      itemName: item.name,
                      category: item.category,
                      isOwned,
                    })
                  }}
                >
                  {isOwned ? (
                    <CheckCircle className='mr-1 size-3' />
                  ) : (
                    <XCircle className='mr-1 size-3' />
                  )}
                  {isOwned ? 'Owned' : 'Own'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isOwned ? 'Remove from owned' : 'Mark as owned'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isMastered ? 'default' : 'outline'}
                  size='sm'
                  className={cn(
                    'h-7 w-9 p-0',
                    isMastered && 'bg-amber-600 text-white hover:bg-amber-700'
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleMastered.mutate({
                      uniqueName: item.uniqueName,
                      itemName: item.name,
                      category: item.category,
                      isMastered,
                    })
                  }}
                >
                  <Award className='size-3' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isMastered ? 'Remove mastered status' : 'Mark as mastered'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isInWishlist ? 'destructive' : 'outline'}
                  size='sm'
                  className='h-7 w-9 p-0'
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleWishlist.mutate({
                      uniqueName: item.uniqueName,
                      itemName: item.name,
                      category: item.category,
                      isInWishlist,
                    })
                  }}
                >
                  {isInWishlist ? (
                    <HeartOff className='size-3' />
                  ) : (
                    <Heart className='size-3' />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
