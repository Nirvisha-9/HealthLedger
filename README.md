# HealthLedger

A personal healthcare cost ledger: tracks what you've spent toward your deductible
this year, and shows what any new procedure will **actually cost you** — not the
sticker price — at nearby providers, on an interactive map.

## Features

- **Ledger / Profile** — running deductible total, visit history, insurance plan details
- **Find Care (map)** — pins for nearby providers, color-coded by *your* real cost for
  the selected procedure (green = cheap for you, red = expensive for you)
- **Provider detail card** — sticker price vs. your real cost, savings, wait time,
  and a review-pattern flag (e.g. "reviews mention surprise anesthesia charges")
- **Compare** — view multiple providers side by side
- **AI narration** — Grok (xAI) explains the tradeoff in plain English based on your
  personalized numbers
- **Action letter** — Grok generates a cost-confirmation / Good Faith Estimate request
  message you can copy and send to a provider's billing office
- **Log visit** — after choosing a provider, log the visit to update your running
  deductible total

## Setup

```bash
npm install
cp .env.local.example .env.local
# edit .env.local and add your XAI_API_KEY
npm run dev
```

Open http://localhost:3000

## Notes on data

- `data/providers.json` — seeded provider data (names/addresses are illustrative;
  prices are placeholders modeled on the *range* of real CMS hospital price
  transparency files — replace with real pulled values for production use)
- `data/userLedger.json` — seeded demo user (insurance plan + visit history)
- All deductible/coinsurance/out-of-pocket math is in `lib/costCalculator.ts` and is
  fully deterministic — no AI involved in the financial calculations
- Grok (xAI) is used only for: (1) narrating the tradeoff between providers, and
  (2) drafting the cost-confirmation letter. If `XAI_API_KEY` is not set, the app
  still works — these sections just show a placeholder message.

## Deploying to Vercel

```bash
vercel
```

Add `XAI_API_KEY` as an environment variable in your Vercel project settings.

## Tech stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- React Leaflet (OpenStreetMap tiles) for the map
- xAI Grok API for narration and letter generation
- Local state via React Context + localStorage (no backend DB needed for demo)
