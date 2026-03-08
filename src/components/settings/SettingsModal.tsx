'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, Key, Cpu, Palette, Layout, Database, CheckCircle, XCircle, Eye, EyeOff, Loader } from 'lucide-react'
import { cn } from '@/lib/utils'

type SettingsTab = 'api' | 'models' | 'appearance' | 'layout' | 'data'

interface Settings {
  openrouterApiKey?: string
  primaryModel: string
  reasoningModel: string
  documentModel: string
  currency: string
  themeColor: string
  themeBackground: string
  themeMode: string
  sidebarPosition: string
  chatPanelPosition: string
  chatPanelWidth: number
}

const MODELS = [
  { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', tier: 'premium' },
  { value: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku', tier: 'fast' },
  { value: 'google/gemini-flash-1.5', label: 'Gemini 1.5 Flash', tier: 'fast' },
  { value: 'openai/gpt-4o', label: 'GPT-4o', tier: 'premium' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', tier: 'fast' },
  { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', tier: 'open' },
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF']

export function SettingsModal() {
  const { settingsOpen, setSettingsOpen } = useAppStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('api')
  const [settings, setSettings] = useState<Settings>({
    primaryModel: 'anthropic/claude-3.5-sonnet',
    reasoningModel: 'anthropic/claude-3.5-haiku',
    documentModel: 'google/gemini-flash-1.5',
    currency: 'USD',
    themeColor: 'cyan',
    themeBackground: '#0a0a0f',
    themeMode: 'dark',
    sidebarPosition: 'left',
    chatPanelPosition: 'right',
    chatPanelWidth: 380,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    if (settingsOpen) loadSettings()
  }, [settingsOpen])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      setSettings({
        openrouterApiKey: data.openrouterApiKey || '',
        primaryModel: data.primaryModel || 'anthropic/claude-3.5-sonnet',
        reasoningModel: data.reasoningModel || 'anthropic/claude-3.5-haiku',
        documentModel: data.documentModel || 'google/gemini-flash-1.5',
        currency: data.currency || 'USD',
        themeColor: data.themeColor || 'cyan',
        themeBackground: data.themeBackground || '#0a0a0f',
        themeMode: data.themeMode || 'dark',
        sidebarPosition: data.sidebarPosition || 'left',
        chatPanelPosition: data.chatPanelPosition || 'right',
        chatPanelWidth: data.chatPanelWidth || 380,
      })
    } catch {
      // Use defaults
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // Silently fail
    } finally {
      setSaving(false)
    }
  }

  const testApiKey = async () => {
    if (!settings.openrouterApiKey) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: settings.openrouterApiKey }),
      })
      const data = await res.json()
      setTestResult({
        valid: data.valid,
        message: data.valid
          ? `✓ Connected! ${data.modelCount} models available`
          : `✗ ${data.error || 'Invalid API key'}`,
      })
    } catch {
      setTestResult({ valid: false, message: '✗ Connection failed' })
    } finally {
      setTesting(false)
    }
  }

  if (!settingsOpen) return null

  const tabs = [
    { id: 'api' as SettingsTab, label: 'API Keys', icon: Key },
    { id: 'models' as SettingsTab, label: 'Models', icon: Cpu },
    { id: 'appearance' as SettingsTab, label: 'Appearance', icon: Palette },
    { id: 'layout' as SettingsTab, label: 'Layout', icon: Layout },
    { id: 'data' as SettingsTab, label: 'Data', icon: Database },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
      <div className="relative w-full max-w-2xl max-h-[85vh] glass-strong rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/10">
          <h2 className="text-lg font-bold text-cyan-400">Settings</h2>
          <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Tab Nav */}
          <div className="w-36 border-r border-white/5 p-2 flex-shrink-0">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors mb-1',
                  activeTab === id
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'api' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-1">OpenRouter API Key</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Required for AI chat features. Get your key at{' '}
                    <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                      openrouter.ai
                    </a>
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type={showKey ? 'text' : 'password'}
                      placeholder="sk-or-..."
                      value={settings.openrouterApiKey || ''}
                      onChange={(e) => setSettings((p) => ({ ...p, openrouterApiKey: e.target.value }))}
                      suffix={
                        <button onClick={() => setShowKey(!showKey)}>
                          {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      }
                      className="flex-1"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={testApiKey}
                      loading={testing}
                      disabled={!settings.openrouterApiKey}
                    >
                      Test
                    </Button>
                  </div>
                  {testResult && (
                    <div className={cn(
                      'flex items-center gap-2 mt-2 text-xs p-2 rounded-lg',
                      testResult.valid ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    )}>
                      {testResult.valid ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {testResult.message}
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-xs text-gray-400 space-y-1">
                  <p className="font-semibold text-yellow-400">Security Note</p>
                  <p>Your API key is stored locally in SQLite. It is never sent to external servers except OpenRouter.</p>
                </div>
              </div>
            )}

            {activeTab === 'models' && (
              <div className="space-y-4">
                {[
                  { key: 'primaryModel' as keyof Settings, label: 'Primary Model', desc: 'Main AI for chat and analysis' },
                  { key: 'reasoningModel' as keyof Settings, label: 'Reasoning Model', desc: 'Fast model for quick tasks' },
                  { key: 'documentModel' as keyof Settings, label: 'Document Model', desc: 'For processing documents' },
                ].map(({ key, label, desc }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">{label}</label>
                    <p className="text-xs text-gray-600 mb-2">{desc}</p>
                    <select
                      value={settings[key] as string}
                      onChange={(e) => setSettings((p) => ({ ...p, [key]: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg text-xs text-gray-300 px-3 py-2 focus:outline-none focus:border-cyan-500/50"
                    >
                      {MODELS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label} ({m.tier})
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Currency</label>
                  <div className="flex flex-wrap gap-2">
                    {CURRENCIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSettings((p) => ({ ...p, currency: c }))}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs border transition-colors',
                          settings.currency === c
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Accent Color</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'cyan', color: '#00e5ff' },
                      { id: 'green', color: '#00ff88' },
                      { id: 'purple', color: '#a855f7' },
                      { id: 'orange', color: '#f97316' },
                    ].map(({ id, color }) => (
                      <button
                        key={id}
                        onClick={() => setSettings((p) => ({ ...p, themeColor: id }))}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-all',
                          settings.themeColor === id ? 'border-white scale-110' : 'border-transparent'
                        )}
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Background</label>
                  <Input
                    type="color"
                    value={settings.themeBackground}
                    onChange={(e) => setSettings((p) => ({ ...p, themeBackground: e.target.value }))}
                    className="h-10 w-full"
                  />
                </div>
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Sidebar Position</label>
                  <div className="flex gap-2">
                    {['left', 'right'].map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setSettings((p) => ({ ...p, sidebarPosition: pos }))}
                        className={cn(
                          'px-4 py-2 rounded-lg text-xs border transition-colors capitalize',
                          settings.sidebarPosition === pos
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        )}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Chat Panel Position</label>
                  <div className="flex gap-2">
                    {['left', 'right'].map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setSettings((p) => ({ ...p, chatPanelPosition: pos }))}
                        className={cn(
                          'px-4 py-2 rounded-lg text-xs border transition-colors capitalize',
                          settings.chatPanelPosition === pos
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        )}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">
                    Chat Panel Width: {settings.chatPanelWidth}px
                  </label>
                  <input
                    type="range"
                    min="280"
                    max="520"
                    step="20"
                    value={settings.chatPanelWidth}
                    onChange={(e) => setSettings((p) => ({ ...p, chatPanelWidth: parseInt(e.target.value) }))}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-white/3 border border-white/10 space-y-2">
                  <h4 className="text-xs font-semibold text-gray-300">Database Info</h4>
                  <p className="text-xs text-gray-500">SQLite database stored locally at: <code className="text-cyan-400/70">prisma/dev.db</code></p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Danger Zone</h4>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={async () => {
                        if (confirm('Delete all transactions? This cannot be undone.')) {
                          await fetch('/api/transactions?ids=all', { method: 'DELETE' })
                        }
                      }}
                    >
                      Clear All Transactions
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/5">
          <span className="text-xs text-gray-600">Changes saved to local database</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={saveSettings} loading={saving}>
              {saved ? (
                <><CheckCircle className="w-3 h-3" /> Saved!</>
              ) : saving ? (
                <><Loader className="w-3 h-3 animate-spin" /> Saving...</>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
