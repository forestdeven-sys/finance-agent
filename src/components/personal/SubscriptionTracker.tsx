'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, Trash2, RefreshCw, CreditCard, Calendar, ToggleLeft, ToggleRight } from 'lucide-react'

interface Subscription {
  id: string
  name: string
  amount: number
  frequency: string
  nextBilling?: string | null
  category: string
  isActive: boolean
}

const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  { id: '1', name: 'Netflix', amount: 15.99, frequency: 'monthly', category: 'Entertainment', isActive: true },
  { id: '2', name: 'Spotify', amount: 9.99, frequency: 'monthly', category: 'Entertainment', isActive: true },
  { id: '3', name: 'Amazon Prime', amount: 14.99, frequency: 'monthly', category: 'Shopping', isActive: true },
  { id: '4', name: 'iCloud Storage', amount: 2.99, frequency: 'monthly', category: 'Utilities', isActive: true },
]

export function SubscriptionTracker() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [addingNew, setAddingNew] = useState(false)
  const [newSub, setNewSub] = useState({
    name: '', amount: '', frequency: 'monthly', category: 'Entertainment', nextBilling: ''
  })

  useEffect(() => {
    const saved = localStorage.getItem('subscriptions')
    if (saved) {
      setSubscriptions(JSON.parse(saved))
    } else {
      setSubscriptions(INITIAL_SUBSCRIPTIONS)
    }
  }, [])

  const saveSubscriptions = (subs: Subscription[]) => {
    setSubscriptions(subs)
    localStorage.setItem('subscriptions', JSON.stringify(subs))
  }

  const addSubscription = () => {
    if (!newSub.name || !newSub.amount) return
    const sub: Subscription = {
      id: Date.now().toString(),
      name: newSub.name,
      amount: parseFloat(newSub.amount),
      frequency: newSub.frequency,
      category: newSub.category,
      isActive: true,
      nextBilling: newSub.nextBilling || null,
    }
    saveSubscriptions([...subscriptions, sub])
    setNewSub({ name: '', amount: '', frequency: 'monthly', category: 'Entertainment', nextBilling: '' })
    setAddingNew(false)
  }

  const toggleActive = (id: string) => {
    saveSubscriptions(subscriptions.map((s) => s.id === id ? { ...s, isActive: !s.isActive } : s))
  }

  const deleteSubscription = (id: string) => {
    saveSubscriptions(subscriptions.filter((s) => s.id !== id))
  }

  const getMonthlyAmount = (sub: Subscription) => {
    switch (sub.frequency) {
      case 'yearly': return sub.amount / 12
      case 'weekly': return sub.amount * 4.33
      case 'quarterly': return sub.amount / 3
      default: return sub.amount
    }
  }

  const activeSubscriptions = subscriptions.filter((s) => s.isActive)
  const monthlyTotal = activeSubscriptions.reduce((sum, s) => sum + getMonthlyAmount(s), 0)
  const yearlyTotal = monthlyTotal * 12

  const frequencyOptions = ['monthly', 'yearly', 'weekly', 'quarterly']
  const categoryOptions = ['Entertainment', 'Utilities', 'Shopping', 'Health', 'Software', 'Finance', 'Education', 'Other']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-cyan-400">Subscription Tracker</h2>
          <p className="text-sm text-gray-500 mt-1">Monitor and manage your recurring expenses</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setAddingNew(true)}>
          <Plus className="w-3 h-3" /> Add Subscription
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 border border-white/10">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Monthly Cost</div>
          <div className="text-xl font-bold text-cyan-400">{formatCurrency(monthlyTotal)}</div>
          <div className="text-xs text-gray-600 mt-1">{activeSubscriptions.length} active</div>
        </div>
        <div className="glass rounded-xl p-4 border border-white/10">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Yearly Cost</div>
          <div className="text-xl font-bold text-orange-400">{formatCurrency(yearlyTotal)}</div>
          <div className="text-xs text-gray-600 mt-1">per year</div>
        </div>
        <div className="glass rounded-xl p-4 border border-white/10">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Subs</div>
          <div className="text-xl font-bold text-gray-300">{subscriptions.length}</div>
          <div className="text-xs text-gray-600 mt-1">{subscriptions.filter((s) => !s.isActive).length} paused</div>
        </div>
      </div>

      {/* Add New Form */}
      {addingNew && (
        <div className="glass-strong rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-cyan-400">New Subscription</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Service Name"
              placeholder="Netflix, Spotify..."
              value={newSub.name}
              onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
            />
            <Input
              label="Amount ($)"
              type="number"
              min="0"
              step="0.01"
              placeholder="9.99"
              value={newSub.amount}
              onChange={(e) => setNewSub({ ...newSub, amount: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Frequency</label>
              <select
                value={newSub.frequency}
                onChange={(e) => setNewSub({ ...newSub, frequency: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg text-xs text-gray-300 px-3 py-2"
              >
                {frequencyOptions.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Category</label>
              <select
                value={newSub.category}
                onChange={(e) => setNewSub({ ...newSub, category: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg text-xs text-gray-300 px-3 py-2"
              >
                {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Input
              label="Next Billing"
              type="date"
              value={newSub.nextBilling}
              onChange={(e) => setNewSub({ ...newSub, nextBilling: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={addSubscription}>Add Subscription</Button>
            <Button variant="ghost" size="sm" onClick={() => setAddingNew(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Subscriptions List */}
      <div className="space-y-2">
        {subscriptions.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-gray-600">
            <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No subscriptions tracked yet</p>
          </div>
        ) : (
          subscriptions.map((sub) => (
            <div
              key={sub.id}
              className={`glass rounded-xl p-4 flex items-center gap-4 transition-all ${!sub.isActive ? 'opacity-50' : ''}`}
            >
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 text-gray-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-200">{sub.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-500">{sub.category}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <RefreshCw className="w-2.5 h-2.5" /> {sub.frequency}
                  </span>
                  {sub.nextBilling && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-2.5 h-2.5" /> {formatDate(sub.nextBilling)}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-sm font-semibold text-cyan-400">{formatCurrency(sub.amount)}</div>
                <div className="text-xs text-gray-600">/{sub.frequency.replace('ly', '')}</div>
                {sub.frequency !== 'monthly' && (
                  <div className="text-xs text-gray-600">{formatCurrency(getMonthlyAmount(sub))}/mo</div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(sub.id)}
                  className={`transition-colors ${sub.isActive ? 'text-green-400 hover:text-yellow-400' : 'text-gray-600 hover:text-green-400'}`}
                  title={sub.isActive ? 'Pause' : 'Activate'}
                >
                  {sub.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => deleteSubscription(sub.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
