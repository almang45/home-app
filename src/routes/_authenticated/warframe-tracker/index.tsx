import { createFileRoute } from '@tanstack/react-router'
import { WarframeTrackerOverview } from '@/features/warframe-tracker'

export const Route = createFileRoute('/_authenticated/warframe-tracker/')({
  component: WarframeTrackerOverview,
})
