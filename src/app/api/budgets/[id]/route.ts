import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.budget.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Budget DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 })
  }
}
