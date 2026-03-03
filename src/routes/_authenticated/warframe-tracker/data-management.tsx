import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { DataManagementPage } from '@/features/warframe-tracker/components/data-management-page'

export const Route = createFileRoute(
  '/_authenticated/warframe-tracker/data-management'
)({
  component: DataManagementRoute,
})

function DataManagementRoute() {
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
        <DataManagementPage />
      </Main>
    </>
  )
}
