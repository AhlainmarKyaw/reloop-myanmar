type AnalysisSource = 'openai' | 'demo'

type Analysis = {
  itemName: string
  category: string
  brand: string
  possibleModel: string
  modelConfidence: number
  condition: string
  conditionConfidence: number
  visibleObservations: string[]
  possibleDefects: string[]
  suggestedPriceMin: number
  suggestedPriceMax: number
  pricingBasis: string
  title: string
  description: string
  trustObservations: string[]
  buyerChecks: string[]
  environmentalImpact: string
  estimatedWasteAvoidedKg: number
  analysisSource: AnalysisSource
}

const allowedImage = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/
const maxImageBytes = 4 * 1024 * 1024

const schema = {
  name: 'reloop_item_analysis',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'itemName', 'category', 'brand', 'possibleModel', 'modelConfidence',
      'condition', 'conditionConfidence', 'visibleObservations', 'possibleDefects',
      'suggestedPriceMin', 'suggestedPriceMax', 'pricingBasis', 'title',
      'description', 'trustObservations', 'buyerChecks', 'environmentalImpact',
      'estimatedWasteAvoidedKg', 'analysisSource',
    ],
    properties: {
      itemName: { type: 'string' },
      category: { type: 'string' },
      brand: { type: 'string' },
      possibleModel: { type: 'string' },
      modelConfidence: { type: 'number' },
      condition: { type: 'string' },
      conditionConfidence: { type: 'number' },
      visibleObservations: { type: 'array', items: { type: 'string' } },
      possibleDefects: { type: 'array', items: { type: 'string' } },
      suggestedPriceMin: { type: 'number' },
      suggestedPriceMax: { type: 'number' },
      pricingBasis: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string' },
      trustObservations: { type: 'array', items: { type: 'string' } },
      buyerChecks: { type: 'array', items: { type: 'string' } },
      environmentalImpact: { type: 'string' },
      estimatedWasteAvoidedKg: { type: 'number' },
      analysisSource: { type: 'string', enum: ['openai'] },
    },
  },
}

const estimateWasteKg = (category: string) => {
  const value = category.toLowerCase()
  if (/phone|tablet/.test(value)) return 0.4
  if (/computer|laptop/.test(value)) return 2.1
  if (/audio|headphone/.test(value)) return 0.25
  if (/furniture|chair/.test(value)) return 12.5
  if (/bike|bicycle|sport/.test(value)) return 14.2
  if (/appliance|cooker/.test(value)) return 3.4
  if (/cloth|fashion/.test(value)) return 0.5
  if (/book/.test(value)) return 0.6
  return 1
}

const cleanText = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const cleanList = (value: unknown, maxItems = 4) =>
  Array.isArray(value)
    ? value.map(item => cleanText(item, 180)).filter(Boolean).slice(0, maxItems)
    : []

const boundedScore = (value: unknown) =>
  Math.max(0, Math.min(100, Math.round(Number(value) || 0)))

const sanitizeAnalysis = (value: unknown): Analysis | null => {
  if (!value || typeof value !== 'object') return null
  const input = value as Record<string, unknown>
  const itemName = cleanText(input.itemName, 100)
  const category = cleanText(input.category, 60)
  const condition = cleanText(input.condition, 40)
  const title = cleanText(input.title, 120)
  const description = cleanText(input.description, 1000)
  const visibleObservations = cleanList(input.visibleObservations)
  const possibleDefects = cleanList(input.possibleDefects)
  const trustObservations = cleanList(input.trustObservations)
  const buyerChecks = cleanList(input.buyerChecks)
  const suggestedPriceMin = Math.max(0, Math.round(Number(input.suggestedPriceMin)))
  const suggestedPriceMax = Math.max(suggestedPriceMin, Math.round(Number(input.suggestedPriceMax)))

  if (
    !itemName || !category || !condition || !title || !description ||
    visibleObservations.length < 2 || trustObservations.length < 2 ||
    buyerChecks.length < 2 || !Number.isFinite(suggestedPriceMin) ||
    !Number.isFinite(suggestedPriceMax)
  ) return null

  const pricingBasis = cleanText(input.pricingBasis, 400)
  return {
    itemName,
    category,
    brand: cleanText(input.brand, 80) || 'Unknown',
    possibleModel: cleanText(input.possibleModel, 100) || 'Unknown',
    modelConfidence: boundedScore(input.modelConfidence),
    condition,
    conditionConfidence: boundedScore(input.conditionConfidence),
    visibleObservations,
    possibleDefects,
    suggestedPriceMin,
    suggestedPriceMax,
    pricingBasis: pricingBasis || 'AI estimate based on item type and visible condition. No live Myanmar marketplace pricing source was available.',
    title,
    description,
    trustObservations,
    buyerChecks,
    environmentalImpact: `Keeping this ${category.toLowerCase()} item in use may avoid approximately ${estimateWasteKg(category)} kg of waste. Actual impact may vary.`,
    estimatedWasteAvoidedKg: estimateWasteKg(category),
    analysisSource: 'openai',
  }
}

