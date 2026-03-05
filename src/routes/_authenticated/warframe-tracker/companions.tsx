import { createFileRoute } from '@tanstack/react-router'
import { CompanionsPage } from '@/features/warframe-tracker/components/companions-page'

export const Route = createFileRoute(
  '/_authenticated/warframe-tracker/companions'
)({
  component: CompanionsPage,
})
