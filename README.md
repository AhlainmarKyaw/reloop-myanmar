# ReLoop Myanmar

**Give Things a Second Life.**

ReLoop Myanmar is an AI-assisted second-hand marketplace MVP built during the official hackathon build window for the **Iomtech — Reimagining the Second-Hand Market** challenge.

> Turn one photo into a trusted second-hand listing in seconds.

## Problem

People leave useful goods unused because creating a good listing takes effort. Sellers struggle with identification, condition wording, pricing, and presentation; buyers struggle to understand what is visible, what is claimed, and what still needs verification.

## Solution

ReLoop turns one product photo and an optional seller note into an editable marketplace listing with:

- item and category identification
- visible-condition assessment with uncertainty-aware language
- an estimated MMK price range
- a generated title and description
- an explainable AI Trust Passport
- practical buyer checks
- an estimated circular impact

Prices are prototype estimates, not real-time Myanmar market data. AI observations are guidance, not guarantees.

## Core user journey

```text
Marketplace → Sell with AI → Upload or Try Demo Item → Analyze
→ Review item, price, listing, Trust Passport, and impact → Edit → Publish
→ Marketplace success state → Listing details → I'm Interested → Interest sent
```

The journey is optimized for a 60–90 second live demonstration.

## Core functionality

- Responsive consumer marketplace with six clearly disclosed demo listings
- Search, categories, MMK prices, Myanmar locations, and clean product cards
- Single-image JPG, PNG, or WEBP upload with data URL persistence
- Optional seller note and one-click prepared demo item
- Animated AI processing with duplicate-request protection and timeout
- Editable title, description, and selling price
- LocalStorage publishing with immediate marketplace placement
- Listing details, Save interaction, and complete buyer-interest form
- Optional, non-blocking n8n events
- Polished empty, loading, error, publish-success, and interest-success states

## AI utilization and architecture

Production requests follow:

```text
React frontend
  → POST /api/analyze-item
  → Netlify Function: netlify/functions/analyze-item.ts
  → OpenAI-compatible image-capable model
  → schema validation and sanitization
  → structured analysis returned to the UI
```

The serverless function uses JSON Schema output, bounds numeric values, limits text and array lengths, rejects malformed responses, and calculates environmental weight locally. Secrets remain server-side.

Default prepared model: `gpt-4o-mini`. Set `AI_MODEL` to another image-capable model that supports structured JSON output if needed.

### AI Demo Mode

`demoAnalyzeItem()` remains a deterministic fallback. It activates when no key exists, the provider or network fails, the request times out, parsing fails, or the response is invalid. The interface clearly shows **AI Demo Mode** and preserves the full analyze → edit → publish → interest journey. It is never presented as live AI.

## AI Trust Passport

The reusable AI Trust Passport separates:

- listing-completeness signals
- AI visible-condition observations
- checks the buyer must perform

It deliberately avoids “certified,” “authentic,” “guaranteed,” or “safe” claims.

### Trust Score methodology

The prototype score is deterministic and capped at 100:

| Signal | Points |
|---|---:|
| Image provided | +30 |
| AI analysis completed | +25 |
| Description completed | +15 |
| Seller note provided | +10 |
| Condition confidence | +0–20 (`round(confidence × 0.2)`) |

The score represents listing completeness and AI-assisted trust signals. It does **not** guarantee seller honesty, ownership, authenticity, functionality, internal condition, or safety.

## Circular impact methodology

Estimated waste avoided is a deterministic prototype lookup based on typical category weight:

| Category | Estimate |
|---|---:|
| Phones/tablets | 0.4 kg |
| Computers/laptops | 2.1 kg |
| Audio/headphones | 0.25 kg |
| Furniture | 12.5 kg |
| Bicycles/sports | 14.2 kg |
| Appliances | 3.4 kg |
| Clothing | 0.5 kg |
| Books | 0.6 kg |
| Other | 1.0 kg |

These are illustrative estimates, not lifecycle assessments. Actual impact varies.

## Optional n8n automation

`netlify/functions/listing-event.ts` provides one lightweight automation boundary. The frontend can emit:

- `listing_published` for a future seller notification or impact record
- `buyer_interest` for a future seller notification

The function sanitizes payloads and posts them to `N8N_WEBHOOK_URL`. A missing URL, timeout, or failed webhook never blocks publishing or buyer interest.

Possible future workflow:

```text
Listing published → Netlify Function → n8n → seller notification / impact log
Buyer interested  → Netlify Function → n8n → seller notification
```

No n8n workflow or partner service is claimed to be live; a webhook must be configured manually.

## Cursor usage

Cursor assisted with the initial architecture, React implementation, component generation, AI workflow and serverless functions, controlled refactoring, fallback debugging, build/lint verification, responsive refinement, and end-to-end browser testing. Git history is preserved across implementation iterations.

## UX research disclosure

Mobbin integration was checked during development but was not available in this environment. No Mobbin content was accessed or copied. The interface instead applies established mobile marketplace patterns: image-first cards, a short guided selling flow, clear progress feedback, explainable trust signals, and focused success states.

Wispr Flow was not integrated into the ReLoop product and is not required to develop or run it.

## Technology stack

- React 19, TypeScript, Vite 8
- Tailwind CSS 4
- React Router
- Lucide React
- Radix UI Dialog
- LocalStorage
- Netlify Functions
- Optional OpenAI API and n8n webhook

## Third-party resources

- [Cursor](https://cursor.com/) — development and verification
- [React](https://react.dev/), [Vite](https://vite.dev/), and [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Lucide](https://lucide.dev/) — icons
- [Radix UI](https://www.radix-ui.com/) — accessible modal primitive
- [Netlify](https://www.netlify.com/) — prepared hosting and serverless runtime
- [OpenAI API](https://platform.openai.com/docs/) — optional prepared vision provider
- [n8n](https://n8n.io/) — optional webhook automation target

Demo product visuals are original local SVG/gradient illustrations. No external product-photo service is required.

## Environment variables

Copy `.env.example` only as a reference. Configure values in Netlify; they are server-side and must never use a `VITE_` prefix.

```bash
AI_API_KEY=
AI_MODEL=gpt-4o-mini
N8N_WEBHOOK_URL=
```

- `AI_API_KEY`: required only for real AI
- `AI_MODEL`: optional; defaults to `gpt-4o-mini`
- `N8N_WEBHOOK_URL`: optional; core functionality works without it

Never commit a real `.env` file or API key.

## Local development

Frontend with automatic Demo Mode:

```bash
npm install
npm run dev
```

Full Netlify Functions environment:

```bash
npx netlify dev
```

## Netlify deployment

Connect the repository to Netlify with:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Functions directory:** `netlify/functions`

`netlify.toml` contains API rewrites and a final SPA fallback to `/index.html`, so direct refreshes of `/`, `/sell`, and `/listing/:id` resolve correctly.

Add `AI_API_KEY` and optionally `AI_MODEL` for real analysis. Add `N8N_WEBHOOK_URL` only after creating an n8n webhook. The app remains fully demonstrable without any environment variables.

## Hackathon scope and prototype limitations

This is a focused MVP, not a production marketplace. Demo listings and seller identities are illustrative. Persistence is browser-local. There is no authentication, payment, delivery, real-time chat, KYC, database, scientific impact model, live market-price source, authenticity verification, or fraud guarantee.

## Future improvements

- Myanmar-language and bilingual listing generation
- Multiple-photo guidance and client-side image compression
- Consented, calibrated regional pricing data
- Account-backed cloud persistence and moderation
- Verified transaction history and safer meetup workflows
- Rigorous lifecycle-based impact factors
