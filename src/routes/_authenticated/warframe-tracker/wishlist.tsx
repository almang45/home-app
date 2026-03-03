import { createFileRoute } from '@tanstack/react-router'
import { WishlistPage } from '@/features/warframe-tracker/components/wishlist-page'

export const Route = createFileRoute(
  '/_authenticated/warframe-tracker/wishlist'
)({
  component: WishlistPage,
})
