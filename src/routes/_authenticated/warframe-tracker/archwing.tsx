import { createFileRoute } from '@tanstack/react-router'
import { ArchwingPage } from '@/features/warframe-tracker/components/archwing-page'

export const Route = createFileRoute('/_authenticated/warframe-tracker/archwing')({
  component: ArchwingPage,
})
