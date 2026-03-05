import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: 'default' } })
    if (!settings) {
      settings = await prisma.settings.create({ data: { id: 'default' } })
    }
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      update: body,
      create: { id: 'default', ...body },
    })
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Settings PUT error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
