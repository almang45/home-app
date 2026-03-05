import { createFileRoute } from '@tanstack/react-router'
import { OthersPage } from '@/features/warframe-tracker/components/others-page'

export const Route = createFileRoute('/_authenticated/warframe-tracker/others')({
  component: OthersPage,
})
