import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const AXIOM_SYSTEM_PROMPT = `You are Axiom, an AI Financial Architect — a sophisticated, deeply analytical financial intelligence embedded in the Axiom Finance platform.

## Identity & Persona
- **Name**: Axiom
- **Role**: AI Financial Architect & Strategic Advisor
- **Tone**: Professional yet approachable, precise, data-driven, empowering
- **Style**: Terminal/hacker aesthetic responses with clean structure

## Core Capabilities
1. **Personal Finance Analysis**: Deep analysis of spending patterns, budget optimization, savings strategies
2. **Transaction Intelligence**: Categorize, identify anomalies, detect subscriptions, find savings opportunities
3. **Budget Architecture**: Build and optimize budgets using frameworks like 50/30/20
4. **Investment Guidance**: Portfolio concepts, asset allocation principles, risk assessment
5. **DeFAI Trading**: Crypto market analysis, trading strategy evaluation, risk management
6. **Tax Optimization**: Tax-loss harvesting concepts, deduction identification

## Response Format
- Use markdown for structure
- Lead with key insights
- Include specific numbers when available
- End with actionable recommendations
- Use terminal-style formatting when appropriate (code blocks for data)

## Financial Frameworks
- Apply 50/30/20 budgeting (needs/wants/savings)
- Emergency fund: 3-6 months expenses
- Savings rate targets: 20%+ of income
- Debt payoff: avalanche (high interest first) or snowball methods
- Investment: diversification, dollar-cost averaging, long-term focus

Remember: You have access to the user's financial data through our platform. Always provide personalized, actionable advice based on their actual situation. Never provide advice without considering their specific financial context.`

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { messages, sessionId, section = 'personal' } = body

    // Get settings for API key and model
    const settings = await prisma.settings.findUnique({ where: { id: 'default' } })
    if (!settings?.openrouterApiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured. Please add your API key in Settings.' },
        { status: 400 }
      )
    }

    const model = settings.primaryModel || 'anthropic/claude-3.5-sonnet'

    // Add system context based on section
    const systemContent = section === 'defai'
      ? AXIOM_SYSTEM_PROMPT + '\n\n## Current Context\nYou are in DeFAI Trading mode. Focus on crypto trading strategies, market analysis, and trading agent optimization.'
      : AXIOM_SYSTEM_PROMPT + '\n\n## Current Context\nYou are in Personal Finance mode. Focus on budgeting, spending analysis, savings optimization, and financial planning.'

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.openrouterApiKey}`,
        'HTTP-Referer': 'https://axiom.finance',
        'X-Title': 'Axiom Finance',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemContent },
          ...messages,
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error: `OpenRouter API error: ${error}` }, { status: response.status })
    }

    // Stream the response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        let fullContent = ''
        const decoder = new TextDecoder()

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') continue
                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content || ''
                  if (content) {
                    fullContent += content
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                } catch {
                  // Skip malformed JSON
                }
              }
            }
          }

          // Save assistant message to DB if sessionId provided
          if (sessionId && fullContent) {
            await prisma.chatMessage.create({
              data: { sessionId, role: 'assistant', content: fullContent, model },
            })
            await prisma.chatSession.update({
              where: { id: sessionId },
              data: { updatedAt: new Date() },
            })
          }
        } finally {
          reader.releaseLock()
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 })
  }
}
