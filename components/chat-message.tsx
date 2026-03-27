'use client'

import { cn } from '@/lib/utils'
import type { ChatMessage as ChatMessageType } from '@/lib/types'
import { User, Bot, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex gap-4 p-4 rounded-xl',
        isUser 
          ? 'bg-secondary/50' 
          : 'bg-card border border-border'
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-accent text-accent-foreground'
        )}
      >
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>
      
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">
            {isUser ? 'You' : 'Culinary AI'}
          </span>
          {message.model && !isUser && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {message.model.includes('70b') ? 'Llama 70B' : 'Llama 8B'}
            </span>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(message.timestamp), 'h:mm a')}
          </span>
        </div>
        
        <div className="prose prose-sm max-w-none text-foreground">
          <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
        </div>
      </div>
    </div>
  )
}
