declare const Netlify: { env: { get(name: string): string | undefined } }

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
      'environmentalImpact', 'estimatedWasteAvoidedKg',
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
      environmentalImpact: { type: 'string' },
      estimatedWasteAvoidedKg: { type: 'number' },
    },
  },
}

export default async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const apiKey = Netlify.env.get('OPENAI_API_KEY')
  if (!apiKey) return Response.json({ error: 'AI is not configured; use demo fallback.' }, { status: 503 })

  try {
    const { image, note } = await request.json() as { image?: string; note?: string }
    if (!image?.startsWith('data:image/')) return Response.json({ error: 'Valid image required' }, { status: 400 })

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: Netlify.env.get('OPENAI_MODEL') || 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_schema', json_schema: schema },
        messages: [
          {
            role: 'system',
            content: 'You analyze second-hand goods for a Myanmar marketplace. Use MMK and conservative prototype market assumptions. Be specific about what is visibly observable, never imply certainty, and include one practical meetup safety check. Environmental impact must be clearly phrased as an estimate.',
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
    return Response.json(JSON.parse(content) as Analysis)
  } catch (error) {
    console.error('AI analysis failed', error)
    return Response.json({ error: 'Analysis unavailable; use demo fallback.' }, { status: 502 })
  }
}
