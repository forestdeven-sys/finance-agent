import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { categorizeTransaction } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const source = (formData.get('source') as string) || 'csv'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.trim().split('\n')
    if (lines.length < 2) {
      return NextResponse.json({ error: 'File has no data rows' }, { status: 400 })
    }

    const headers = lines[0].split(',').map((h) => h.replace(/"/g, '').trim().toLowerCase())

    const findCol = (names: string[]) => {
      for (const name of names) {
        const idx = headers.indexOf(name)
        if (idx !== -1) return idx
      }
      return -1
    }

    const dateIdx = findCol(['date', 'transaction date', 'trans date', 'posted date', 'posting date'])
    const descIdx = findCol(['description', 'memo', 'transaction', 'name', 'payee', 'merchant', 'details'])
    const amountIdx = findCol(['amount', 'transaction amount', 'debit amount', 'credit amount'])
    const typeIdx = findCol(['type', 'transaction type', 'debit/credit'])
    const merchantIdx = findCol(['merchant', 'payee', 'vendor'])
    const categoryIdx = findCol(['category', 'mcc category'])

    if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
      return NextResponse.json(
        { error: 'Could not find required columns (date, description, amount)' },
        { status: 400 }
      )
    }

    const importRecord = await prisma.fileImport.create({
      data: { filename: file.name, source, status: 'processing' },
    })

    let rowsImported = 0
    let rowsSkipped = 0
    const transactions = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) { rowsSkipped++; continue }

      // Parse CSV line handling quoted fields
      const cols: string[] = []
      let inQuote = false
      let current = ''
      for (let j = 0; j < line.length; j++) {
        const ch = line[j]
        if (ch === '"') {
          inQuote = !inQuote
        } else if (ch === ',' && !inQuote) {
          cols.push(current.trim())
          current = ''
        } else {
          current += ch
        }
      }
      cols.push(current.trim())

      const dateStr = cols[dateIdx]?.replace(/"/g, '').trim()
      const desc = cols[descIdx]?.replace(/"/g, '').trim()
      const amountStr = cols[amountIdx]?.replace(/[$,"]/g, '').trim()

      if (!dateStr || !desc || !amountStr) { rowsSkipped++; continue }

      const date = new Date(dateStr)
      if (isNaN(date.getTime())) { rowsSkipped++; continue }

      const rawAmount = parseFloat(amountStr)
      if (isNaN(rawAmount)) { rowsSkipped++; continue }

      const amount = Math.abs(rawAmount)
      let type = rawAmount < 0 ? 'debit' : 'credit'
      if (typeIdx !== -1) {
        const typeStr = cols[typeIdx]?.toLowerCase() || ''
        if (typeStr.includes('debit') || typeStr.includes('purchase') || typeStr.includes('payment')) {
          type = 'debit'
        } else if (typeStr.includes('credit') || typeStr.includes('deposit')) {
          type = 'credit'
        }
      }

      const merchant = merchantIdx !== -1 ? cols[merchantIdx]?.replace(/"/g, '').trim() : undefined
      const category = categoryIdx !== -1
        ? (cols[categoryIdx]?.replace(/"/g, '').trim() || categorizeTransaction(desc))
        : categorizeTransaction(desc)

      transactions.push({
        date,
        description: desc,
        amount,
        type,
        category,
        merchant: merchant || undefined,
        tags: JSON.stringify([]),
        source,
        importId: importRecord.id,
      })
      rowsImported++
    }

    if (transactions.length > 0) {
      await prisma.transaction.createMany({ data: transactions })
    }

    await prisma.fileImport.update({
      where: { id: importRecord.id },
      data: { rowsImported, rowsSkipped, status: 'completed' },
    })

    return NextResponse.json({ success: true, rowsImported, rowsSkipped, importId: importRecord.id })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Failed to import file' }, { status: 500 })
  }
}
