import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') || 'personal'
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
      return NextResponse.json(session)
    }

    const sessions = await prisma.chatSession.findMany({
      where: { section },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    })
    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Chat GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch chat sessions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, sessionId, title, section, role, content, model } = body

    if (action === 'create_session') {
      const session = await prisma.chatSession.create({
        data: { title: title || 'New Chat', section: section || 'personal' },
        include: { messages: true },
      })
      return NextResponse.json(session)
    }

    if (action === 'add_message' && sessionId) {
      const message = await prisma.chatMessage.create({
        data: { sessionId, role, content, model },
      })
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      })
      return NextResponse.json(message)
    }

    if (action === 'update_title' && sessionId) {
      const session = await prisma.chatSession.update({
        where: { id: sessionId },
        data: { title },
      })
      return NextResponse.json(session)
    }

    if (action === 'delete_session' && sessionId) {
      await prisma.chatSession.delete({ where: { id: sessionId } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Chat POST error:', error)
    return NextResponse.json({ error: 'Failed to process chat action' }, { status: 500 })
  }
}
