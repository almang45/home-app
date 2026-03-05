import { createFileRoute } from '@tanstack/react-router'
import { NewsPage } from '@/features/warframe-tracker/components/news-page'

export const Route = createFileRoute('/_authenticated/warframe-tracker/news')({
  component: NewsPage,
})
