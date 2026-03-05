import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const where = month ? { month } : {}
    const budgets = await prisma.budget.findMany({ where, orderBy: { createdAt: 'asc' } })
    return NextResponse.json({ budgets })
  } catch (error) {
    console.error('Budgets GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const budget = await prisma.budget.create({
      data: {
        category: body.category,
        amount: body.amount,
        month: body.month,
        spent: 0,
      },
    })
    return NextResponse.json(budget)
  } catch (error) {
    console.error('Budgets POST error:', error)
    return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 })
  }
}
