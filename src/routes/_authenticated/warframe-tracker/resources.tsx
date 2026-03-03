import { createFileRoute } from '@tanstack/react-router'
import { ResourcesPage } from '@/features/warframe-tracker/components/resources-page'

export const Route = createFileRoute(
  '/_authenticated/warframe-tracker/resources'
)({
  component: ResourcesPage,
})
