import { create } from 'zustand'
import pb from '@/lib/pocketbase'
import type { AuthModel } from 'pocketbase'
import { DEV_MOCK_USER, seedDevData } from '@/lib/dev-mock'

interface AuthState {
  user: AuthModel | null
  setUser: (user: AuthModel | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => {
  // In dev mode: bypass PocketBase, use mock user and seed localStorage data
  if (import.meta.env.DEV) {
    seedDevData()
    return {
      user: DEV_MOCK_USER,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }
  }

  // Production: initialize from PocketBase auth state
  pb.autoCancellation(false)
  pb.authStore.onChange((_token, model) => {
    set({ user: model })
  })

  return {
    user: pb.authStore.model,
    setUser: (user) => set({ user }),
    logout: () => {
      pb.authStore.clear()
      set({ user: null })
    },
  }
})
