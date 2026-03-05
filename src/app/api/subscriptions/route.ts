import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error('Subscriptions GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const subscription = await prisma.subscription.create({
      data: {
        name: body.name,
        amount: body.amount,
        frequency: body.frequency || 'monthly',
        nextBilling: body.nextBilling ? new Date(body.nextBilling) : null,
        category: body.category || 'Other',
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Subscriptions POST error:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
