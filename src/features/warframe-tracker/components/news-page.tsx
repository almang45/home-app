import { useMemo } from 'react'
import { CalendarClock, Newspaper, Radio, Wifi } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  useWarframeNews,
  useWarframeEvents,
  useNewlyReleasedItems,
} from '../data/queries'
import { NewItemsSection } from './new-items-section'
import { NewsCard } from './news-card'

export function NewsPage() {
  const { data: news, isLoading: newsLoading } = useWarframeNews()
  const { data: events, isLoading: eventsLoading } = useWarframeEvents()
  const { data: newItems, isLoading: itemsLoading } = useNewlyReleasedItems()

  const sortedNews = useMemo(() => {
    if (!news) return []
    return [...news]
      .filter((n) => new Date(n.date).getFullYear() > 1971)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [news])

  const activeEvents = useMemo(() => {
    if (!events) return []
    const now = new Date()
    return events.filter((e) => new Date(e.expiry) > now)
  }, [events])

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
        <div className='mb-6'>
          <h2 className='text-2xl font-bold tracking-tight'>
            News &amp; Alerts
          </h2>
          <p className='text-muted-foreground'>
            Stay up to date with the latest game updates, new releases, and
            active events.
          </p>
        </div>

        <Alert className='mb-6'>
          <Wifi className='size-4' />
          <AlertTitle>Live Data</AlertTitle>
          <AlertDescription>
            News and events require connection to api.warframestat.us. Item data
            is always available offline from GitHub.
          </AlertDescription>
        </Alert>

        <div className='space-y-8'>
          {/* New Releases */}
          <section>
            <NewItemsSection items={newItems} isLoading={itemsLoading} />
          </section>

          <Separator />

          {/* Active Events */}
          <section>
            <div className='mb-3 flex items-center gap-2'>
              <Radio className='size-4 text-green-500' />
              <h3 className='text-sm font-semibold'>
                Active Events ({activeEvents.length})
              </h3>
            </div>

            {eventsLoading ? (
              <div className='text-muted-foreground text-sm'>
                Loading events...
              </div>
            ) : activeEvents.length === 0 ? (
              <div className='text-muted-foreground text-sm'>
                No active events right now.
              </div>
            ) : (
              <div className='grid gap-3 sm:grid-cols-2'>
                {activeEvents.map((event) => {
                  const expiry = new Date(event.expiry)
                  const now = new Date()
                  const daysLeft = Math.ceil(
                    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  )

                  return (
                    <Card key={event.id}>
                      <CardHeader className='pb-2'>
                        <CardTitle className='text-sm'>
                          {event.description}
                        </CardTitle>
                        <CardDescription>{event.node}</CardDescription>
                      </CardHeader>
                      <CardContent className='space-y-2'>
                        <div className='text-muted-foreground flex items-center gap-1 text-xs'>
                          <CalendarClock className='size-3' />
                          {daysLeft > 0
                            ? `${daysLeft} day${daysLeft > 1 ? 's' : ''} remaining`
                            : 'Ending soon'}
                        </div>
                        {event.rewards.length > 0 && (
                          <div className='flex flex-wrap gap-1'>
                            {event.rewards.flatMap((r) =>
                              r.items.map((item) => (
                                <Badge
                                  key={item}
                                  variant='secondary'
                                  className='text-[10px]'
                                >
                                  {item}
                                </Badge>
                              ))
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>

          <Separator />

          {/* Game News */}
          <section>
            <div className='mb-3 flex items-center gap-2'>
              <Newspaper className='size-4' />
              <h3 className='text-sm font-semibold'>
                Latest News ({sortedNews.length})
              </h3>
            </div>

            {newsLoading ? (
              <div className='text-muted-foreground text-sm'>
                Loading news...
              </div>
            ) : (
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {sortedNews.map((n) => (
                  <NewsCard key={n.id} news={n} />
                ))}
              </div>
            )}
          </section>
        </div>
      </Main>
    </>
  )
}
