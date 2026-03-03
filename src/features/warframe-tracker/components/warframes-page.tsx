import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useWarframes } from '../data/queries'
import { ItemsGrid } from './items-grid'

export function WarframesPage() {
  const { data, isLoading } = useWarframes()

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
            Browse all warframes. Mark what you own and add to your wishlist.
          </p>
        </div>

        <ItemsGrid
          items={data}
          isLoading={isLoading}
          searchPlaceholder='Search warframes...'
          showFilters
        />
      </Main>
    </>
  )
}
