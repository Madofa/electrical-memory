import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Instalador } from '../types'

interface AuthStore {
  user: User | null
  instalador: Instalador | null
  loading: boolean
  setUser: (user: User | null) => void
  setInstalador: (i: Instalador | null) => void
  setLoading: (v: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  instalador: null,
  loading: true,
  setUser: (user) => set({ user }),
  setInstalador: (instalador) => set({ instalador }),
  setLoading: (loading) => set({ loading }),
  logout: () => set({ user: null, instalador: null }),
}))
