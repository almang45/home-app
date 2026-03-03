import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import pb from '@/lib/pocketbase'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    // In dev mode skip auth — mock user is injected via auth-store
    if (import.meta.env.DEV) return

    if (!pb.authStore.isValid) {
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: AuthenticatedLayout,
})
