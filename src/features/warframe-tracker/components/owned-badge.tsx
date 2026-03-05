import { CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface OwnedBadgeProps {
  owned: boolean
}

export function OwnedBadge({ owned }: OwnedBadgeProps) {
  if (!owned) return null
  return (
    <Badge variant='default' className='gap-1'>
      <CheckCircle className='size-3' />
      Owned
    </Badge>
  )
}
