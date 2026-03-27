export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: SearchResult[]
  model?: string
  timestamp: Date
}

export interface SearchResult {
  id: string
  content: string
  metadata: Record<string, unknown>
  score: number
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

export interface RAGResponse {
  answer: string
  sources: SearchResult[]
  model: string
}

export type ModelOption = 'llama-3.1-8b-instant' | 'llama-3.1-70b-versatile'

export const MODEL_LABELS: Record<ModelOption, string> = {
  'llama-3.1-8b-instant': 'Llama 3.1 8B (Fast)',
  'llama-3.1-70b-versatile': 'Llama 3.1 70B (Powerful)',
}