export default async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const apiKey = process.env.AI_API_KEY
  if (!apiKey) return Response.json({ error: 'AI analysis is not configured.' }, { status: 503 })

  try {
    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength > maxImageBytes * 1.5) {
      return Response.json({ error: 'Image payload is too large.' }, { status: 413 })
    }

    const body = await request.json() as { image?: unknown; note?: unknown }
    const image = typeof body.image === 'string' ? body.image : ''
    const imageMatch = image.match(allowedImage)
    if (!imageMatch) {
      return Response.json({ error: 'Use a JPG, PNG, or WEBP image.' }, { status: 400 })
    }
    const estimatedBytes = Math.floor(imageMatch[2].length * 0.75)
    if (estimatedBytes > maxImageBytes) {
      return Response.json({ error: 'Image payload is too large.' }, { status: 413 })
    }
    const note = cleanText(body.note, 1000)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 18000)
    let response: Response
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: process.env.AI_MODEL || 'gpt-4o-mini',
          temperature: 0.1,
          max_tokens: 1400,
          response_format: { type: 'json_schema', json_schema: schema },
          messages: [
            {
              role: 'system',
              content: `You are the vision analysis service for ReLoop Myanmar, a second-hand marketplace.
Analyze only evidence in the supplied photograph and seller note.
- Identify the broad item type and category. Set brand or possibleModel to "Unknown" when unclear.
- Never claim authenticity, ownership, exact age, internal condition, functionality, battery health, safety, or unseen accessories.
- Phrase uncertain details as "appears to be", "possible", or "visible condition suggests".
- visibleObservations must contain only directly visible evidence. possibleDefects must contain only possible visible wear, and may be empty.
- buyerChecks are actions still recommended, adapted to the item category; never imply they were completed.
- Generate a concise title and description using only visible or seller-provided facts. State that functionality cannot be verified from the image where relevant.
- Provide an approximate MMK price range using general product knowledge, item category, possible brand/model, visible condition, and seller note. This is not live market data.
- pricingBasis must explicitly say it is an AI estimate and that no live Myanmar marketplace pricing source was available.
- Do not invent market references or scientific environmental claims.`,
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: `Analyze this uploaded product image. Seller note: ${note || 'No seller note provided.'}` },
                { type: 'image_url', image_url: { url: image, detail: 'high' } },
              ],
            },
          ],
        }),
      })
    } finally {
      clearTimeout(timeout)
    }

    if (!response.ok) {
      console.error('OpenAI analysis request failed', { status: response.status })
      return Response.json({ error: 'AI analysis is temporarily unavailable.' }, { status: 502 })
    }

    const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
    const content = result.choices?.[0]?.message?.content
    if (!content) throw new Error('OpenAI returned no structured content')

    const analysis = sanitizeAnalysis(JSON.parse(content))
    if (!analysis) throw new Error('OpenAI returned malformed analysis')
    return Response.json(analysis)
  } catch (error) {
    const reason = error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'processing_error'
    console.error('OpenAI analysis unavailable', { reason })
    return Response.json({ error: 'AI analysis is temporarily unavailable.' }, { status: 502 })
  }
}
