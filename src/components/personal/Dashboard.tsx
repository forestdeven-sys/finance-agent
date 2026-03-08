'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import {
  TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight,
  Activity, Target
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: string
  category: string
}

interface MonthlyData {
  month: string
  income: number
  expenses: number
  net: number
}

interface CategoryData {
  name: string
  value: number
  count: number
}

const CATEGORY_COLORS = [
  '#00e5ff', '#00ff88', '#ff4757', '#ffa502', '#a29bfe',
  '#fd79a8', '#00cec9', '#6c5ce7', '#fdcb6e', '#e17055'
]

export function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    savingsRate: 0,
    transactionCount: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/transactions?limit=500')
      const data = await res.json()
      const txns: Transaction[] = data.transactions || []
      setTransactions(txns)
      processData(txns)
    } catch (err) {
      console.error('Failed to load transactions', err)
    } finally {
      setLoading(false)
    }
  }

  const processData = (txns: Transaction[]) => {
    const income = txns.filter((t) => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0)
    const expenses = txns.filter((t) => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0)
    const net = income - expenses
    const savingsRate = income > 0 ? (net / income) * 100 : 0

    setStats({ totalIncome: income, totalExpenses: expenses, netSavings: net, savingsRate, transactionCount: txns.length })

    // Monthly data - last 6 months
    const monthlyMap: Record<string, { income: number; expenses: number }> = {}
    txns.forEach((t) => {
      const date = new Date(t.date)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyMap[key]) monthlyMap[key] = { income: 0, expenses: 0 }
      if (t.type === 'credit') monthlyMap[key].income += t.amount
      else monthlyMap[key].expenses += t.amount
    })

    const monthly = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
        income: Math.round(data.income),
        expenses: Math.round(data.expenses),
        net: Math.round(data.income - data.expenses),
      }))
    setMonthlyData(monthly)

    // Category breakdown (expenses only)
    const categoryMap: Record<string, { value: number; count: number }> = {}
    txns.filter((t) => t.type === 'debit').forEach((t) => {
      if (!categoryMap[t.category]) categoryMap[t.category] = { value: 0, count: 0 }
      categoryMap[t.category].value += t.amount
      categoryMap[t.category].count++
    })

    const categories = Object.entries(categoryMap)
      .sort(([, a], [, b]) => b.value - a.value)
      .slice(0, 8)
      .map(([name, data]) => ({ name, value: Math.round(data.value), count: data.count }))
    setCategoryData(categories)
  }

  const statCards = [
    {
      label: 'Total Income',
      value: formatCurrency(stats.totalIncome),
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-500/10 border-green-500/20',
      trend: null,
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(stats.totalExpenses),
      icon: TrendingDown,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
      trend: null,
    },
    {
      label: 'Net Savings',
      value: formatCurrency(Math.abs(stats.netSavings)),
      icon: DollarSign,
      color: stats.netSavings >= 0 ? 'text-cyan-400' : 'text-red-400',
      bg: stats.netSavings >= 0 ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-red-500/10 border-red-500/20',
      trend: stats.netSavings >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />,
    },
    {
      label: 'Savings Rate',
      value: `${stats.savingsRate.toFixed(1)}%`,
      icon: Target,
      color: stats.savingsRate >= 20 ? 'text-green-400' : stats.savingsRate >= 10 ? 'text-yellow-400' : 'text-red-400',
      bg: 'bg-white/5 border-white/10',
      trend: null,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 text-cyan-400 animate-pulse" />
          <span className="text-sm text-gray-500">Loading financial data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, trend }) => (
          <div key={label} className={`rounded-xl p-4 border ${bg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className={`text-xl font-bold ${color} flex items-center gap-1`}>
              {value}
              {trend && <span className={color}>{trend}</span>}
            </div>
            {label === 'Savings Rate' && (
              <div className="mt-2">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${stats.savingsRate >= 20 ? 'bg-green-400' : stats.savingsRate >= 10 ? 'bg-yellow-400' : 'bg-red-400'}`}
                    style={{ width: `${Math.min(100, Math.max(0, stats.savingsRate))}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">Target: 20%</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Income vs Expenses Chart */}
        <div className="lg:col-span-2">
          <Card title="Income vs Expenses" subtitle="Last 6 months">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff88" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff4757" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ff4757" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: '#0d0d14', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 8, fontSize: 11 }}
                    formatter={(value: unknown) => [typeof value === 'number' ? formatCurrency(value) : String(value ?? ''), '']}
                  />
                  <Area type="monotone" dataKey="income" stroke="#00ff88" fill="url(#colorIncome)" strokeWidth={2} name="Income" />
                  <Area type="monotone" dataKey="expenses" stroke="#ff4757" fill="url(#colorExpenses)" strokeWidth={2} name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
                No transaction data yet. Import or add transactions.
              </div>
            )}
          </Card>
        </div>

        {/* Category Pie */}
        <Card title="Spending by Category">
          {categoryData.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0d0d14', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 8, fontSize: 11 }}
                    formatter={(value: unknown) => [typeof value === 'number' ? formatCurrency(value) : String(value ?? ''), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {categoryData.slice(0, 4).map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[i] }} />
                      <span className="text-xs text-gray-400 truncate max-w-20">{cat.name}</span>
                    </div>
                    <span className="text-xs text-gray-300">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No data</div>
          )}
        </Card>
      </div>

      {/* Net Savings Bar Chart */}
      {monthlyData.length > 0 && (
        <Card title="Monthly Net Savings">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#0d0d14', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 8, fontSize: 11 }}
                formatter={(value: unknown) => [typeof value === 'number' ? formatCurrency(value) : String(value ?? ''), 'Net']}
              />
              <Bar dataKey="net" radius={[4, 4, 0, 0]}>
                {monthlyData.map((entry, index) => (
                  <Cell key={index} fill={entry.net >= 0 ? '#00ff88' : '#ff4757'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card title="Recent Transactions" subtitle={`${stats.transactionCount} total`}>
        {transactions.length > 0 ? (
          <div className="space-y-1">
            {transactions.slice(0, 8).map((txn) => (
              <div key={txn.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs">{txn.category.charAt(0)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-gray-300 truncate">{txn.description}</div>
                    <div className="text-xs text-gray-600">{txn.category} · {formatDateShort(txn.date)}</div>
                  </div>
                </div>
                <span className={`text-xs font-medium ml-2 flex-shrink-0 ${txn.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                  {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            <p className="text-sm">No transactions yet.</p>
            <p className="text-xs mt-1">Import a CSV or add transactions manually.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
