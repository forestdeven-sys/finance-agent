import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...(body.date && { date: new Date(body.date) }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.amount !== undefined && { amount: body.amount }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.merchant !== undefined && { merchant: body.merchant }),
        ...(body.tags !== undefined && { tags: JSON.stringify(body.tags) }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    })
    return NextResponse.json({ ...transaction, tags: JSON.parse(transaction.tags) })
  } catch (error) {
    console.error('Transaction PUT error:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.transaction.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Transaction DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}
