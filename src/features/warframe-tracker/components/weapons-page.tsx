import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useWeapons } from '../data/queries'
import type { WarframeItem } from '../data/types'
import { ItemsGrid } from './items-grid'

const WEAPON_TABS = [
  { value: 'all', label: 'All' },
  { value: 'Primary', label: 'Primary' },
  { value: 'Secondary', label: 'Secondary' },
  { value: 'Melee', label: 'Melee' },
  { value: 'Arch-Gun', label: 'Arch-Gun' },
  { value: 'Arch-Melee', label: 'Arch-Melee' },
] as const

type WeaponTabValue = (typeof WEAPON_TABS)[number]['value']

function filterByTab(
  all: WarframeItem[] | undefined,
  tab: WeaponTabValue
): WarframeItem[] | undefined {
  if (tab === 'all') return all
  return all?.filter((i) => i.category === tab)
}

export function WeaponsPage() {
  const [tab, setTab] = useState<WeaponTabValue>('all')
  const { data: all, isLoading } = useWeapons()

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
          <h2 className='text-2xl font-bold tracking-tight'>Weapons</h2>
          <p className='text-muted-foreground'>
            Browse all weapons by category. Track your arsenal.
          </p>
        </div>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as WeaponTabValue)}
          className='space-y-4'
        >
          <TabsList>
            {WEAPON_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                {all && (
                  <span className='text-muted-foreground ml-1.5 text-xs'>
                    ({filterByTab(all, t.value)?.length ?? 0})
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {WEAPON_TABS.map((t) => (
            <TabsContent key={t.value} value={t.value}>
              <ItemsGrid
                items={filterByTab(all, t.value)}
                isLoading={isLoading}
                searchPlaceholder={`Search ${t.label.toLowerCase()} weapons...`}
                showFilters
              />
            </TabsContent>
          ))}
        </Tabs>
      </Main>
    </>
  )
}
