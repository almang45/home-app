import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  useCompanions,
  useSentinelBodies,
  useCompanionWeapons,
  usePets,
} from '../data/queries'
import { ItemsGrid } from './items-grid'

type CompanionTab = 'all' | 'sentinels' | 'sentinel-weapons' | 'pets'

const TABS: { value: CompanionTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'sentinels', label: 'Sentinels' },
  { value: 'sentinel-weapons', label: 'Sentinel Weapons' },
  { value: 'pets', label: 'Pets' },
]

export function CompanionsPage() {
  const [tab, setTab] = useState<string>('all')

  const { data: all, isLoading } = useCompanions()
  const { data: sentinels } = useSentinelBodies()
  const { data: sentinelWeapons } = useCompanionWeapons()
  const { data: pets } = usePets()

  const dataByTab: Record<CompanionTab, typeof all> = {
    all,
    sentinels,
    'sentinel-weapons': sentinelWeapons,
    pets,
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
          <h2 className='text-2xl font-bold tracking-tight'>Companions</h2>
          <p className='text-muted-foreground'>
            Sentinels, sentinel weapons, Kubrows, Kavats, MOAs, Hounds and more.
            Track what you own and have mastered.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className='space-y-4'>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                {all && (
                  <span className='text-muted-foreground ml-1.5 text-xs'>
                    ({dataByTab[t.value as CompanionTab]?.length ?? 0})
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((t) => (
            <TabsContent key={t.value} value={t.value}>
              <ItemsGrid
                items={dataByTab[t.value as CompanionTab]}
                isLoading={isLoading}
                searchPlaceholder={`Search ${t.label.toLowerCase()}...`}
                showFilters
              />
            </TabsContent>
          ))}
        </Tabs>
      </Main>
    </>
  )
}
