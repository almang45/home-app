import { ExternalLink, Newspaper, Radio } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { WarframeNews } from '../data/types'

interface NewsCardProps {
  news: WarframeNews
}

export function NewsCard({ news }: NewsCardProps) {
  const date = new Date(news.date)
  const isValidDate = date.getFullYear() > 1971

  return (
    <Card className='group overflow-hidden transition-all hover:shadow-md'>
      <a
        href={news.link}
        target='_blank'
        rel='noopener noreferrer'
        className='block'
      >
        {news.imageLink && !news.imageLink.includes('news-placeholder') && (
          <div className='bg-muted aspect-video w-full overflow-hidden'>
            <img
              src={news.imageLink}
              alt={news.message}
              className='size-full object-cover transition-transform group-hover:scale-105'
              loading='lazy'
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}
        <CardHeader className='pb-2'>
          <div className='flex items-start justify-between gap-2'>
            <CardTitle className='text-sm leading-tight'>
              {news.message}
            </CardTitle>
            <ExternalLink className='text-muted-foreground size-3.5 shrink-0' />
          </div>
          {isValidDate && (
            <CardDescription>
              {date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className='flex gap-1.5 pt-0'>
          {news.update && (
            <Badge variant='default' className='text-[10px]'>
              <Newspaper className='mr-0.5 size-2.5' />
              Update
            </Badge>
          )}
          {news.primeAccess && (
            <Badge variant='secondary' className='text-[10px]'>
              Prime Access
            </Badge>
          )}
          {news.stream && (
            <Badge variant='outline' className='text-[10px]'>
              <Radio className='mr-0.5 size-2.5' />
              Stream
            </Badge>
          )}
        </CardContent>
      </a>
    </Card>
  )
}
