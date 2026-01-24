import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserMode = 'personal' | 'business'

interface UserModeState {
  mode: UserMode
  setMode: (mode: UserMode) => void
}

export const useUserMode = create<UserModeState>()(
  persist(
    (set) => ({
      mode: 'personal',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'calmar-user-mode',
    }
  )
)
