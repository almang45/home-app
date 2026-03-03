import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { WarframeItem } from '../data/types'
import { ItemCard } from './item-card'
import { ItemDetailDialog } from './item-detail-dialog'

interface NewItemsSectionProps {
  items: WarframeItem[] | undefined
  isLoading: boolean
}

export function NewItemsSection({ items, isLoading }: NewItemsSectionProps) {
  const [selectedItem, setSelectedItem] = useState<WarframeItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  if (isLoading) {
    return (
      <div className='text-muted-foreground py-4 text-sm'>
        Loading new releases...
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className='text-muted-foreground py-4 text-sm'>
        No new warframes or weapons released in the last 90 days.
      </div>
    )
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center gap-2'>
        <Sparkles className='size-4 text-yellow-500' />
        <h3 className='text-sm font-semibold'>New Releases ({items.length})</h3>
      </div>
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
        {items.map((item) => (
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
      <ItemDetailDialog
        item={selectedItem}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
