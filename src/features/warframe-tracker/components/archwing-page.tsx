import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useArchwings } from '../data/queries'
import { ItemsGrid } from './items-grid'

export function ArchwingPage() {
  const { data, isLoading } = useArchwings()

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
          <h2 className='text-2xl font-bold tracking-tight'>Archwing</h2>
          <p className='text-muted-foreground'>
            Browse all archwings. Track which archwings you own and have
            mastered.
          </p>
        </div>

        <ItemsGrid
          items={data}
          isLoading={isLoading}
          searchPlaceholder='Search archwings...'
          showFilters
        />
      </Main>
    </>
  )
}
