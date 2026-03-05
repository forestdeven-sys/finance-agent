'use client'

import { useAppStore } from '@/lib/store'
import { Sidebar } from '@/components/layout/Sidebar'
import { ChatPanel } from '@/components/layout/ChatPanel'
import { TradingDashboard } from '@/components/defai/TradingDashboard'
import { AgentPanel } from '@/components/defai/AgentPanel'
import { SettingsModal } from '@/components/settings/SettingsModal'

const TAB_TITLES: Record<string, string> = {
  trading: 'DeFAI Trading Simulator',
  agents: 'AI Trading Agents',
  performance: 'Performance Analytics',
}

function PerformancePlaceholder() {
  return (
    <div className="flex items-center justify-center h-64 text-gray-500">
      <div className="text-center">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-sm">Performance analytics coming soon</p>
        <p className="text-xs mt-1">Run simulations to generate performance data</p>
      </div>
    </div>
  )
}

export default function DefaiPage() {
  const { activeDefaiTab, setActiveSection } = useAppStore()

  if (typeof window !== 'undefined') {
    setActiveSection('defai')
  }

  const renderContent = () => {
    switch (activeDefaiTab) {
      case 'trading': return <TradingDashboard />
      case 'agents': return <AgentPanel />
      case 'performance': return <PerformancePlaceholder />
      default: return <TradingDashboard />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-100">
              {TAB_TITLES[activeDefaiTab] || 'DeFAI'}
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Decentralized Finance + AI · Simulated Environment
            </p>
          </div>
          {renderContent()}
        </div>
      </main>
      <ChatPanel section="defai" />
      <SettingsModal />
    </div>
  )
}
