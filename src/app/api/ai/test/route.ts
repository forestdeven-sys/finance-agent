import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json()
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 })
    }

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://axiom.finance',
        'X-Title': 'Axiom Finance',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Invalid API key', valid: false }, { status: 200 })
    }

    const data = await response.json()
    const modelCount = data.data?.length || 0
    return NextResponse.json({ valid: true, modelCount })
  } catch (error) {
    console.error('API test error:', error)
    return NextResponse.json({ error: 'Connection failed', valid: false }, { status: 200 })
  }
}
