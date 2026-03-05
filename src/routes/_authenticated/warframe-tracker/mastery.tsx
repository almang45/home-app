import { createFileRoute } from '@tanstack/react-router'
import { MasteryPage } from '@/features/warframe-tracker/components/mastery-page'

export const Route = createFileRoute('/_authenticated/warframe-tracker/mastery')({
  component: MasteryPage,
})
