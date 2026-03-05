'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Bot, Plus, Zap, Brain, TrendingUp, Settings2, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Agent {
  id: string
  name: string
  type: string
  model: string
  description: string
  isActive: boolean
  winRate: number
  totalTrades: number
  icon: React.ReactNode
}

const DEFAULT_AGENTS: Agent[] = [
  {
    id: '1',
    name: 'Momentum Hunter',
    type: 'momentum',
    model: 'claude-3.5-haiku',
    description: 'Identifies and follows strong market trends using momentum indicators. Focuses on breakout patterns and volume confirmation.',
    isActive: true,
    winRate: 58.3,
    totalTrades: 142,
    icon: <TrendingUp className="w-4 h-4" />,
  },
  {
    id: '2',
    name: 'Arbitrage Scout',
    type: 'arbitrage',
    model: 'claude-3.5-sonnet',
    description: 'Scans multiple exchanges for price discrepancies. Executes rapid cross-market arbitrage opportunities with minimal risk.',
    isActive: true,
    winRate: 72.1,
    totalTrades: 89,
    icon: <Zap className="w-4 h-4" />,
  },
  {
    id: '3',
    name: 'Sentiment Analyst',
    type: 'sentiment',
    model: 'claude-3.5-sonnet',
    description: 'Analyzes on-chain data, social sentiment, and news feeds to predict market direction.',
    isActive: false,
    winRate: 54.7,
    totalTrades: 67,
    icon: <Brain className="w-4 h-4" />,
  },
]

export function AgentPanel() {
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const [newAgent, setNewAgent] = useState({
    name: '',
    type: 'momentum',
    model: 'anthropic/claude-3.5-sonnet',
    description: '',
    systemPrompt: '',
  })

  const toggleAgent = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    )
  }

  const addAgent = () => {
    if (!newAgent.name) return
    const agent: Agent = {
      id: Date.now().toString(),
      name: newAgent.name,
      type: newAgent.type,
      model: newAgent.model,
      description: newAgent.description || 'Custom trading agent',
      isActive: false,
      winRate: 0,
      totalTrades: 0,
      icon: <Bot className="w-4 h-4" />,
    }
    setAgents((prev) => [...prev, agent])
    setCreatingNew(false)
    setNewAgent({ name: '', type: 'momentum', model: 'anthropic/claude-3.5-sonnet', description: '', systemPrompt: '' })
  }

  const agentTypes = ['momentum', 'arbitrage', 'sentiment', 'scalping', 'mean_reversion', 'custom']
  const models = [
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3-5-haiku',
    'google/gemini-flash-1.5',
    'openai/gpt-4o-mini',
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-cyan-400">AI Trading Agents</h2>
          <p className="text-sm text-gray-500 mt-1">Configure and manage autonomous trading agents</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setCreatingNew(true)}>
          <Plus className="w-3 h-3" /> New Agent
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl p-3 border border-white/10">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Agents</div>
          <div className="text-xl font-bold text-cyan-400">{agents.length}</div>
        </div>
        <div className="glass rounded-xl p-3 border border-white/10">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Active</div>
          <div className="text-xl font-bold text-green-400">{agents.filter((a) => a.isActive).length}</div>
        </div>
        <div className="glass rounded-xl p-3 border border-white/10">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Avg Win Rate</div>
          <div className="text-xl font-bold text-yellow-400">
            {agents.length > 0 ? (agents.reduce((sum, a) => sum + a.winRate, 0) / agents.length).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* Create New Agent */}
      {creatingNew && (
        <div className="glass-strong rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-cyan-400">New Trading Agent</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Agent Name</label>
              <input
                value={newAgent.name}
                onChange={(e) => setNewAgent((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Trend Follower"
                className="w-full bg-black/40 border border-white/10 rounded-lg text-xs text-gray-300 px-3 py-2 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Type</label>
              <select
                value={newAgent.type}
                onChange={(e) => setNewAgent((p) => ({ ...p, type: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg text-xs text-gray-300 px-3 py-2"
              >
                {agentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Model</label>
            <select
              value={newAgent.model}
              onChange={(e) => setNewAgent((p) => ({ ...p, model: e.target.value }))}
              className="w-full bg-black/40 border border-white/10 rounded-lg text-xs text-gray-300 px-3 py-2"
            >
              {models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea
              value={newAgent.description}
              onChange={(e) => setNewAgent((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe this agent's trading strategy..."
              rows={2}
              className="w-full bg-black/40 border border-white/10 rounded-lg text-xs text-gray-300 px-3 py-2 resize-none focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={addAgent}>Create Agent</Button>
            <Button variant="ghost" size="sm" onClick={() => setCreatingNew(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Agent Cards */}
      <div className="space-y-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={cn(
              'glass rounded-xl overflow-hidden transition-all',
              agent.isActive ? 'border border-cyan-500/20' : 'border border-white/5 opacity-70'
            )}
          >
            <div className="flex items-center gap-4 p-4">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                agent.isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-500'
              )}>
                {agent.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-200">{agent.name}</span>
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full',
                    agent.isActive ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-500'
                  )}>
                    {agent.isActive ? 'active' : 'idle'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-500">{agent.type}</span>
                  <span className="text-xs text-gray-600">{agent.model.split('/')[1] || agent.model}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                {agent.totalTrades > 0 && (
                  <div className="text-right">
                    <div className="text-xs font-semibold text-green-400">{agent.winRate.toFixed(1)}%</div>
                    <div className="text-xs text-gray-600">{agent.totalTrades} trades</div>
                  </div>
                )}
                <button
                  onClick={() => toggleAgent(agent.id)}
                  className={cn(
                    'relative w-10 h-5 rounded-full transition-colors',
                    agent.isActive ? 'bg-cyan-500/40' : 'bg-white/10'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full transition-all',
                    agent.isActive ? 'left-5 bg-cyan-400' : 'left-0.5 bg-gray-500'
                  )} />
                </button>
                <button
                  onClick={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {expandedId === agent.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {expandedId === agent.id && (
              <div className="px-4 pb-4 border-t border-white/5 pt-3">
                <p className="text-xs text-gray-400 leading-relaxed">{agent.description}</p>
                <div className="flex gap-2 mt-3">
                  <Button variant="ghost" size="sm">
                    <Settings2 className="w-3 h-3" /> Configure
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Card */}
      <Card title="How DeFAI Agents Work">
        <div className="space-y-2 text-xs text-gray-400">
          <p>• Each agent uses an LLM to analyze market conditions and make trading decisions</p>
          <p>• Agents communicate via structured prompts with market data, portfolio state, and strategy rules</p>
          <p>• Multiple agents can run in parallel with different risk profiles</p>
          <p>• All trades in this environment are simulated — no real funds are used</p>
          <p className="text-yellow-400/80">⚠ DeFAI is experimental. Always verify strategies before live trading.</p>
        </div>
      </Card>
    </div>
  )
}
