import { useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useOthers } from '../data/queries'
import { ItemsGrid } from './items-grid'

export function OthersPage() {
  const [tab, setTab] = useState('all')
  const { data, isLoading } = useOthers()

  const types = useMemo(() => {
    if (!data) return []
    const set = new Set(
      data.map((i) => i.type).filter((t): t is string => Boolean(t))
    )
    return Array.from(set).sort()
  }, [data])

  const filteredData = useMemo(() => {
    if (tab === 'all') return data
    return data?.filter((i) => i.type === tab)
  }, [data, tab])

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
          <h2 className='text-2xl font-bold tracking-tight'>Others</h2>
          <p className='text-muted-foreground'>
            Amps, K-Drives, Zaws, and other masterable items. Track what you
            own and have mastered.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className='space-y-4'>
          <TabsList className='flex-wrap'>
            <TabsTrigger value='all'>
              All
              {data && (
                <span className='text-muted-foreground ml-1.5 text-xs'>
                  ({data.length})
                </span>
              )}
            </TabsTrigger>
            {types.map((t) => (
              <TabsTrigger key={t} value={t}>
                {t}
                {data && (
                  <span className='text-muted-foreground ml-1.5 text-xs'>
                    ({data.filter((i) => i.type === t).length})
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={tab}>
            <ItemsGrid
              items={filteredData}
              isLoading={isLoading}
              searchPlaceholder={
                tab === 'all' ? 'Search others...' : `Search ${tab}s...`
              }
              showFilters
            />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
