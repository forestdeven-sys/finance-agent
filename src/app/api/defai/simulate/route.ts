import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function generateSimulationTrades(
  simulationId: string,
  pairs: string[],
  balance: number,
  strategy: string,
  numTrades: number
) {
  const trades = []
  const prices: Record<string, number> = {
    'SOL/USDC': 180,
    'BTC/USDC': 65000,
    'ETH/USDC': 3500,
    'BNB/USDC': 420,
    'AVAX/USDC': 38,
  }

  for (let i = 0; i < numTrades; i++) {
    const pair = pairs[i % pairs.length]
    const basePrice = prices[pair] || 100
    const volatility = strategy === 'momentum' ? 0.03 : strategy === 'scalping' ? 0.01 : 0.025
    const entryPrice = basePrice * (1 + (Math.random() - 0.5) * volatility)
    const side = Math.random() > 0.5 ? 'buy' : 'sell'
    const tradeAmount = balance * 0.05 * (Math.random() + 0.5)
    const winProbability = strategy === 'momentum' ? 0.55 : strategy === 'scalping' ? 0.52 : 0.58
    const isWin = Math.random() < winProbability
    const priceChange = isWin ? Math.random() * volatility * 2 : -Math.random() * volatility * 1.5
    const exitPrice = entryPrice * (1 + (side === 'buy' ? priceChange : -priceChange))
    const priceDiff = side === 'buy' ? exitPrice - entryPrice : entryPrice - exitPrice
    const profit = (priceDiff / entryPrice) * tradeAmount

    trades.push({
      pair,
      side,
      entryPrice,
      exitPrice,
      amount: tradeAmount / entryPrice,
      profit,
      status: 'closed',
      strategy,
      simulationId,
    })
  }
  return trades
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name = 'Simulation',
      startBalance = 10000,
      strategy = 'momentum',
      pairs = ['SOL/USDC'],
      duration = 3600,
      targetProfit,
      maxLoss,
      goal,
    } = body

    // Create simulation record
    const simulation = await prisma.simulation.create({
      data: {
        name,
        startBalance,
        balance: startBalance,
        strategy,
        pairs: JSON.stringify(pairs),
        duration,
        targetProfit,
        maxLoss,
        goal,
        status: 'running',
        startedAt: new Date(),
      },
    })

    // Simulate trades based on duration (1 trade per ~60 seconds simulated)
    const numTrades = Math.max(5, Math.floor(duration / 60))
    const tradesToCreate = generateSimulationTrades(
      simulation.id,
      pairs,
      startBalance,
      strategy,
      numTrades
    )

    await prisma.trade.createMany({ data: tradesToCreate })

    // Calculate final stats
    const allTrades = await prisma.trade.findMany({ where: { simulationId: simulation.id } })
    const totalPnl = allTrades.reduce((sum, t) => sum + (t.profit || 0), 0)
    const wins = allTrades.filter((t) => (t.profit || 0) > 0).length
    const winRate = allTrades.length > 0 ? (wins / allTrades.length) * 100 : 0
    const finalBalance = startBalance + totalPnl

    const updatedSimulation = await prisma.simulation.update({
      where: { id: simulation.id },
      data: {
        status: 'completed',
        balance: finalBalance,
        totalTrades: allTrades.length,
        winRate,
        pnl: totalPnl,
        endedAt: new Date(),
      },
    })

    return NextResponse.json({
      simulation: { ...updatedSimulation, pairs: JSON.parse(updatedSimulation.pairs) },
      trades: allTrades.slice(-20), // Return last 20 trades
    })
  } catch (error) {
    console.error('Simulate error:', error)
    return NextResponse.json({ error: 'Failed to run simulation' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const simulations = await prisma.simulation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    return NextResponse.json(
      simulations.map((s) => ({ ...s, pairs: JSON.parse(s.pairs) }))
    )
  } catch (error) {
    console.error('Simulate GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch simulations' }, { status: 500 })
  }
}
