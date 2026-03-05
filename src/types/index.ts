export interface Transaction {
  id: string
  date: string | Date
  description: string
  amount: number
  type: 'debit' | 'credit'
  category: string
  merchant?: string | null
  tags: string[]
  notes?: string | null
  source: string
  importId?: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

export interface Category {
  id: string
  name: string
  color: string
  icon?: string | null
  budget?: number | null
  createdAt: string | Date
}

export interface Budget {
  id: string
  category: string
  amount: number
  month: string
  spent: number
  createdAt: string | Date
  updatedAt: string | Date
}

export interface Subscription {
  id: string
  name: string
  amount: number
  frequency: 'monthly' | 'yearly' | 'weekly' | 'quarterly'
  nextBilling?: string | Date | null
  category: string
  isActive: boolean
  createdAt: string | Date
  updatedAt: string | Date
}

export interface Settings {
  id: string
  openrouterApiKey?: string | null
  primaryModel: string
  reasoningModel: string
  documentModel: string
  currency: string
  themeColor: string
  themeBackground: string
  themeMode: string
  sidebarPosition: string
  chatPanelPosition: string
  chatPanelWidth: number
}

export interface ChatSession {
  id: string
  title: string
  section: string
  messages: ChatMessage[]
  createdAt: string | Date
  updatedAt: string | Date
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  model?: string | null
  createdAt: string | Date
}

export interface TradingAgent {
  id: string
  name: string
  type: string
  model: string
  systemPrompt: string
  isActive: boolean
  config: Record<string, unknown>
  createdAt: string | Date
  updatedAt: string | Date
}

export interface Trade {
  id: string
  pair: string
  side: 'buy' | 'sell'
  entryPrice: number
  exitPrice?: number | null
  amount: number
  profit?: number | null
  status: 'open' | 'closed' | 'cancelled'
  strategy?: string | null
  agentId?: string | null
  simulationId?: string | null
  createdAt: string | Date
  closedAt?: string | Date | null
}

export interface Simulation {
  id: string
  name: string
  status: 'idle' | 'running' | 'completed' | 'stopped'
  startBalance: number
  balance: number
  totalTrades: number
  winRate: number
  pnl: number
  duration: number
  strategy: string
  pairs: string[]
  goal?: string | null
  targetProfit?: number | null
  maxLoss?: number | null
  config: Record<string, unknown>
  startedAt?: string | Date | null
  endedAt?: string | Date | null
  createdAt: string | Date
  updatedAt: string | Date
}

export interface DashboardStats {
  totalIncome: number
  totalExpenses: number
  netSavings: number
  transactionCount: number
  topCategories: { category: string; amount: number; count: number }[]
  monthlyTrend: { month: string; income: number; expenses: number }[]
  recentTransactions: Transaction[]
}
