import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  activeSection: 'personal' | 'defai'
  activePersonalTab: string
  activeDefaiTab: string
  sidebarCollapsed: boolean
  chatPanelOpen: boolean
  settingsOpen: boolean
  currentChatSessionId: string | null

  setActiveSection: (section: 'personal' | 'defai') => void
  setActivePersonalTab: (tab: string) => void
  setActiveDefaiTab: (tab: string) => void
  setSidebarCollapsed: (v: boolean) => void
  setChatPanelOpen: (v: boolean) => void
  setSettingsOpen: (v: boolean) => void
  setCurrentChatSessionId: (id: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeSection: 'personal',
      activePersonalTab: 'dashboard',
      activeDefaiTab: 'trading',
      sidebarCollapsed: false,
      chatPanelOpen: true,
      settingsOpen: false,
      currentChatSessionId: null,

      setActiveSection: (activeSection) => set({ activeSection }),
      setActivePersonalTab: (activePersonalTab) => set({ activePersonalTab }),
      setActiveDefaiTab: (activeDefaiTab) => set({ activeDefaiTab }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setChatPanelOpen: (chatPanelOpen) => set({ chatPanelOpen }),
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
      setCurrentChatSessionId: (currentChatSessionId) => set({ currentChatSessionId }),
    }),
    { name: 'axiom-finance-store' }
  )
)
