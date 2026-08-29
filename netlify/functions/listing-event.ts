const cleanText = (value: unknown, max = 300) => typeof value === 'string' ? value.trim().slice(0, max) : ''

export default async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) return new Response(null, { status: 204 })

  try {
    const input = await request.json() as Record<string, unknown>
    const event = cleanText(input.event, 40)
    if (event !== 'listing_published' && event !== 'buyer_interest') {
      return Response.json({ error: 'Unsupported event' }, { status: 400 })
    }

    const payload = event === 'listing_published'
      ? {
          event,
          listingId: cleanText(input.listingId, 100),
          title: cleanText(input.title, 120),
          category: cleanText(input.category, 60),
          price: Math.max(0, Number(input.price) || 0),
          location: cleanText(input.location, 80),
          trustScore: Math.max(0, Math.min(100, Number(input.trustScore) || 0)),
          estimatedWasteAvoidedKg: Math.max(0, Number(input.estimatedWasteAvoidedKg) || 0),
          createdAt: cleanText(input.createdAt, 40),
        }
      : {
          event,
          listingId: cleanText(input.listingId, 100),
          listingTitle: cleanText(input.listingTitle, 120),
          buyerName: cleanText(input.buyerName, 100),
          contact: cleanText(input.contact, 160),
          message: cleanText(input.message, 500),
          createdAt: cleanText(input.createdAt, 40),
        }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!response.ok) console.warn(`Optional n8n webhook returned ${response.status}`)
  } catch (error) {
    console.warn('Optional n8n automation unavailable', error)
  }

  return new Response(null, { status: 204 })
}
