'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Play, Square, TrendingUp, TrendingDown, BarChart3, Zap, Target, AlertTriangle } from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts'

interface SimulationResult {
  simulation: {
    id: string
    name: string
    startBalance: number
    balance: number
    totalTrades: number
    winRate: number
    pnl: number
    strategy: string
  }
  trades: {
    id: string
    pair: string
    side: string
    entryPrice: number
    exitPrice?: number
    profit?: number
    status: string
  }[]
}

interface BalancePoint {
  trade: number
  balance: number
  pnl: number
}

const STRATEGIES = [
  { id: 'momentum', label: 'Momentum', desc: 'Follow market trends', winRate: '55%' },
  { id: 'mean_reversion', label: 'Mean Reversion', desc: 'Buy dips, sell peaks', winRate: '58%' },
  { id: 'scalping', label: 'Scalping', desc: 'Quick small profits', winRate: '52%' },
  { id: 'breakout', label: 'Breakout', desc: 'Trade range breaks', winRate: '56%' },
]

const PAIRS = ['SOL/USDC', 'BTC/USDC', 'ETH/USDC', 'BNB/USDC', 'AVAX/USDC']

export function TradingDashboard() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [balanceHistory, setBalanceHistory] = useState<BalancePoint[]>([])
  const [config, setConfig] = useState({
    startBalance: 10000,
    strategy: 'momentum',
    pairs: ['SOL/USDC'],
    duration: 3600,
    targetProfit: 1000,
    maxLoss: 2000,
  })
  const [previousSims, setPreviousSims] = useState<SimulationResult['simulation'][]>([])

  useEffect(() => {
    loadPreviousSims()
  }, [])

  const loadPreviousSims = async () => {
    try {
      const res = await fetch('/api/defai/simulate')
      const data = await res.json()
      setPreviousSims(data.slice(0, 5))
    } catch {
      // Silently fail
    }
  }

  const runSimulation = async () => {
    setRunning(true)
    setResult(null)
    setBalanceHistory([])

    try {
      const res = await fetch('/api/defai/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data: SimulationResult = await res.json()
      setResult(data)

      // Build balance history from trades
      let balance = config.startBalance
      const history: BalancePoint[] = [{ trade: 0, balance, pnl: 0 }]
      data.trades.forEach((trade, i) => {
        balance += trade.profit || 0
        history.push({ trade: i + 1, balance: Math.round(balance), pnl: Math.round(balance - config.startBalance) })
      })
      setBalanceHistory(history)
      loadPreviousSims()
    } catch (err) {
      console.error('Simulation error:', err)
    } finally {
      setRunning(false)
    }
  }

  const togglePair = (pair: string) => {
    setConfig((prev) => ({
      ...prev,
      pairs: prev.pairs.includes(pair)
        ? prev.pairs.filter((p) => p !== pair)
        : [...prev.pairs, pair],
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-cyan-400">DeFAI Trading Simulator</h2>
          <p className="text-sm text-gray-500 mt-1">AI-powered simulated crypto trading with realistic market dynamics</p>
        </div>
        {result && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${result.simulation.pnl >= 0 ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
            {result.simulation.pnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {result.simulation.pnl >= 0 ? '+' : ''}{formatCurrency(result.simulation.pnl)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config Panel */}
        <div className="space-y-4">
          <Card title="Simulation Config" variant="strong">
            <div className="space-y-4">
              {/* Start Balance */}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Starting Balance</label>
                <div className="flex gap-2 flex-wrap">
                  {[5000, 10000, 25000, 50000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setConfig((p) => ({ ...p, startBalance: amount }))}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${config.startBalance === amount ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strategy */}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Strategy</label>
                <div className="space-y-1.5">
                  {STRATEGIES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setConfig((p) => ({ ...p, strategy: s.id }))}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-colors ${config.strategy === s.id ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' : 'bg-white/3 border-white/10 text-gray-400 hover:bg-white/5'}`}
                    >
                      <div>
                        <div className="text-xs font-semibold">{s.label}</div>
                        <div className="text-xs text-gray-600">{s.desc}</div>
                      </div>
                      <span className="text-xs text-green-400 ml-2">{s.winRate}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trading Pairs */}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Trading Pairs</label>
                <div className="flex flex-wrap gap-2">
                  {PAIRS.map((pair) => (
                    <button
                      key={pair}
                      onClick={() => togglePair(pair)}
                      className={`px-2 py-1 rounded text-xs border transition-colors ${config.pairs.includes(pair) ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}`}
                    >
                      {pair}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">
                  Duration: {config.duration / 3600}h
                </label>
                <input
                  type="range"
                  min="1800"
                  max="86400"
                  step="1800"
                  value={config.duration}
                  onChange={(e) => setConfig((p) => ({ ...p, duration: parseInt(e.target.value) }))}
                  className="w-full accent-cyan-400"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>30m</span><span>24h</span>
                </div>
              </div>

              {/* Risk Controls */}
              <div className="space-y-2">
                <label className="text-xs text-gray-400 uppercase tracking-wider block">Risk Controls</label>
                <div className="flex items-center gap-2">
                  <Target className="w-3 h-3 text-green-400 flex-shrink-0" />
                  <span className="text-xs text-gray-400 w-24">Target:</span>
                  <input
                    type="number"
                    value={config.targetProfit}
                    onChange={(e) => setConfig((p) => ({ ...p, targetProfit: parseInt(e.target.value) }))}
                    className="flex-1 bg-black/40 border border-green-500/20 rounded px-2 py-1 text-xs text-gray-300"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                  <span className="text-xs text-gray-400 w-24">Max Loss:</span>
                  <input
                    type="number"
                    value={config.maxLoss}
                    onChange={(e) => setConfig((p) => ({ ...p, maxLoss: parseInt(e.target.value) }))}
                    className="flex-1 bg-black/40 border border-red-500/20 rounded px-2 py-1 text-xs text-gray-300"
                  />
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={runSimulation}
                loading={running}
              >
                {running ? (
                  <><Zap className="w-3 h-3" /> Running Simulation...</>
                ) : (
                  <><Play className="w-3 h-3" /> Run Simulation</>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-4">
          {result ? (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Final Balance', value: formatCurrency(result.simulation.balance), color: result.simulation.pnl >= 0 ? 'text-green-400' : 'text-red-400' },
                  { label: 'Total P&L', value: `${result.simulation.pnl >= 0 ? '+' : ''}${formatCurrency(result.simulation.pnl)}`, color: result.simulation.pnl >= 0 ? 'text-green-400' : 'text-red-400' },
                  { label: 'Win Rate', value: `${result.simulation.winRate.toFixed(1)}%`, color: 'text-cyan-400' },
                  { label: 'Trades', value: result.simulation.totalTrades.toString(), color: 'text-gray-300' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="glass rounded-xl p-3 border border-white/10">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
                    <div className={`text-lg font-bold ${color}`}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Balance Chart */}
              <Card title="Balance History">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={balanceHistory}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={result.simulation.pnl >= 0 ? '#00ff88' : '#ff4757'} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={result.simulation.pnl >= 0 ? '#00ff88' : '#ff4757'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="trade" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} label={{ value: 'Trade #', position: 'insideBottom', offset: -2, style: { fontSize: 10, fill: '#555' } }} />
                    <YAxis tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: '#0d0d14', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 8, fontSize: 11 }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(v: any) => [typeof v === 'number' ? formatCurrency(v) : String(v ?? '')]}
                    />
                    <ReferenceLine y={config.startBalance} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
                    <Area type="monotone" dataKey="balance" stroke={result.simulation.pnl >= 0 ? '#00ff88' : '#ff4757'} fill="url(#colorBalance)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Recent Trades */}
              <Card title="Recent Trades" subtitle={`Last ${result.trades.length} trades`}>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {result.trades.slice(-15).reverse().map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${trade.side === 'buy' ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span className="text-xs text-gray-300 font-medium">{trade.pair}</span>
                        <span className={`text-xs px-1.5 rounded ${trade.side === 'buy' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{trade.side}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-semibold ${(trade.profit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(trade.profit || 0) >= 0 ? '+' : ''}{formatCurrency(trade.profit || 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <div className="glass rounded-xl p-12 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-cyan-400/30" />
              <p className="text-gray-500 text-sm">Configure and run a simulation to see results</p>
              <p className="text-gray-600 text-xs mt-1">AI agents will execute trades based on your selected strategy</p>
            </div>
          )}

          {/* Previous Simulations */}
          {previousSims.length > 0 && (
            <Card title="Previous Simulations">
              <div className="space-y-2">
                {previousSims.map((sim) => (
                  <div key={sim.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{sim.strategy}</span>
                      <span className="text-xs text-gray-600">{sim.totalTrades} trades</span>
                      <span className="text-xs text-gray-600">{sim.winRate.toFixed(1)}% WR</span>
                    </div>
                    <span className={`text-xs font-semibold ${sim.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {sim.pnl >= 0 ? '+' : ''}{formatCurrency(sim.pnl)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
