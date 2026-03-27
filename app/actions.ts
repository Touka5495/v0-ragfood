'use server'

import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { Index } from '@upstash/vector'

// Type definitions
interface SearchResult {
  id: string
  content: string
  metadata: Record<string, unknown>
  score: number
}

interface RAGResponse {
  answer: string
  sources: SearchResult[]
  model: string
}

type ModelOption = 'llama-3.1-8b-instant' | 'llama-3.1-70b-versatile'

export async function queryRAG(
  query: string,
  model: ModelOption = 'llama-3.1-8b-instant'
): Promise<RAGResponse> {
  console.log('[v0] queryRAG called with:', { query: query.substring(0, 50), model })

  // Check environment variables
  const groqKey = process.env.GROQ_API_KEY
  const upstashUrl = process.env.UPSTASH_VECTOR_REST_URL
  const upstashToken = process.env.UPSTASH_VECTOR_REST_TOKEN

  console.log('[v0] Env check:', {
    hasGroqKey: !!groqKey,
    hasUpstashUrl: !!upstashUrl,
    hasUpstashToken: !!upstashToken,
  })

  if (!groqKey) {
    return {
      answer: 'Configuration error: GROQ_API_KEY is not set. Please add it to your environment variables.',
      sources: [],
      model,
    }
  }

  if (!upstashUrl || !upstashToken) {
    return {
      answer: 'Configuration error: Upstash Vector credentials are not set. Please configure UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN.',
      sources: [],
      model,
    }
  }

  let sources: SearchResult[] = []

  // Step 1: Query Upstash Vector for context
  try {
    console.log('[v0] Creating Upstash index...')
    const index = new Index({
      url: upstashUrl,
      token: upstashToken,
    })

    console.log('[v0] Querying vector database...')
    const queryResults = await index.query({
      data: query,
      topK: 3,
      includeMetadata: true,
    })

    console.log('[v0] Query results count:', queryResults?.length ?? 0)

    // Transform results to plain objects
    if (queryResults && queryResults.length > 0) {
      sources = queryResults.map((result, idx) => {
        const rawContent = result.metadata?.text ?? result.metadata?.content ?? ''
        const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent || {})
        
        // Create a clean metadata object
        const cleanMetadata: Record<string, unknown> = {}
        if (result.metadata) {
          for (const [key, value] of Object.entries(result.metadata)) {
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
              cleanMetadata[key] = value
            } else if (value !== null && value !== undefined) {
              cleanMetadata[key] = String(value)
            }
          }
        }

        return {
          id: String(result.id ?? `source-${idx}`),
          content: content || 'No content available',
          metadata: cleanMetadata,
          score: typeof result.score === 'number' ? result.score : 0,
        }
      })
    }

    console.log('[v0] Sources transformed:', sources.length)
  } catch (err) {
    console.error('[v0] Vector query error:', err instanceof Error ? err.message : err)
    // Continue without sources
  }

  // Step 2: Generate response with Groq
  try {
    console.log('[v0] Creating Groq client...')
    const groq = createGroq({ apiKey: groqKey })

    const contextText = sources.length > 0
      ? sources.map((s, i) => `[Source ${i + 1}]: ${s.content}`).join('\n\n')
      : 'No specific context available.'

    const systemPrompt = `You are a knowledgeable culinary assistant specializing in food, recipes, cooking techniques, and cuisines from around the world.

Use the provided context to answer questions. If the context contains relevant information, incorporate it. If not, use your general knowledge about food and cooking.

Context from knowledge base:
${contextText}

Guidelines:
- Provide accurate, helpful information about food and cooking
- Include specific measurements and temperatures when relevant
- Mention dietary considerations when appropriate
- Be friendly and encouraging`

    console.log('[v0] Calling Groq with model:', model)
    const { text } = await generateText({
      model: groq(model),
      system: systemPrompt,
      prompt: query,
      maxTokens: 1024,
      temperature: 0.7,
    })

    console.log('[v0] Response received, length:', text?.length ?? 0)

    return {
      answer: text || 'No response generated.',
      sources,
      model,
    }
  } catch (err) {
    console.error('[v0] Groq error:', err instanceof Error ? err.message : err)
    return {
      answer: `Error generating response: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
      sources,
      model,
    }
  }
}
