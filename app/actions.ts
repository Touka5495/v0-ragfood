'use server'

import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { Index } from '@upstash/vector'
import type { RAGResponse, SearchResult, ModelOption } from '@/lib/types'

// Lazy initialization to avoid module-level errors
function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set')
  }
  return createGroq({ apiKey })
}

function getVectorIndex() {
  const url = process.env.UPSTASH_VECTOR_REST_URL
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN
  if (!url || !token) {
    throw new Error('Upstash Vector environment variables are not set')
  }
  return new Index({ url, token })
}

export async function queryRAG(
  query: string,
  model: ModelOption = 'llama-3.1-8b-instant'
): Promise<RAGResponse> {
  try {
    const index = getVectorIndex()
    
    // Query Upstash Vector for relevant context using semantic search
    const queryResults = await index.query({
      data: query,
      topK: 3,
      includeMetadata: true,
    })

    // Transform search results
    const sources: SearchResult[] = queryResults.map((result, idx) => ({
      id: String(result.id) || `source-${idx}`,
      content: (result.metadata?.text as string) || (result.metadata?.content as string) || JSON.stringify(result.metadata) || 'No content available',
      metadata: result.metadata || {},
      score: result.score || 0,
    }))

    // Build context from search results
    const context = sources
      .map((source, i) => `[Source ${i + 1}]: ${source.content}`)
      .join('\n\n')

    // Generate response using Groq
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

    const groq = getGroqClient()
    const { text } = await generateText({
      model: groq(model),
      system: systemPrompt,
      prompt: query,
      maxTokens: 1024,
      temperature: 0.7,
    })

    return {
      answer: text,
      sources,
      model,
    }
  } catch (error) {
    console.error('RAG query error:', error)
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to process your question. Please try again.'
    )
  }
}
