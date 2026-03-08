import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        name: body.name,
        amount: body.amount,
        frequency: body.frequency,
        nextBilling: body.nextBilling ? new Date(body.nextBilling) : null,
        category: body.category,
        isActive: body.isActive,
      },
    })
    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Subscription PUT error:', error)
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.subscription.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscription DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 })
  }
}
