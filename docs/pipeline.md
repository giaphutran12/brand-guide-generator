# Pipeline

How one input (a URL or a company name) becomes a brand guide, and which TinyFish endpoint does what.

```
input ─► Search (resolve name → official site)
           │
           ├─► Browser  render homepage over CDP ─► colours, type scale, buttons, logo, font files, screenshot
           │
           ├─► Fetch    homepage (copy + links) ─► plan pages ─► Fetch about / product / pricing /
           │            customers / blog / careers / brand pages in one call
           │              └─ pages Fetch cannot read ─► Browser reads them in one session
           │
           ├─► Search   brand guidelines / press kit, restricted to the brand's domain
           │
           └─► Model    voice + messaging from the fetched copy ─► every quote verified against the page text
```

The browser render and the Fetch-then-model path run in parallel; a guide takes 50 to 100 seconds.

## TinyFish endpoints

| Endpoint | Used for | Why it matters |
|---|---|---|
| **Search** | Resolve "Duolingo" to `duolingo.com`, skipping Wikipedia, LinkedIn, app stores and dictionaries. Find the brand's own guidelines or press-kit page with `include_domains`. When fewer than 3 named pages are found, find the site's about, product and careers pages. | Lets the tool work from just a company name, and finds official brand rules when a site publishes them. |
| **Fetch** | Read the homepage and up to 8 more pages (plus up to 3 spares when the corpus is thin) as clean Markdown, with links. This is the text corpus for voice, messaging, proof points and official colours. | Voice and messaging come from the whole site, not a homepage summary. |
| **Browser** | A remote browser session driven over CDP (`playwright-core` `connectOverCDP`). Renders the homepage at 1440px and measures computed styles. Also reads pages Fetch could not extract. | Colours, fonts and logos only exist after CSS and JavaScript run. |

Every call is recorded in `provenance.tinyfish` with its purpose, input, result and time. The guide page shows that table.

## What the browser measures

`src/lib/page-script.ts` runs inside the page in a single `evaluate`:

- **Colours** come from up to 6,000 elements in the first three screens. Background colours are weighted by on-screen area, text colours by characters times font size, and SVG fills and borders are counted separately. Gradient stops are included.
- **Buttons** are visible links and buttons with padding and a non-page background, keeping their colour, radius, padding and type. Skip links and consent buttons are excluded.
- **Type roles** cover display (`h1`), heading (`h2`), subheading (`h3`), navigation, code, and body. Body is the paragraph style covering the most text, weighted toward 14px and up so app mockups and legal notes do not win.
- **CSS custom properties** are read from `:root`, both colour and font variables.
- **Fonts** come from every font file in the resource timing list, from readable `@font-face` rules, and from Google Fonts and Adobe Fonts stylesheet links.
- **Logo**: candidate `svg` and `img` elements near the top of the page are scored. Points come from being in a `header` or `nav`, from "logo" or "brand" in class, id, alt or aria-label, from linking to `/`, and from sitting on the left. Inline SVGs are serialised with computed fills inlined so they render standalone. A PNG is clipped from the screenshot as a fallback.
- **Rendered copy and links** are used only when Fetch gets almost nothing from a client-rendered homepage.

## How colours become a palette

`src/lib/palette.ts`:

1. Parse every computed colour: `rgb`, `hsl`, `oklch`, `oklab`, `lab`, `lch`, `color(srgb …)` and hex. Blend translucent colours over the page background.
2. Merge colours that look the same: OKLab distance under 0.035.
3. Normalise each channel (backgrounds, text, graphics, borders) to shares, so a huge hero cannot drown out the text colour.
4. Assign roles:
   - **background**: the page background.
   - **text**: the highest-contrast colour carrying at least 12% of the copy.
   - **muted text**: the next most-used, lower-contrast neutral.
   - **primary**: the first vivid colour backed by evidence, checked in this order:
     1. an official colour from the brand page that also appears on the site
     2. a logo colour
     3. a call-to-action background
     4. a brand-named CSS variable (`--brand-*`, `--primary`; framework defaults like `--bs-*` are ignored)
     5. `theme-color`
     6. the most visible colour

     A monochrome site gets its text colour as primary.
   - **accents**: other visible chromatic colours.
   - **surfaces and neutrals**: the remaining greys.
5. Every swatch carries HEX, RGB, HSL, CMYK, its share of what a visitor sees, the evidence for it, and WCAG contrast against white and black. Key pairings are contrast-checked.

## Voice and messaging

