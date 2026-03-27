'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { ChatSession } from '@/lib/types'
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  ChefHat,
  X 
} from 'lucide-react'
import { format } from 'date-fns'

interface ChatSidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  onNewChat: () => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  isOpen: boolean
  onClose: () => void
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  isOpen,
  onClose,
}: ChatSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <ChefHat className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-sm">Culinary AI</h1>
                <p className="text-xs text-sidebar-foreground/70">Food Discovery</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <Button
            onClick={onNewChat}
            className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Chat history */}
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {sessions.length === 0 ? (
              <p className="text-sm text-sidebar-foreground/50 text-center py-8 px-4">
                No chat history yet. Start a new conversation!
              </p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                    currentSessionId === session.id
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
                  )}
                  onClick={() => onSelectSession(session.id)}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.title}</p>
                    <p className="text-xs opacity-60">
                      {format(new Date(session.updatedAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSession(session.id)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/50 text-center">
            Powered by Groq + Upstash
          </p>
        </div>
      </aside>
    </>
  )
}
