'use server'

import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { SearchClient } from '@upstash/search'
import type { RAGResponse, SearchResult, ModelOption } from '@/lib/types'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const searchClient = new SearchClient({
  url: process.env.UPSTASH_SEARCH_REST_URL!,
  token: process.env.UPSTASH_SEARCH_REST_TOKEN!,
})

export async function queryRAG(
  query: string,
  model: ModelOption = 'llama-3.1-8b-instant'
): Promise<RAGResponse> {
  try {
    // Query Upstash Search for relevant context
    const searchResults = await searchClient.search({
      query,
      topK: 3,
    })

    // Transform search results
    const sources: SearchResult[] = searchResults.map((result, index) => ({
      id: result.id || `source-${index}`,
      content: result.metadata?.text as string || result.metadata?.content as string || JSON.stringify(result.metadata) || 'No content available',
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
