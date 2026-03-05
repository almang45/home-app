import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useWarframes } from '../data/queries'
import type { WarframeItem } from '../data/types'
import { ItemsGrid } from './items-grid'

type WarframeTab = 'all' | 'warframe' | 'mecha'

const TABS: { value: WarframeTab; label: string; type?: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'warframe', label: 'Warframe', type: 'Warframe' },
  { value: 'mecha', label: 'Mecha', type: 'Mech' },
]

export function WarframesPage() {
  const [tab, setTab] = useState<string>('all')
  const { data: all, isLoading } = useWarframes()

  const dataByTab: Record<WarframeTab, WarframeItem[] | undefined> = {
    all,
    warframe: all?.filter((i) => i.type === 'Warframe'),
    mecha: all?.filter((i) => i.type === 'Mech'),
  }

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
          <h2 className='text-2xl font-bold tracking-tight'>Warframes</h2>
          <p className='text-muted-foreground'>
            Browse all warframes and mechs. Mark what you own and add to your
            wishlist.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className='space-y-4'>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                {all && (
                  <span className='text-muted-foreground ml-1.5 text-xs'>
                    ({dataByTab[t.value as WarframeTab]?.length ?? 0})
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((t) => (
            <TabsContent key={t.value} value={t.value}>
              <ItemsGrid
                items={dataByTab[t.value as WarframeTab]}
                isLoading={isLoading}
                searchPlaceholder={`Search ${t.label.toLowerCase()}s...`}
                showFilters
              />
            </TabsContent>
          ))}
        </Tabs>
      </Main>
    </>
  )
}
