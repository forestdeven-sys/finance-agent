import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}
    if (category && category !== 'all') where.category = category
    if (type && type !== 'all') where.type = type
    if (search) {
      where.OR = [
        { description: { contains: search } },
        { merchant: { contains: search } },
        { category: { contains: search } },
      ]
    }
    if (startDate || endDate) {
      where.date = {}
      if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate)
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ])

    const parsed = transactions.map((t) => ({
      ...t,
      tags: JSON.parse(t.tags || '[]'),
    }))

    return NextResponse.json({ transactions: parsed, total, page, limit })
  } catch (error) {
    console.error('Transactions GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const transaction = await prisma.transaction.create({
      data: {
        date: new Date(body.date),
        description: body.description,
        amount: body.amount,
        type: body.type || 'debit',
        category: body.category || 'Uncategorized',
        merchant: body.merchant,
        tags: JSON.stringify(body.tags || []),
        notes: body.notes,
        source: body.source || 'manual',
        importId: body.importId,
      },
    })
    return NextResponse.json({ ...transaction, tags: JSON.parse(transaction.tags) })
  } catch (error) {
    console.error('Transactions POST error:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')?.split(',')
    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }
    await prisma.transaction.deleteMany({ where: { id: { in: ids } } })
    return NextResponse.json({ success: true, deleted: ids.length })
  } catch (error) {
    console.error('Transactions DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete transactions' }, { status: 500 })
  }
}
