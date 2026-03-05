import { useState } from 'react'
import { Check, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getItemImageUrl } from '@/lib/warframe-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUpdateResource } from '../data/mutations'

interface ResourceRowProps {
  uniqueName: string
  resourceName: string
  imageName?: string
  currentQuantity: number
  neededQuantity?: number
  neededBy?: string[]
}

export function ResourceRow({
  uniqueName,
  resourceName,
  imageName,
  currentQuantity,
  neededQuantity,
  neededBy,
}: ResourceRowProps) {
  const [quantity, setQuantity] = useState(currentQuantity)
  const updateResource = useUpdateResource()
  const hasChanged = quantity !== currentQuantity
  const shortage = neededQuantity ? Math.max(0, neededQuantity - quantity) : 0

  const handleSave = () => {
    updateResource.mutate({
      uniqueName,
      resourceName,
      quantity,
    })
  }

  return (
    <div className='flex items-center gap-3 rounded-lg border px-3 py-2'>
      <div className='bg-muted flex size-8 shrink-0 items-center justify-center rounded'>
        <img
          src={getItemImageUrl(imageName)}
          alt={resourceName}
          className='size-6 object-contain'
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>

      <div className='min-w-0 flex-1'>
        <div className='truncate text-sm font-medium'>{resourceName}</div>
        {neededQuantity !== undefined && neededQuantity > 0 && (
          <div
            className={cn(
              'text-xs',
              shortage > 0 ? 'text-destructive' : 'text-green-600'
            )}
          >
            {shortage > 0 ? `Need ${shortage.toLocaleString()} more` : 'Enough'}{' '}
            (need {neededQuantity.toLocaleString()})
          </div>
        )}
        {neededBy && neededBy.length > 0 && (
          <div className='text-muted-foreground mt-0.5 truncate text-[10px]'>
            For: {neededBy.map(name => name.replace(/^Blueprint for\s+/i, '')).join(', ')}
          </div>
        )}
      </div>

      <div className='flex items-center gap-1'>
        <Button
          variant='outline'
          size='icon'
          className='size-7'
          onClick={() => setQuantity(Math.max(0, quantity - 1))}
        >
          <Minus className='size-3' />
        </Button>
        <Input
          type='number'
          min={0}
          value={quantity}
          onChange={(e) =>
            setQuantity(Math.max(0, parseInt(e.target.value) || 0))
          }
          className='h-7 w-20 text-center text-sm'
        />
        <Button
          variant='outline'
          size='icon'
          className='size-7'
          onClick={() => setQuantity(quantity + 1)}
        >
          <Plus className='size-3' />
        </Button>
        {hasChanged && (
          <Button
            variant='default'
            size='icon'
            className='size-7'
            onClick={handleSave}
          >
            <Check className='size-3' />
          </Button>
        )}
      </div>
    </div>
  )
}
