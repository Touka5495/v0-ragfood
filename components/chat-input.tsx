'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Send, Loader2 } from 'lucide-react'
import type { ModelOption } from '@/lib/types'
import { MODEL_LABELS } from '@/lib/types'

interface ChatInputProps {
  onSubmit: (message: string, model: ModelOption) => void
  isLoading: boolean
  disabled?: boolean
}

export function ChatInput({ onSubmit, isLoading, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [model, setModel] = useState<ModelOption>('llama-3.1-8b-instant')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [message])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSubmit(message.trim(), model)
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about recipes, ingredients, cooking techniques..."
            className="min-h-[52px] max-h-[150px] resize-none pr-4 rounded-xl bg-card border-border focus-visible:ring-primary"
            disabled={isLoading || disabled}
          />
        </div>
        <Button
          type="submit"
          size="icon"
          className="h-[52px] w-[52px] rounded-xl shrink-0"
          disabled={!message.trim() || isLoading || disabled}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      <div className="flex items-center justify-between">
        <Select
          value={model}
          onValueChange={(value) => setModel(value as ModelOption)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[200px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(MODEL_LABELS) as [ModelOption, string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        
        <span className="text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </span>
      </div>
    </form>
  )
}
