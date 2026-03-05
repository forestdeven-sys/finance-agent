'use client'

import { useAppStore } from '@/lib/store'
import { Sidebar } from '@/components/layout/Sidebar'
import { ChatPanel } from '@/components/layout/ChatPanel'
import { Dashboard } from '@/components/personal/Dashboard'
import { Transactions } from '@/components/personal/Transactions'
import { ImportData } from '@/components/personal/ImportData'
import { BudgetPlanner } from '@/components/personal/BudgetPlanner'
import { SubscriptionTracker } from '@/components/personal/SubscriptionTracker'
import { SettingsModal } from '@/components/settings/SettingsModal'

const TAB_TITLES: Record<string, string> = {
  dashboard: 'Financial Dashboard',
  transactions: 'Transaction History',
  import: 'Import Data',
  budget: 'Budget Planner',
  subscriptions: 'Subscription Tracker',
}

export default function PersonalPage() {
  const { activePersonalTab, setActiveSection } = useAppStore()

  // Ensure section is set
  if (typeof window !== 'undefined') {
    setActiveSection('personal')
  }

  const renderContent = () => {
    switch (activePersonalTab) {
      case 'dashboard': return <Dashboard />
      case 'transactions': return <Transactions />
      case 'import': return <ImportData />
      case 'budget': return <BudgetPlanner />
      case 'subscriptions': return <SubscriptionTracker />
      default: return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-100">
              {TAB_TITLES[activePersonalTab] || 'Personal Finance'}
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {renderContent()}
        </div>
      </main>
      <ChatPanel section="personal" />
      <SettingsModal />
    </div>
  )
}
