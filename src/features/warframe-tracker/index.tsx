import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  Bot,
  Crosshair,
  Feather,
  Gem,
  Heart,
  MoreHorizontal,
  Package,
  Shield,
  Swords,
  Trophy,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  useWarframes,
  useOwnedItems,
  useMasteredItems,
  useWishlistItems,
  useWeapons,
  useArchwings,
  useCompanions,
  useOthers,
} from './data/queries'

export function WarframeTrackerOverview() {
  const {
    data: warframes,
    isError: warframesError,
    error: warframesErrorMsg,
  } = useWarframes()
  const { data: weapons } = useWeapons()
  const { data: archwings } = useArchwings()
  const { data: companions } = useCompanions()
  const { data: others } = useOthers()
  const { data: owned } = useOwnedItems()
  const { data: mastered } = useMasteredItems()
  const { data: wishlist } = useWishlistItems()

  const ownedWarframes =
    owned?.filter((i) => i.category === 'Warframes').length ?? 0
  const ownedWeapons =
    owned?.filter((i) =>
      ['Primary', 'Secondary', 'Melee', 'Arch-Gun', 'Arch-Melee'].includes(
        i.category
      )
    ).length ?? 0
  const ownedCompanions =
    owned?.filter((i) => i.category === 'Sentinels' || i.category === 'Pets')
      .length ?? 0
  const ownedArchwings =
    owned?.filter((i) => i.category === 'Archwing').length ?? 0
  const ownedOthers =
    owned?.filter((i) => i.category === 'Misc').length ?? 0

  const stats = [
    {
      title: 'Warframes',
      value: warframes?.length ?? '...',
      sub: `${ownedWarframes} owned`,
      icon: Shield,
      href: '/warframe-tracker/warframes',
    },
    {
      title: 'Weapons',
      value: weapons?.length ?? '...',
      sub: `${ownedWeapons} owned`,
      icon: Swords,
      href: '/warframe-tracker/weapons',
    },
    {
      title: 'Companions',
      value: companions?.length ?? '...',
      sub: `${ownedCompanions} owned`,
      icon: Bot,
      href: '/warframe-tracker/companions',
    },
    {
      title: 'Archwing',
      value: archwings?.length ?? '...',
      sub: `${ownedArchwings} owned`,
      icon: Feather,
      href: '/warframe-tracker/archwing',
    },
    {
      title: 'Others',
      value: others?.length ?? '...',
      sub: `${ownedOthers} owned`,
      icon: MoreHorizontal,
      href: '/warframe-tracker/others',
    },
    {
      title: 'Owned Items',
      value: owned?.length ?? 0,
      sub: 'across all categories',
      icon: Package,
      href: '/warframe-tracker/warframes',
    },
    {
      title: 'Mastered',
      value: mastered?.length ?? 0,
      sub: 'items mastered',
      icon: Trophy,
      href: '/warframe-tracker/mastery',
    },
    {
      title: 'Wishlist',
      value: wishlist?.length ?? 0,
      sub: 'items to build',
      icon: Heart,
      href: '/warframe-tracker/wishlist',
    },
    {
      title: 'Inventory',
      value: '—',
      sub: 'resources tracked',
      icon: Gem,
      href: '/warframe-tracker/resources',
    },
  ]

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
            Warframe Tracker
          </h2>
          <p className='text-muted-foreground'>
            Track your warframes, weapons, resources, and build plans.
          </p>
        </div>

        {warframesError && (
          <Alert variant='destructive' className='mb-6'>
            <AlertTriangle className='size-4' />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              {warframesErrorMsg instanceof Error
                ? warframesErrorMsg.message
                : 'Unable to load Warframe data. Please check your internet connection.'}
            </AlertDescription>
          </Alert>
        )}

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-9'>
          {stats.map((stat) => (
            <Link key={stat.title} to={stat.href}>
              <Card className='transition-all hover:shadow-md'>
                <CardHeader className='flex flex-row items-center justify-between pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    {stat.title}
                  </CardTitle>
                  <stat.icon className='text-muted-foreground size-4' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{stat.value}</div>
                  <p className='text-muted-foreground text-xs'>{stat.sub}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className='bg-muted/50 mt-8 rounded-lg border p-6 text-center'>
          <Crosshair className='text-muted-foreground mx-auto mb-3 size-10' />
          <h3 className='text-lg font-semibold'>Welcome, Tenno</h3>
          <p className='text-muted-foreground mt-1 text-sm'>
            Browse warframes and weapons, mark what you own, and plan your next
            builds. Check the News &amp; Alerts page for the latest game
            updates.
          </p>
        </div>
      </Main>
    </>
  )
}
