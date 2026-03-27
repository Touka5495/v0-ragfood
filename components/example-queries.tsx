'use client'

import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

interface ExampleQueriesProps {
  onSelect: (query: string) => void
  disabled?: boolean
}

const EXAMPLE_QUERIES = [
  {
    title: 'Mediterranean Diet',
    query: 'What are some healthy Mediterranean diet options for dinner?',
  },
  {
    title: 'Spicy Thai',
    query: 'Tell me about popular spicy Thai dishes and their key ingredients',
  },
  {
    title: 'Quick Pasta',
    query: 'What are some quick and easy pasta recipes for weeknight dinners?',
  },
  {
    title: 'Baking Basics',
    query: 'What are the essential techniques for baking perfect bread?',
  },
]

export function ExampleQueries({ onSelect, disabled }: ExampleQueriesProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>Try an example query</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_QUERIES.map((example) => (
          <Button
            key={example.title}
            variant="outline"
            size="sm"
            onClick={() => onSelect(example.query)}
            disabled={disabled}
            className="rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
          >
            {example.title}
          </Button>
        ))}
      </div>
    </div>
  )
}
