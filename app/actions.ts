'use server'

import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { Index } from '@upstash/vector'

// Type definitions inline to avoid import issues
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
  // Debug: Check environment variables (without exposing full keys)
  const groqKey = process.env.GROQ_API_KEY
  const upstashUrl = process.env.UPSTASH_VECTOR_REST_URL
  const upstashToken = process.env.UPSTASH_VECTOR_REST_TOKEN

  console.log('[v0] Environment check:', {
    hasGroqKey: !!groqKey,
    groqKeyPrefix: groqKey ? groqKey.substring(0, 8) + '...' : 'undefined',
    hasUpstashUrl: !!upstashUrl,
    upstashUrlPrefix: upstashUrl ? upstashUrl.substring(0, 20) + '...' : 'undefined',
    hasUpstashToken: !!upstashToken,
    upstashTokenPrefix: upstashToken ? upstashToken.substring(0, 8) + '...' : 'undefined',
  })

  if (!groqKey) {
    console.error('[v0] GROQ_API_KEY is missing')
    return {
      answer: 'Configuration error: GROQ_API_KEY is not set. Please add it to your environment variables.',
      sources: [],
      model,
    }
  }

  if (!upstashUrl || !upstashToken) {
    console.error('[v0] Upstash Vector credentials missing')
    return {
      answer: 'Configuration error: Upstash Vector credentials are not set. Please configure your Upstash Vector integration.',
      sources: [],
      model,
    }
  }

  let sources: SearchResult[] = []

  // Step 1: Query Upstash Vector
  try {
    console.log('[v0] Creating Upstash Vector index...')
    const index = new Index({
      url: upstashUrl,
      token: upstashToken,
    })

    console.log('[v0] Querying Upstash Vector with:', { query, topK: 3 })
    const queryResults = await index.query({
      data: query,
      topK: 3,
      includeMetadata: true,
    })

    console.log('[v0] Upstash Vector response:', {
      resultCount: queryResults?.length ?? 0,
      results: queryResults?.map(r => ({ id: r.id, score: r.score })),
    })

    // Transform and serialize search results
    sources = (queryResults || []).map((result, idx) => {
      const content = 
        (result.metadata?.text as string) || 
        (result.metadata?.content as string) || 
        (result.metadata ? JSON.stringify(result.metadata) : 'No content available')
      
      return {
        id: String(result.id ?? `source-${idx}`),
        content: String(content),
        metadata: result.metadata ? JSON.parse(JSON.stringify(result.metadata)) : {},
        score: Number(result.score ?? 0),
      }
    })

    console.log('[v0] Transformed sources:', sources.length)
  } catch (vectorError) {
    console.error('[v0] Upstash Vector error:', vectorError)
    // Continue without sources - we can still generate a response
  }

  // Step 2: Generate response using Groq
  try {
    console.log('[v0] Creating Groq client...')
    const groq = createGroq({ apiKey: groqKey })

    const context = sources
      .map((source, i) => `[Source ${i + 1}]: ${source.content}`)
      .join('\n\n')

    const systemPrompt = `You are a knowledgeable culinary assistant specializing in food, recipes, cooking techniques, and cuisines from around the world. 

Use the provided context to answer questions about food and cooking. If the context contains relevant information, incorporate it into your response. If the context doesn't contain relevant information, use your general knowledge about food and cooking to provide a helpful response.

Always be friendly, encouraging, and provide practical cooking tips when appropriate. Format your responses with clear sections when discussing recipes or detailed techniques.

Context from knowledge base:
${context || 'No specific context available for this query.'}

Guidelines:
- Provide accurate, helpful information about food and cooking
- Include specific measurements and temperatures when discussing recipes
- Mention dietary considerations when relevant (allergens, vegetarian options, etc.)
- Suggest ingredient substitutions when appropriate
- Be enthusiastic about food while remaining informative`

    console.log('[v0] Calling Groq generateText with model:', model)
    const { text } = await generateText({
      model: groq(model),
      system: systemPrompt,
      prompt: query,
      maxTokens: 1024,
      temperature: 0.7,
    })

    console.log('[v0] Groq response received, length:', text?.length)

    // Ensure we return plain serializable objects
    return {
      answer: String(text || 'No response generated'),
      sources: sources,
      model: String(model),
    }
  } catch (groqError) {
    console.error('[v0] Groq error:', groqError)
    const errorMessage = groqError instanceof Error ? groqError.message : 'Unknown error'
    return {
      answer: `I encountered an error while generating a response: ${errorMessage}. Please try again.`,
      sources: sources,
      model: String(model),
    }
  }
}
