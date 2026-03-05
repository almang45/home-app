import { createFileRoute } from '@tanstack/react-router'
import { WarframesPage } from '@/features/warframe-tracker/components/warframes-page'

export const Route = createFileRoute(
  '/_authenticated/warframe-tracker/warframes'
)({
  component: WarframesPage,
})
