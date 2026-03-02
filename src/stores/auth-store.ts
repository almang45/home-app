import { create } from 'zustand'
import pb from '@/lib/pocketbase'
import { AuthModel } from 'pocketbase'

interface AuthState {
  user: AuthModel | null
  setUser: (user: AuthModel | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize state from PocketBase instance
  const initialUser = pb.authStore.model

  // globally disable auto cancellation
  pb.autoCancellation(false);

  // Subscribe to auth state changes
  pb.authStore.onChange((_token, model) => {
    set({ user: model })
  })

  return {
    user: initialUser,
    setUser: (user) => set({ user }),
    logout: () => {
      pb.authStore.clear()
      set({ user: null })
    },
  }
})
