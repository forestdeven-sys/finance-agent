'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, Trash2, TrendingUp, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface BudgetItem {
  id: string
  category: string
  amount: number
  spent: number
  month: string
}

interface Transaction {
  category: string
  amount: number
  type: string
  date: string
}

const CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Entertainment', 'Health',
  'Utilities', 'Subscriptions', 'Housing', 'Personal', 'Savings'
]

const getCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function BudgetPlanner() {
  const [budgets, setBudgets] = useState<BudgetItem[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(getCurrentMonth())
  const [addingNew, setAddingNew] = useState(false)
  const [newCategory, setNewCategory] = useState(CATEGORIES[0])
  const [newAmount, setNewAmount] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [year, mon] = month.split('-')
      const startDate = `${year}-${mon}-01`
      const endDate = `${year}-${mon}-31`
      const [txRes, budgetRes] = await Promise.all([
        fetch(`/api/transactions?limit=1000&startDate=${startDate}&endDate=${endDate}&type=debit`),
        fetch(`/api/budgets?month=${month}`),
      ])
      const txData = await txRes.json()
      const budgetData = await budgetRes.json()
      setTransactions(txData.transactions || [])
      setBudgets(budgetData.budgets || [])
    } catch (err) {
      console.error('Failed to load budget data', err)
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => {
    loadData()
  }, [month, loadData])

  // Calculate spent amounts from transactions
  const getBudgetWithSpent = (budget: BudgetItem) => {
    const spent = transactions
      .filter((t) => t.category === budget.category)
      .reduce((sum, t) => sum + t.amount, 0)
    return { ...budget, spent }
  }

  const addBudget = async () => {
    if (!newAmount || parseFloat(newAmount) <= 0) return
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory, amount: parseFloat(newAmount), month }),
      })
      const created = await res.json()
      setBudgets((prev) => [...prev, created])
      setNewAmount('')
      setAddingNew(false)
    } catch (err) {
      console.error('Failed to add budget', err)
    }
  }

  const deleteBudget = async (id: string) => {
    try {
      await fetch(`/api/budgets/${id}`, { method: 'DELETE' })
      setBudgets((prev) => prev.filter((b) => b.id !== id))
    } catch (err) {
      console.error('Failed to delete budget', err)
    }
  }

  const budgetsWithSpent = budgets.map(getBudgetWithSpent)
  const totalBudgeted = budgetsWithSpent.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgetsWithSpent.reduce((sum, b) => sum + b.spent, 0)
  const totalRemaining = totalBudgeted - totalSpent

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-cyan-400">Budget Planner</h2>
          <p className="text-sm text-gray-500 mt-1">Set and track monthly spending limits</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg text-xs text-gray-300 px-3 py-2 focus:outline-none focus:border-cyan-500/50"
          />
          <Button variant="primary" size="sm" onClick={() => setAddingNew(true)}>
            <Plus className="w-3 h-3" /> Add Budget
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 border border-white/10">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Budgeted</div>
          <div className="text-xl font-bold text-cyan-400">{formatCurrency(totalBudgeted)}</div>
        </div>
        <div className="glass rounded-xl p-4 border border-white/10">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Spent</div>
          <div className={`text-xl font-bold ${totalSpent > totalBudgeted ? 'text-red-400' : 'text-yellow-400'}`}>
            {formatCurrency(totalSpent)}
          </div>
        </div>
        <div className="glass rounded-xl p-4 border border-white/10">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Remaining</div>
          <div className={`text-xl font-bold ${totalRemaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(Math.abs(totalRemaining))}
            {totalRemaining < 0 && <span className="text-sm font-normal"> over</span>}
          </div>
        </div>
      </div>

      {/* Add Budget Form */}
      {addingNew && (
        <div className="glass-strong rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-cyan-400">New Budget Category</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg text-xs text-gray-300 px-3 py-2 focus:outline-none focus:border-cyan-500/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <Input
              label="Monthly Budget ($)"
              type="number"
              min="0"
              step="10"
              placeholder="500"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={addBudget}>Add Budget</Button>
            <Button variant="ghost" size="sm" onClick={() => setAddingNew(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Budget Items */}
      {loading ? (
        <div className="text-center py-8 text-gray-600 text-sm">Loading spending data...</div>
      ) : budgetsWithSpent.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-600">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No budgets set for {month}</p>
            <p className="text-xs mt-1">Click &quot;Add Budget&quot; to start tracking your spending</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {budgetsWithSpent.map((budget) => {
            const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0
            const isOver = percentage > 100
            const isWarning = percentage > 80 && !isOver

            return (
              <div key={budget.id} className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-200">{budget.category}</span>
                    {isOver && <AlertTriangle className="w-3 h-3 text-red-400" />}
                    {isWarning && <AlertTriangle className="w-3 h-3 text-yellow-400" />}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`text-sm font-semibold ${isOver ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-green-400'}`}>
                        {formatCurrency(budget.spent)}
                      </span>
                      <span className="text-xs text-gray-500"> / {formatCurrency(budget.amount)}</span>
                    </div>
                    <button
                      onClick={() => deleteBudget(budget.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isOver ? 'bg-red-400' : isWarning ? 'bg-yellow-400' : 'bg-green-400'}`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>

                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-600">{percentage.toFixed(0)}% used</span>
                  <span className={`text-xs ${isOver ? 'text-red-400' : 'text-gray-500'}`}>
                    {isOver
                      ? `${formatCurrency(budget.spent - budget.amount)} over budget`
                      : `${formatCurrency(budget.amount - budget.spent)} remaining`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 50/30/20 Rule Guide */}
      <Card title="50/30/20 Budget Rule" subtitle="Recommended allocation">
        <div className="grid grid-cols-3 gap-3 mt-2">
          {[
            { label: 'Needs', pct: 50, color: 'text-cyan-400', desc: 'Housing, food, utilities, transport' },
            { label: 'Wants', pct: 30, color: 'text-purple-400', desc: 'Entertainment, dining out, hobbies' },
            { label: 'Savings', pct: 20, color: 'text-green-400', desc: 'Emergency fund, investments, debt' },
          ].map(({ label, pct, color, desc }) => (
            <div key={label} className="text-center p-3 rounded-lg bg-white/3">
              <div className={`text-2xl font-bold ${color}`}>{pct}%</div>
              <div className={`text-xs font-semibold ${color} mt-1`}>{label}</div>
              <div className="text-xs text-gray-600 mt-1">{desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
