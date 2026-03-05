'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Search, Filter, Download, Trash2, ChevronLeft, ChevronRight, Tag } from 'lucide-react'

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: string
  category: string
  merchant?: string | null
  notes?: string | null
  tags: string[]
}

const CATEGORIES = [
  'All', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Health',
  'Utilities', 'Subscriptions', 'Housing', 'Income', 'Transfer', 'Uncategorized'
]

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [type, setType] = useState('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Transaction>>({})
  const limit = 25

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search && { search }),
        ...(category !== 'all' && { category }),
        ...(type !== 'all' && { type }),
      })
      const res = await fetch(`/api/transactions?${params}`)
      const data = await res.json()
      setTransactions(data.transactions || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Failed to load transactions', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, category, type])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === transactions.length) setSelected(new Set())
    else setSelected(new Set(transactions.map((t) => t.id)))
  }

  const deleteSelected = async () => {
    if (selected.size === 0) return
    const ids = Array.from(selected).join(',')
    await fetch(`/api/transactions?ids=${ids}`, { method: 'DELETE' })
    setSelected(new Set())
    loadTransactions()
  }

  const deleteOne = async (id: string) => {
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    loadTransactions()
  }

  const startEdit = (txn: Transaction) => {
    setEditingId(txn.id)
    setEditData({ category: txn.category, notes: txn.notes || '', amount: txn.amount })
  }

  const saveEdit = async (id: string) => {
    await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData),
    })
    setEditingId(null)
    loadTransactions()
  }

  const exportCSV = () => {
    const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Merchant', 'Notes']
    const rows = transactions.map((t) => [
      formatDate(t.date), t.description, t.amount.toFixed(2), t.type,
      t.category, t.merchant || '', t.notes || ''
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transactions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-48">
          <Input
            icon={<Search className="w-3 h-3" />}
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          className="bg-black/40 border border-white/10 rounded-lg text-xs text-gray-300 px-3 py-2 focus:outline-none focus:border-cyan-500/50"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c === 'All' ? 'all' : c}>{c}</option>
          ))}
        </select>

        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1) }}
          className="bg-black/40 border border-white/10 rounded-lg text-xs text-gray-300 px-3 py-2 focus:outline-none focus:border-cyan-500/50"
        >
          <option value="all">All Types</option>
          <option value="debit">Debits</option>
          <option value="credit">Credits</option>
        </select>

        <div className="flex gap-2 ml-auto">
          {selected.size > 0 && (
            <Button variant="danger" size="sm" onClick={deleteSelected}>
              <Trash2 className="w-3 h-3" /> Delete ({selected.size})
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={exportCSV}>
            <Download className="w-3 h-3" /> Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-500">
                <th className="p-3 text-left w-8">
                  <input
                    type="checkbox"
                    checked={selected.size === transactions.length && transactions.length > 0}
                    onChange={selectAll}
                    className="accent-cyan-400"
                  />
                </th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-600">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-600">
                    No transactions found. Import a CSV or add manually.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className={`border-b border-white/5 hover:bg-white/3 transition-colors ${selected.has(txn.id) ? 'bg-cyan-500/5' : ''}`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selected.has(txn.id)}
                        onChange={() => toggleSelect(txn.id)}
                        className="accent-cyan-400"
                      />
                    </td>
                    <td className="p-3 text-gray-500 whitespace-nowrap">{formatDate(txn.date)}</td>
                    <td className="p-3">
                      <div className="text-gray-300 max-w-48 truncate">{txn.description}</div>
                      {txn.merchant && <div className="text-gray-600 text-xs">{txn.merchant}</div>}
                    </td>
                    <td className="p-3">
                      {editingId === txn.id ? (
                        <select
                          value={editData.category}
                          onChange={(e) => setEditData((prev) => ({ ...prev, category: e.target.value }))}
                          className="bg-black/60 border border-cyan-500/30 rounded px-2 py-1 text-xs text-gray-300"
                        >
                          {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                          <Tag className="w-2 h-2" /> {txn.category}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {editingId === txn.id ? (
                        <input
                          type="number"
                          value={editData.amount}
                          onChange={(e) => setEditData((prev) => ({ ...prev, amount: parseFloat(e.target.value) }))}
                          className="bg-black/60 border border-cyan-500/30 rounded px-2 py-1 text-xs text-gray-300 w-24 text-right"
                        />
                      ) : (
                        <span className={txn.type === 'credit' ? 'text-green-400' : 'text-red-400'}>
                          {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${txn.type === 'credit' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        {editingId === txn.id ? (
                          <>
                            <button onClick={() => saveEdit(txn.id)} className="text-green-400 hover:text-green-300 text-xs">Save</button>
                            <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-300 text-xs">Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(txn)} className="text-gray-500 hover:text-cyan-400 transition-colors">
                              <Filter className="w-3 h-3" />
                            </button>
                            <button onClick={() => deleteOne(txn.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <span className="px-3 py-1.5">Page {page} of {totalPages}</span>
            <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
