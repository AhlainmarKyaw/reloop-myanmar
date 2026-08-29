# ReLoop Myanmar

ReLoop Myanmar is an AI-assisted second-hand marketplace prototype built for the Iomtech “Reimagining the Second-Hand Market” challenge. It helps people turn one item photo into a clear, fairly priced, trust-aware listing in seconds.

This prototype was built during the official hackathon build window.

## Problem

Selling used goods is unnecessarily difficult. Sellers often do not know how to identify an item precisely, describe its condition, choose a fair price, or write a trustworthy listing. Buyers must evaluate inconsistent information with little guidance.

## Solution

ReLoop guides a seller from photo to published listing:

1. Upload a clear item photo and optionally add context.
2. AI identifies the item and category, assesses visible condition, and estimates a second-hand price range in MMK.
3. AI writes an editable title and description, highlights trust and safety observations, and estimates circular impact.
4. The seller reviews, edits, prices, and publishes.
5. The listing is persisted locally and immediately appears in the marketplace.

## Core features

- Premium responsive marketplace with six realistic Myanmar demo listings
- Search and category filtering
- Image upload, drag-and-drop, preview, and validation
- Animated multi-stage AI analysis experience
- Editable AI-generated listing and MMK price estimate
- Trust score, visible-condition observations, and meetup safety guidance
- Estimated waste-avoidance indicator
- LocalStorage persistence for published listings
- Listing details with Save and working “I’m Interested” confirmation
- Deterministic demo fallback so the core demo remains reliable without an API

All prices and impact calculations are illustrative prototype estimates, not real-time market data.

## AI usage

The frontend calls the server-side `/api/analyze-item` endpoint. On Netlify, that route maps to a serverless function that sends the image and seller note to an OpenAI vision-capable model and enforces a structured JSON response.

API credentials are read only inside the serverless function. If the endpoint, provider, or key is unavailable, the frontend automatically uses `demoAnalyzeItem()` and visibly labels the result **Demo Mode**. This makes the AI experience fully demonstrable while preserving a real integration path.

## How Cursor was used

Cursor was used throughout the official build window to scaffold the React application, develop the responsive interface, implement the AI service abstraction and Netlify function, reason about fallback behavior, and verify the end-to-end flows.

## Tech stack

- React 19
- Vite 8
- TypeScript
- Tailwind CSS 4
- React Router
- Lucide React icons
- Radix UI dialog primitive
- Browser LocalStorage
- Netlify Functions

## Third-party resources

- [Lucide](https://lucide.dev/) for interface icons
- [Radix UI](https://www.radix-ui.com/) for accessible dialog behavior
- [OpenAI API](https://platform.openai.com/docs/) as the optional vision analysis provider

The demo catalog uses original gradient illustrations rather than externally hosted product photos, keeping the prototype fast and reliable offline.

## Local setup

```bash
npm install
npm run dev
```

Open the URL printed by Vite.

For the complete serverless development environment, install the Netlify CLI and run:

```bash
npx netlify dev
```

Without serverless configuration, the Vite app intentionally falls back to Demo Mode.

## Environment variables

Configure these in Netlify, never in frontend `.env` variables:

```bash
OPENAI_API_KEY=your_server_side_key
OPENAI_MODEL=gpt-4o-mini
```

`OPENAI_MODEL` is optional. Any configured model must accept image input and JSON schema response formatting.

## Deployment

1. Connect the repository to Netlify.
2. Add `OPENAI_API_KEY` in **Site configuration → Environment variables** if real AI analysis is desired.
3. Deploy. `netlify.toml` configures the build command, publish directory, serverless function, API rewrite, and SPA fallback.

The site remains usable when no API key is configured.

## Hackathon scope

ReLoop is a focused prototype, not a production marketplace. It deliberately excludes authentication, payments, chat, delivery, administration, and a database. Seller identity and trust scores are illustrative, and browser storage is device-local.

## Future improvements

- Multiple-image analysis and guided photo quality checks
- Myanmar-language and bilingual listings
- Calibrated pricing from consented marketplace data
- Verified seller profiles and safer meetup workflows
- Cloud persistence, moderation, and duplicate-listing detection
- More rigorous lifecycle-based environmental calculations
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
