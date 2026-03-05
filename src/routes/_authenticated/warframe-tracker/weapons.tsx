import { createFileRoute } from '@tanstack/react-router'
import { WeaponsPage } from '@/features/warframe-tracker/components/weapons-page'

export const Route = createFileRoute(
  '/_authenticated/warframe-tracker/weapons'
)({
  component: WeaponsPage,
})
