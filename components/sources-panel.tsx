'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type { SearchResult } from '@/lib/types'
import { FileText, TrendingUp } from 'lucide-react'

interface SourcesPanelProps {
  sources: SearchResult[]
  isLoading?: boolean
}

export function SourcesPanel({ sources, isLoading }: SourcesPanelProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Retrieved Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-5/6" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (sources.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Retrieved Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Sources will appear here when you ask a question.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Retrieved Sources
          <Badge variant="secondary" className="ml-auto">
            {sources.length} found
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4">
            {sources.map((source, index) => (
              <div
                key={source.id}
                className="p-3 rounded-lg bg-secondary/30 border border-border/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary">
                    Source {index + 1}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>{(source.score * 100).toFixed(1)}% match</span>
                  </div>
                </div>
                <p className="text-sm text-foreground line-clamp-4 leading-relaxed">
                  {source.content}
                </p>
                {source.metadata && Object.keys(source.metadata).length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {Object.entries(source.metadata)
                      .filter(([key]) => !['text', 'content'].includes(key))
                      .slice(0, 3)
                      .map(([key, value]) => (
                        <Badge 
                          key={key} 
                          variant="outline" 
                          className="text-xs font-normal"
                        >
                          {key}: {String(value).slice(0, 20)}
                        </Badge>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
