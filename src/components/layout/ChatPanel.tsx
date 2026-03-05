'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Send, Plus, Trash2, ChevronRight, Bot, User, AlertCircle, X } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  updatedAt: Date
}

export function ChatPanel({ section = 'personal' }: { section?: string }) {
  const { chatPanelOpen, setChatPanelOpen, currentChatSessionId, setCurrentChatSessionId } = useAppStore()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSessions, setShowSessions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    loadSessions()
  }, [section]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentChatSessionId) {
      loadSession(currentChatSessionId)
    }
  }, [currentChatSessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadSessions = async () => {
    try {
      const res = await fetch(`/api/chat?section=${section}`)
      const data = await res.json()
      setSessions(data)
    } catch {
      // Silently fail
    }
  }

  const loadSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`)
      const data = await res.json()
      if (data) {
        setCurrentSession(data)
        setMessages(data.messages || [])
      }
    } catch {
      // Silently fail
    }
  }

  const createNewSession = async () => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_session', section, title: 'New Chat' }),
      })
      const session = await res.json()
      setCurrentSession(session)
      setMessages([])
      setCurrentChatSessionId(session.id)
      await loadSessions()
    } catch {
      setError('Failed to create chat session')
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    setError(null)

    let sessionId = currentChatSessionId || currentSession?.id
    if (!sessionId) {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_session', section }),
      })
      const session = await res.json()
      sessionId = session.id
      setCurrentSession(session)
      setCurrentChatSessionId(session.id)
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Save user message
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_message', sessionId, role: 'user', content: userMessage.content }),
      })
    } catch {
      // Continue even if save fails
    }

    // Stream AI response
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      const allMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages, sessionId, section }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to get AI response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
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
                if (parsed.content) {
                  fullContent += parsed.content
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: fullContent } : m))
                  )
                }
              } catch {
                // Skip
              }
            }
          }
        }
      }

      // Update session title if first message
      if (messages.length === 0 && sessionId) {
        const title = userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? '...' : '')
        await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_title', sessionId, title }),
        })
        await loadSessions()
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get AI response'
      setError(errorMsg)
      setMessages((prev) => prev.filter((m) => m.id !== assistantMessage.id))
    } finally {
      setLoading(false)
    }
  }

  const deleteSession = async (id: string) => {
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_session', sessionId: id }),
    })
    if (currentSession?.id === id) {
      setCurrentSession(null)
      setMessages([])
      setCurrentChatSessionId(null)
    }
    await loadSessions()
  }

  if (!chatPanelOpen) return null

  return (
    <div className="w-80 flex flex-col h-screen sticky top-0 glass border-l border-cyan-500/10">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-cyan-500/10">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-cyan-400">AXIOM AI</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setShowSessions(!showSessions)}>
            <ChevronRight className={cn('w-3 h-3 transition-transform', showSessions && 'rotate-90')} />
          </Button>
          <Button variant="ghost" size="sm" onClick={createNewSession}>
            <Plus className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setChatPanelOpen(false)}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Session List */}
      {showSessions && sessions.length > 0 && (
        <div className="border-b border-cyan-500/10 max-h-40 overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                'flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors',
                currentSession?.id === session.id && 'bg-cyan-500/10'
              )}
              onClick={() => {
                setCurrentChatSessionId(session.id)
                setShowSessions(false)
              }}
            >
              <span className="text-xs text-gray-400 truncate flex-1">{session.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteSession(session.id) }}
                className="text-gray-600 hover:text-red-400 ml-2 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Ask Axiom anything about your finances</p>
            <div className="mt-4 space-y-2">
              {[
                'Analyze my spending patterns',
                'How can I save more money?',
                'Set up a budget for me',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="block w-full text-left text-xs text-cyan-500/60 hover:text-cyan-400 px-2 py-1.5 rounded border border-cyan-500/10 hover:border-cyan-500/30 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn('flex gap-2', message.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {message.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3 h-3 text-cyan-400" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed',
                message.role === 'user'
                  ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30'
                  : 'bg-white/5 text-gray-300 border border-white/10'
              )}
            >
              {message.role === 'assistant' && loading && !message.content ? (
                <span className="flex gap-1">
                  <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              ) : (
                <div className="whitespace-pre-wrap">{message.content}</div>
              )}
            </div>
            {message.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3 h-3 text-gray-400" />
              </div>
            )}
          </div>
        ))}

        {error && (
          <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg p-2 border border-red-500/20">
            <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-cyan-500/10">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Ask Axiom..."
            rows={2}
            className="flex-1 bg-black/40 border border-white/10 rounded-lg text-xs text-gray-200 px-3 py-2 resize-none focus:outline-none focus:border-cyan-500/50 placeholder:text-gray-600"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="self-end"
          >
            <Send className="w-3 h-3" />
          </Button>
        </div>
        <p className="text-xs text-gray-700 mt-1">⏎ send · Shift+⏎ newline</p>
      </div>
    </div>
  )
}
