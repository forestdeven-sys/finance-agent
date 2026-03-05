import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function categorizeTransaction(description: string): string {
  const desc = description.toLowerCase()

  const categories: Record<string, string[]> = {
    Food: ['restaurant', 'food', 'pizza', 'burger', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'subway', 'chipotle', 'doordash', 'ubereats', 'grubhub', 'dining'],
    Transport: ['uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking', 'transit', 'metro', 'bus', 'train', 'airline', 'flight', 'delta', 'united', 'southwest'],
    Shopping: ['amazon', 'walmart', 'target', 'costco', 'best buy', 'ebay', 'etsy', 'shopping', 'store', 'mall'],
    Entertainment: ['netflix', 'spotify', 'hulu', 'disney', 'apple music', 'youtube', 'gaming', 'steam', 'playstation', 'xbox', 'cinema', 'movie', 'theater'],
    Health: ['pharmacy', 'cvs', 'walgreens', 'doctor', 'dental', 'medical', 'hospital', 'clinic', 'gym', 'fitness'],
    Utilities: ['electric', 'water', 'gas bill', 'internet', 'phone', 'att', 'verizon', 'comcast', 'utility'],
    Subscriptions: ['subscription', 'monthly', 'annual', 'membership', 'plan'],
    Housing: ['rent', 'mortgage', 'lease', 'landlord', 'property'],
    Income: ['salary', 'payroll', 'deposit', 'paycheck', 'income', 'dividend', 'interest'],
    Transfer: ['transfer', 'zelle', 'venmo', 'paypal', 'cashapp', 'wire'],
  }

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((kw) => desc.includes(kw))) {
      return category
    }
  }
  return 'Uncategorized'
}

export function parseCSVRow(row: Record<string, string>): {
  date: Date | null
  description: string
  amount: number
  type: string
  category: string
} | null {
  // Try to find date field
  const dateField = Object.keys(row).find((k) =>
    ['date', 'transaction date', 'trans date', 'posted date', 'posting date'].includes(k.toLowerCase())
  )
  // Try to find description field
  const descField = Object.keys(row).find((k) =>
    ['description', 'memo', 'transaction', 'name', 'payee', 'merchant'].includes(k.toLowerCase())
  )
  // Try to find amount field
  const amountField = Object.keys(row).find((k) =>
    ['amount', 'transaction amount', 'debit', 'credit'].includes(k.toLowerCase())
  )

  if (!dateField || !descField || !amountField) return null

  const dateStr = row[dateField]
  const description = row[descField] || ''
  const amountStr = row[amountField]?.replace(/[$,()]/g, '').trim()

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return null

  const amount = parseFloat(amountStr)
  if (isNaN(amount)) return null

  const type = amount < 0 ? 'debit' : 'credit'
  const category = categorizeTransaction(description)

  return {
    date,
    description,
    amount: Math.abs(amount),
    type,
    category,
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function getCurrentMonthKey(): string {
  return getMonthKey(new Date())
}
