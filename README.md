# Brand Guide Generator

Give it a company website, or just a company name, and get back a brand guide you can use: logo, colour palette, typography, tone of voice and key messaging, all pulled from the live site with [TinyFish](https://tinyfish.ai).

Results come back as a page you can present (and save as a 16:9 PDF deck), as structured JSON, and as files design tools read directly: W3C design tokens (Tokens Studio for Figma, Style Dictionary), CSS variables, a Tailwind v4 theme and Markdown.

## How TinyFish is used

Three TinyFish endpoints do the extraction. Each one does work the others cannot:

- **Search** turns a company name into its official site, skipping Wikipedia, LinkedIn and app stores. It also looks for the brand's own guidelines or press-kit page, restricted to the brand's domain. When a homepage exposes few links, it finds the about, product and careers pages instead.
- **Fetch** reads the homepage and up to eight more pages (about, product, pricing, customers, blog, careers, brand) as clean Markdown. That text is the source for tone of voice, messaging, proof points and any official brand colours.
- **Browser** opens a remote TinyFish browser over CDP and renders the homepage. It then measures what a visitor sees: computed colours weighted by on-screen area, the type scale, button styles, CSS variables, loaded font files and the header logo, plus a screenshot. It also reads any page that Fetch cannot extract (client-rendered or bot-protected sites).

A model (GPT-6.1 Sol) then writes the voice and messaging sections from the fetched text. Every quote it cites is checked in code against the page it came from, and anything not found verbatim is dropped. Each guide includes a provenance table listing every TinyFish call: its purpose, input, result and time.

Details: [docs/pipeline.md](docs/pipeline.md).

## What you get

| Section | Contents |
|---|---|
| Logo | Header logo as standalone SVG (computed fills inlined) or image, a PNG clip, favicons and touch icons, and previews on light, dark and brand backgrounds |
| Colour | Role-assigned palette (primary, accents, background, text, muted text, surfaces, neutrals). Each swatch has HEX, RGB, HSL and CMYK, its share of the page, the evidence for it, and WCAG contrast. Also key contrast pairings and the site's colour CSS variables |
| Typography | Families with source (Google Fonts, Adobe Fonts, self-hosted, system), weights, stacks and font files, plus a type scale per role and button styles as rendered |
| Tone of voice | Summary, 3 or 4 traits with do and don't guidance and verbatim evidence, a tone spectrum, style rules, words to use and avoid, and writing metrics measured in code |
| Messaging | Tagline, elevator pitch, boilerplate, audiences, messaging pillars with proof, proof points, key phrases and calls to action |
| Provenance | Every TinyFish call, every page read, quote verification counts and warnings |

## Demo brands

Generated from the live sites on 2026-10-09. The full output for each is in [`examples/`](examples).

| Input | Primary | Type | Voice (first two traits) | Pages read | Quotes verified | Time |
|---|---|---|---|---|---|---|
| `stripe.com` | `#533AFD` | Sohne Var | Infrastructure-minded, Outcome-led | 9 | 22 of 22 | 45s |
| `linear.app` | `#5E6AD2` | Inter Variable, Berkeley Mono | Future-facing, grounded in systems, Momentum without noise | 8 | 23 of 23 | 43s |
| `Duolingo` | `#58CC02` | Duolingo Sans, Feather | Playful with a purpose, Science made approachable | 4 | 20 of 20 | 105s |
| `Patagonia` | `#1B2B79` | Ridgeway Sans | Business as Activism, Collective and Mobilizing | 4 | 21 of 21 | 45s |
| `Airbnb` | `#FF385C` | Airbnb Cereal VF | Belonging expressed personally, Creatively ambitious | 3 | 12 of 12 | 34s |
| `figma.com` | `#00B6FF` | figmaSans | Together by default, Expressive and exact | 6 | 22 of 22 | 43s |

Duolingo and Airbnb were given by name only; Search resolved them. Duolingo's site returns empty content to Fetch, so the browser read those pages (marked in its provenance table).

## Run it

```bash
cp .env.example .env.local   # add TINYFISH_API_KEY and OPENAI_API_KEY
npm install
npm run dev                  # http://localhost:3000

# or from the command line; writes examples/<domain>/ with every export
npm run guide -- stripe.com
npm run guide -- "Duolingo"
```

## API

```bash
# Stream progress events, then the full guide (NDJSON)
curl -N -X POST http://localhost:3000/api/brand-guide \
  -H 'Content-Type: application/json' -d '{"input":"linear.app"}'

# One finished export: json | tokens | css | tailwind | md
curl 'http://localhost:3000/api/brand-guide?input=Duolingo&format=tokens'
```

Results are cached in memory for an hour, and concurrent requests for the same brand share one run. Live generations are rate-limited per IP (`RATE_LIMIT_PER_HOUR`, default 8).

## Stack

Next.js 16, TypeScript, `@tiny-fish/sdk` for Search, Fetch and browser sessions, and `playwright-core` to drive the TinyFish browser over CDP. Nothing is installed locally for the browser. The voice step calls the OpenAI Responses API with a strict JSON schema.
