import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { trackerStorage } from '@/lib/tracker-storage'
import type {
  OwnedItem,
  MasteredItem,
  WishlistItem,
  ResourceEntry,
} from './types'

const DEFAULT_USER_ID = 'local-user'

export function useToggleOwned() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      uniqueName,
      itemName,
      category,
      isOwned,
    }: {
      uniqueName: string
      itemName: string
      category: string
      isOwned: boolean
    }) => {
      if (isOwned) {
        await trackerStorage.removeOwnedItem(DEFAULT_USER_ID, uniqueName)
      } else {
        const item: OwnedItem = {
          userId: DEFAULT_USER_ID,
          uniqueName,
          itemName,
          category,
          ownedAt: new Date().toISOString(),
        }
        await trackerStorage.addOwnedItem(item)
      }
    },
    onSuccess: (_, { itemName, isOwned }) => {
      queryClient.invalidateQueries({ queryKey: ['tracker', 'owned'] })
      toast.success(
        isOwned
          ? `Removed ${itemName} from owned`
          : `Marked ${itemName} as owned`
      )
    },
  })
}

export function useToggleMastered() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      uniqueName,
      itemName,
      category,
      isMastered,
    }: {
      uniqueName: string
      itemName: string
      category: string
      isMastered: boolean
    }) => {
      if (isMastered) {
        await trackerStorage.removeMasteredItem(DEFAULT_USER_ID, uniqueName)
      } else {
        const item: MasteredItem = {
          userId: DEFAULT_USER_ID,
          uniqueName,
          itemName,
          category,
          masteredAt: new Date().toISOString(),
        }
        await trackerStorage.addMasteredItem(item)
      }
    },
    onSuccess: (_, { itemName, isMastered }) => {
      queryClient.invalidateQueries({ queryKey: ['tracker', 'mastered'] })
      toast.success(
        isMastered
          ? `Removed ${itemName} from mastered`
          : `Marked ${itemName} as mastered`
      )
    },
  })
}

export function useToggleWishlist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      uniqueName,
      itemName,
      category,
      isInWishlist,
    }: {
      uniqueName: string
      itemName: string
      category: string
      isInWishlist: boolean
    }) => {
      if (isInWishlist) {
        await trackerStorage.removeWishlistItem(DEFAULT_USER_ID, uniqueName)
      } else {
        const item: WishlistItem = {
          userId: DEFAULT_USER_ID,
          uniqueName,
          itemName,
          category,
          priority: 2,
          addedAt: new Date().toISOString(),
        }
        await trackerStorage.addWishlistItem(item)
      }
    },
    onSuccess: (_, { itemName, isInWishlist }) => {
      queryClient.invalidateQueries({ queryKey: ['tracker', 'wishlist'] })
      toast.success(
        isInWishlist
          ? `Removed ${itemName} from wishlist`
          : `Added ${itemName} to wishlist`
      )
    },
  })
}

export function useUpdateResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entry: Omit<ResourceEntry, 'userId'>) => {
      await trackerStorage.updateResource({
        ...entry,
        userId: DEFAULT_USER_ID,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracker', 'resources'] })
    },
  })
}
