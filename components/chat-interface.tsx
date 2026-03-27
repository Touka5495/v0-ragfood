'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage } from '@/components/chat-message'
import { ChatInput } from '@/components/chat-input'
import { SourcesPanel } from '@/components/sources-panel'
import { ExampleQueries } from '@/components/example-queries'
import { ChatSidebar } from '@/components/chat-sidebar'
import { queryRAG } from '@/app/actions'
import type { ChatMessage as ChatMessageType, ChatSession, SearchResult, ModelOption } from '@/lib/types'
import { Menu, ChefHat, PanelRightOpen, PanelRightClose } from 'lucide-react'
import { toast } from 'sonner'

function generateId() {
  return Math.random().toString(36).substring(2, 15)
}

function generateTitle(message: string): string {
  const words = message.split(' ').slice(0, 5).join(' ')
  return words.length < message.length ? `${words}...` : words
}

export function ChatInterface() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentSources, setCurrentSources] = useState<SearchResult[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const currentSession = sessions.find((s) => s.id === currentSessionId)
  const messages = currentSession?.messages || []

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Close sources panel on mobile by default
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 1024) {
        setSourcesOpen(false)
      } else {
        setSourcesOpen(true)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setSessions((prev) => [newSession, ...prev])
    setCurrentSessionId(newSession.id)
    setCurrentSources([])
    setSidebarOpen(false)
  }, [])

  const handleSubmit = async (content: string, model: ModelOption) => {
    let sessionId = currentSessionId

    // Create new session if none exists
    if (!sessionId) {
      const newSession: ChatSession = {
        id: generateId(),
        title: generateTitle(content),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setSessions((prev) => [newSession, ...prev])
      sessionId = newSession.id
      setCurrentSessionId(sessionId)
    }

    const userMessage: ChatMessageType = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    // Add user message
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: [...s.messages, userMessage],
              title: s.messages.length === 0 ? generateTitle(content) : s.title,
              updatedAt: new Date(),
            }
          : s
      )
    )

    setIsLoading(true)
    setCurrentSources([])

    try {
      const response = await queryRAG(content, model)

      const assistantMessage: ChatMessageType = {
        id: generateId(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        model: response.model,
        timestamp: new Date(),
      }

      setCurrentSources(response.sources)

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: [...s.messages, assistantMessage],
                updatedAt: new Date(),
              }
            : s
        )
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to get response'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleSelect = (query: string) => {
    handleSubmit(query, 'llama-3.1-8b-instant')
  }

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    if (currentSessionId === id) {
      setCurrentSessionId(sessions.length > 1 ? sessions.find((s) => s.id !== id)?.id || null : null)
      setCurrentSources([])
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={createNewSession}
        onSelectSession={(id) => {
          setCurrentSessionId(id)
          const session = sessions.find((s) => s.id === id)
          const lastAssistantMsg = session?.messages
            .filter((m) => m.role === 'assistant')
            .pop()
          setCurrentSources(lastAssistantMsg?.sources || [])
          setSidebarOpen(false)
        }}
        onDeleteSession={handleDeleteSession}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="font-semibold truncate">
              {currentSession?.title || 'Culinary AI Chat'}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSourcesOpen(!sourcesOpen)}
            className="hidden md:flex items-center gap-2"
          >
            {sourcesOpen ? (
              <>
                <PanelRightClose className="h-4 w-4" />
                <span className="text-sm">Hide Sources</span>
              </>
            ) : (
              <>
                <PanelRightOpen className="h-4 w-4" />
                <span className="text-sm">Show Sources</span>
              </>
            )}
          </Button>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Chat area */}
          <div className="flex-1 flex flex-col min-w-0">
            <ScrollArea className="flex-1" ref={scrollRef}>
              <div className="max-w-3xl mx-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 py-12">
                    <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <ChefHat className="h-10 w-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold text-balance">
                        Welcome to Culinary AI
                      </h2>
                      <p className="text-muted-foreground max-w-md text-balance">
                        Your intelligent food discovery assistant. Ask me about recipes, 
                        cooking techniques, ingredients, or cuisines from around the world.
                      </p>
                    </div>
                    <ExampleQueries
                      onSelect={handleExampleSelect}
                      disabled={isLoading}
                    />
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <ChatMessage key={message.id} message={message} />
                    ))}
                    {isLoading && (
                      <div className="flex gap-4 p-4 rounded-xl bg-card border border-border">
                        <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center">
                          <ChefHat className="h-5 w-5 text-accent-foreground animate-pulse" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                          <div className="space-y-2">
                            <div className="h-3 bg-muted rounded w-full animate-pulse" />
                            <div className="h-3 bg-muted rounded w-5/6 animate-pulse" />
                            <div className="h-3 bg-muted rounded w-4/6 animate-pulse" />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4 shrink-0">
              <div className="max-w-3xl mx-auto">
                <ChatInput
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Sources panel */}
          {sourcesOpen && (
            <aside className="hidden md:block w-80 border-l border-border bg-card/30 p-4 shrink-0 overflow-hidden">
              <SourcesPanel sources={currentSources} isLoading={isLoading} />
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