`src/lib/voice.ts` sends the cleaned pages to the model (default `gpt-6.1-sol`, reasoning effort `low`) with a strict JSON schema. Navigation and footer lines repeated across pages are removed first. The input also includes writing metrics measured in code (`src/lib/corpus.ts`): sentence length, Flesch reading ease, heading case, you/we rate, exclamations and contractions.

The model must quote verbatim. After it answers, code checks every quote, key phrase, tagline and official hex code against the fetched text; anything not on the page is dropped and counted in `provenance.verification`. In the demo runs, 0 quotes were dropped.

## How the voice corpus is built

Voice and messaging are only as good as the copy behind them, so `src/lib/guide.ts` works to reach at least 4 pages and about 1,500 words (healthy sites such as Stripe land at 8 pages and 3,800 words). In order:

1. **Named pages.** `planPages` (`src/lib/pages.ts`) picks one page per kind from the homepage links: about, product, pricing, customers, blog, careers, brand.
2. **Rendered links.** If fewer than 5 pages were planned and Fetch returned fewer than 25 distinct same-site pages, the links from the rendered homepage (the browser render collects them) are added and the plan is rerun.
3. **Search.** If still fewer than 3 pages, Search looks for the site's about, product and careers pages.
4. **Site sections.** Sites with no about / product / pricing pages (a tourism board, a marketplace, a magazine) get `planSectionPages`: same-host links grouped by first path segment, one page per section (standalone top-level pages first, then section hubs by size). Links in another locale than the homepage (`/fr/` when the homepage is `/en/`), files, and account, legal, search and map pages are skipped. This tops the plan up to 5 pages; the pages are labelled `section`.
5. **Browser fallback.** Pages Fetch cannot read or that come back under 200 characters are opened in one browser session, up to 5 per batch.
6. **Spare sections.** After cleaning, if the corpus has fewer than 4 pages or under 1,500 words, up to 3 spare sections are read the same way.
7. **Cleaning.** Pages left with fewer than 40 words after navigation and repeated lines are removed are dropped as stubs. The per-page (6,000 characters) and total (32,000 characters) caps in `src/lib/corpus.ts` are unchanged.
8. **Warning.** If the corpus is still under 3 pages or 800 words, `provenance.warnings` says voice and messaging are based on limited copy.

Each step logs its counts (`guide.rendered_links`, `guide.section_fallback`, `guide.pages_fetched`, `guide.browser_read`, `guide.spare_pages`, `guide.corpus_ok` or `guide.corpus_thin`). A homepage that redirects to a locale root (`france.fr` to `/en/`) is handled by Fetch, which follows redirects; the planner already ignores locale prefixes when matching page kinds.

## Exports

`src/lib/exporters.ts` turns the guide into the files below. `npm run exports` rewrites them for every example from its saved `brand.json`, without re-crawling.

- `brand.json`: the full guide, schema `brand-guide/v1`.
- `tokens.json`: W3C Design Tokens (DTCG) for colours, font families and typography composites. Importable with Tokens Studio for Figma or Style Dictionary.
- `brand.css`: `:root` custom properties.
- `tailwind.css`: a Tailwind v4 `@theme` block.
- `brand-guide.md`: a Markdown guide for docs, Notion or speaker notes.
- `DESIGN.md`: Google's open [DESIGN.md](https://github.com/google-labs-code/design.md) format (version `alpha`), YAML tokens plus prose that coding agents and Stitch read. Token names follow the spec's recommended names (`primary`, `secondary`, `tertiary`, `background`, `surface`, `on-surface`, `on-primary`; `headline-display`, `headline-lg`, `body-md`, `label-lg`). Buttons become `components.button-primary` (the one filled with the primary colour) and `button-secondary`, with `{colors.*}` references when a button colour is in the palette. `rounded` comes from measured button radii. `spacing` and elevation are not measured, so they are left out rather than guessed. Do's and Don'ts combine the contrast checks with the voice traits. All six examples pass `npx @google/design.md lint` with 0 errors; the remaining warnings are real (Duolingo's white-on-green button is 2.09:1, and some palette colours are used by no button).
- "Save as PDF deck": a print stylesheet with one 16:9 page per section.

## Failure handling

- The render retries once with a fresh session, and the page is considered ready by polling `document.readyState` rather than relying on CDP lifecycle events.
- If the render still fails, the guide is returned without colours and type, with a warning in `provenance.warnings`.
- Pages Fetch cannot read go to one browser session (up to 5 pages). Anything still unread is listed as a warning.
- A thin corpus (under 3 pages or 800 words) adds a "limited copy" warning rather than failing.
- All steps log one-line `[brand-guide]` events with counts, sizes, timings and reasons. Page bodies and keys are never logged.
