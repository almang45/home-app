import {
  Construction,
  Crosshair,
  LayoutDashboard,
  Monitor,
  Bug,
  ListTodo,
  FileText,
  FileX,
  Heart,
  HelpCircle,
  Lock,
  Bell,
  Newspaper,
  Package,
  Palette,
  ServerOff,
  Settings,
  Shield,
  Bot,
  Feather,
  MoreHorizontal,
  Swords,
  Trophy,
  Wrench,
  UserCog,
  UserX,
  Users,
  MessagesSquare,
  ShieldCheck,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  Wallet,
  Gem,
  Database,
  Code2,
} from 'lucide-react'
import { ClerkLogo } from '@/assets/clerk-logo'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  teams: [
    {
      name: 'Shadcn Admin',
      logo: Command,
      plan: 'Vite + ShadcnUI',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Tasks',
          url: '/tasks',
          icon: ListTodo,
        },
        {
          title: 'Apps',
          url: '/apps',
          icon: Package,
        },
        {
          title: 'HTML Viewer',
          url: '/html-viewer',
          icon: FileText,
        },
        {
          title: 'Inventory',
          icon: Package,
          items: [
            {
              title: 'Supplies',
              url: '/inventory/supplies',
            },
            {
              title: 'Purchases',
              url: '/inventory/purchases',
            },
          ],
        },
        {
          title: 'Finance',
          url: '/finance',
          icon: Wallet,
        },
        {
          title: 'Chats',
          url: '/chats',
          badge: '3',
          icon: MessagesSquare,
        },
        {
          title: 'Users',
          url: '/users',
          icon: Users,
        },
        {
          title: 'Secured by Clerk',
          icon: ClerkLogo,
          items: [
            {
              title: 'Sign In',
              url: '/clerk/sign-in',
            },
            {
              title: 'Sign Up',
              url: '/clerk/sign-up',
            },
            {
              title: 'User Management',
              url: '/clerk/user-management',
            },
          ],
        },
      ],
    },
    {
      title: 'Games',
      items: [
        {
          title: 'Warframe Tracker',
          icon: Crosshair,
          items: [
            {
              title: 'Overview',
              url: '/warframe-tracker',
              icon: Crosshair,
            },
            {
              title: 'Mastery Tracker',
              url: '/warframe-tracker/mastery',
              icon: Trophy,
            },
            {
              title: 'News & Alerts',
              url: '/warframe-tracker/news',
              icon: Newspaper,
            },
            {
              title: 'Warframes',
              url: '/warframe-tracker/warframes',
              icon: Shield,
            },
            {
              title: 'Weapons',
              url: '/warframe-tracker/weapons',
              icon: Swords,
            },
            {
              title: 'Companions',
              url: '/warframe-tracker/companions',
              icon: Bot,
            },
            {
              title: 'Archwing',
              url: '/warframe-tracker/archwing',
              icon: Feather,
            },
            {
              title: 'Others',
              url: '/warframe-tracker/others',
              icon: MoreHorizontal,
            },
            {
              title: 'Inventory',
              url: '/warframe-tracker/resources',
              icon: Gem,
            },
            {
              title: 'Wishlist',
              url: '/warframe-tracker/wishlist',
              icon: Heart,
            },
            {
              title: 'Recipe Scraper',
              url: '/warframe-tracker/recipe-scraper',
              icon: Code2,
            },
            {
              title: 'Data Management',
              url: '/warframe-tracker/data-management',
              icon: Database,
            },
          ],
        },
      ],
    },
    {
      title: 'Pages',
      items: [
        {
          title: 'Auth',
          icon: ShieldCheck,
          items: [
            {
              title: 'Sign In',
              url: '/sign-in',
            },
            {
              title: 'Sign In (2 Col)',
              url: '/sign-in-2',
            },
            {
              title: 'Sign Up',
              url: '/sign-up',
            },
            {
              title: 'Forgot Password',
              url: '/forgot-password',
            },
            {
              title: 'OTP',
              url: '/otp',
            },
          ],
        },
        {
          title: 'Errors',
          icon: Bug,
          items: [
            {
              title: 'Unauthorized',
              url: '/errors/unauthorized',
              icon: Lock,
            },
            {
              title: 'Forbidden',
              url: '/errors/forbidden',
              icon: UserX,
            },
            {
              title: 'Not Found',
              url: '/errors/not-found',
              icon: FileX,
            },
            {
              title: 'Internal Server Error',
              url: '/errors/internal-server-error',
              icon: ServerOff,
            },
            {
              title: 'Maintenance Error',
              url: '/errors/maintenance-error',
              icon: Construction,
            },
          ],
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'Profile',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: 'Account',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Display',
              url: '/settings/display',
              icon: Monitor,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
