'use client'

import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Upload,
  PieChart,
  CreditCard,
  Bot,
  TrendingUp,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  MessageSquare,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const personalTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'import', label: 'Import Data', icon: Upload },
  { id: 'budget', label: 'Budget Planner', icon: PieChart },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
]

const defaiTabs = [
  { id: 'trading', label: 'Trading Dashboard', icon: TrendingUp },
  { id: 'agents', label: 'AI Agents', icon: Bot },
  { id: 'performance', label: 'Performance', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const {
    activeSection,
    activePersonalTab,
    activeDefaiTab,
    sidebarCollapsed,
    setSidebarCollapsed,
    setActivePersonalTab,
    setActiveDefaiTab,
    setSettingsOpen,
    chatPanelOpen,
    setChatPanelOpen,
  } = useAppStore()

  const isPersonal = pathname?.startsWith('/personal') || activeSection === 'personal'
  const tabs = isPersonal ? personalTabs : defaiTabs
  const activeTab = isPersonal ? activePersonalTab : activeDefaiTab
  const setActiveTab = isPersonal ? setActivePersonalTab : setActiveDefaiTab

  return (
    <aside
      className={cn(
        'flex flex-col h-screen sticky top-0 glass border-r border-cyan-500/10 transition-all duration-300 z-40',
        sidebarCollapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 p-4 border-b border-cyan-500/10', sidebarCollapsed && 'justify-center')}>
        <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-cyan-500/30">
          <Zap className="w-4 h-4 text-cyan-400" />
        </div>
        {!sidebarCollapsed && (
          <div>
            <div className="text-sm font-bold text-cyan-400">AXIOM</div>
            <div className="text-xs text-gray-600">Finance v2.0</div>
          </div>
        )}
      </div>

      {/* Section Toggle */}
      <div className={cn('p-3 border-b border-cyan-500/10', sidebarCollapsed && 'px-2')}>
        {sidebarCollapsed ? (
          <div className="flex flex-col gap-2">
            <Link
              href="/personal"
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center text-xs transition-colors',
                isPersonal
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              )}
              title="Personal Finance"
            >
              <PieChart className="w-4 h-4" />
            </Link>
            <Link
              href="/defai"
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center text-xs transition-colors',
                !isPersonal
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              )}
              title="DeFAI Trading"
            >
              <TrendingUp className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            <Link
              href="/personal"
              className={cn(
                'px-2 py-1.5 rounded-lg text-xs text-center font-medium transition-colors',
                isPersonal
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              )}
            >
              Personal
            </Link>
            <Link
              href="/defai"
              className={cn(
                'px-2 py-1.5 rounded-lg text-xs text-center font-medium transition-colors',
                !isPersonal
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              )}
            >
              DeFAI
            </Link>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'w-full flex items-center gap-3 rounded-lg transition-all',
              sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
              activeTab === id
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            )}
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-xs font-medium">{label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-2 border-t border-cyan-500/10 space-y-1">
        {/* Chat Toggle */}
        <button
          onClick={() => setChatPanelOpen(!chatPanelOpen)}
          className={cn(
            'w-full flex items-center gap-3 rounded-lg transition-all',
            sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
            chatPanelOpen
              ? 'bg-cyan-500/10 text-cyan-400'
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
          )}
          title={sidebarCollapsed ? 'AI Chat' : undefined}
        >
          <MessageSquare className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span className="text-xs font-medium">AI Chat</span>}
        </button>

        {/* Settings */}
        <button
          onClick={() => setSettingsOpen(true)}
          className={cn(
            'w-full flex items-center gap-3 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all',
            sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
          )}
          title={sidebarCollapsed ? 'Settings' : undefined}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span className="text-xs font-medium">Settings</span>}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            'w-full flex items-center gap-3 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-all',
            sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
