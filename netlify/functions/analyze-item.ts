type Analysis = {
  itemName: string
  category: string
  condition: string
  conditionConfidence: number
  suggestedPriceMin: number
  suggestedPriceMax: number
  title: string
  description: string
  trustObservations: string[]
  buyerChecks: string[]
  environmentalImpact: string
  estimatedWasteAvoidedKg: number
}

const schema = {
  name: 'item_analysis',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'itemName', 'category', 'condition', 'conditionConfidence', 'suggestedPriceMin',
      'suggestedPriceMax', 'title', 'description', 'trustObservations',
      'buyerChecks', 'environmentalImpact', 'estimatedWasteAvoidedKg',
    ],
    properties: {
      itemName: { type: 'string' },
      category: { type: 'string' },
      condition: { type: 'string' },
      conditionConfidence: { type: 'number' },
      suggestedPriceMin: { type: 'number' },
      suggestedPriceMax: { type: 'number' },
      title: { type: 'string' },
      description: { type: 'string' },
      trustObservations: { type: 'array', items: { type: 'string' } },
      buyerChecks: { type: 'array', items: { type: 'string' } },
      environmentalImpact: { type: 'string' },
      estimatedWasteAvoidedKg: { type: 'number' },
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

const cleanText = (value: unknown, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : ''
const sanitizeAnalysis = (value: unknown): Analysis | null => {
  if (!value || typeof value !== 'object') return null
  const input = value as Record<string, unknown>
  const itemName = cleanText(input.itemName, 100)
  const category = cleanText(input.category, 60)
  const condition = cleanText(input.condition, 40)
  const title = cleanText(input.title, 120)
  const description = cleanText(input.description, 1000)
  const trustObservations = Array.isArray(input.trustObservations) ? input.trustObservations.map(item => cleanText(item, 180)).filter(Boolean).slice(0, 4) : []
  const buyerChecks = Array.isArray(input.buyerChecks) ? input.buyerChecks.map(item => cleanText(item, 180)).filter(Boolean).slice(0, 4) : []
  const suggestedPriceMin = Math.max(0, Math.round(Number(input.suggestedPriceMin)))
  const suggestedPriceMax = Math.max(suggestedPriceMin, Math.round(Number(input.suggestedPriceMax)))
  if (!itemName || !category || !condition || !title || !description || trustObservations.length < 2 || buyerChecks.length < 2 || !Number.isFinite(suggestedPriceMin) || !Number.isFinite(suggestedPriceMax)) return null
  return {
    itemName, category, condition, title, description, trustObservations, buyerChecks,
    suggestedPriceMin, suggestedPriceMax,
    conditionConfidence: Math.max(0, Math.min(100, Math.round(Number(input.conditionConfidence) || 0))),
    environmentalImpact: cleanText(input.environmentalImpact, 400) || 'Extending this item’s useful life may help avoid waste.',
    estimatedWasteAvoidedKg: estimateWasteKg(category),
  }
}

export default async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const apiKey = process.env.AI_API_KEY
  if (!apiKey) return Response.json({ error: 'AI is not configured; use demo fallback.' }, { status: 503 })

  try {
    const { image, note } = await request.json() as { image?: string; note?: string }
    if (!image?.startsWith('data:image/')) return Response.json({ error: 'Valid image required' }, { status: 400 })

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_schema', json_schema: schema },
        messages: [
          {
            role: 'system',
            content: 'You analyze second-hand goods for a Myanmar marketplace. Use MMK and conservative prototype assumptions, never claim real-time market data. Only describe details supported by the image or seller note. Use phrases such as appears, visible condition suggests, and cannot be verified where needed. Never claim authenticity, ownership, exact age, internal condition, functionality, battery health, guaranteed safety, or an exact model unless the seller note identifies it. Keep visible observations separate from practical buyer checks. Environmental impact must be clearly phrased as an estimate.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Analyze this item and create a marketplace listing. Seller note: ${note || 'None provided'}` },
              { type: 'image_url', image_url: { url: image, detail: 'low' } },
            ],
          },
        ],
      }),
    })
    if (!response.ok) throw new Error(`AI provider returned ${response.status}`)
    const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
    const content = result.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty AI response')
    const analysis = sanitizeAnalysis(JSON.parse(content))
    if (!analysis) throw new Error('Malformed AI analysis')
    return Response.json(analysis)
  } catch (error) {
    console.error('AI analysis failed', error)
    return Response.json({ error: 'Analysis unavailable; use demo fallback.' }, { status: 502 })
  }
}
