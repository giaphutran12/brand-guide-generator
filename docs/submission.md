# Submission: TinyFish Student Bounty Drop 001, Brand Guide Generator

## Notes for reviewers (under 2,000 characters)

Brand Guide Generator: give it a URL or just a company name, get back a structured brand guide (logo, palette, typography, tone of voice, messaging). It also exports W3C design tokens (Tokens Studio for Figma), CSS variables, a Tailwind v4 theme, Markdown, and a 16:9 PDF deck.

TinyFish does the extraction through 3 endpoints:
- Search: resolves a name to the official site (skipping Wikipedia, LinkedIn and app stores), finds the brand's own guidelines or press page (include_domains), and finds the about, product and careers pages when a homepage hides its links.
- Fetch: reads the homepage plus up to 8 pages (about, product, pricing, customers, blog, careers, brand) as Markdown. This is the source for voice, messaging and proof points.
- Browser: a remote session driven over CDP renders the homepage and measures computed colours (weighted by on-screen area), the type scale, buttons, CSS variables, font files and the header logo (SVG with fills inlined). It also reads pages Fetch cannot; Duolingo returns empty content to Fetch.

Accuracy: every quote, tagline and key phrase the model writes is checked against the fetched page text and dropped if it is not verbatim (0 dropped across 6 demos). Each guide ends with a table of every TinyFish call it made.

Demos in examples/: stripe.com, linear.app, Duolingo, Patagonia and Airbnb (the last three by name only), and figma.com. Primaries match the real brand colours: Stripe #533AFD, Linear #5E6AD2, Duolingo #58CC02, Airbnb #FF385C.

To test: npm install, put TINYFISH_API_KEY and OPENAI_API_KEY in .env.local, npm run dev, then enter any URL or name. API: POST /api/brand-guide {"input":"..."} streams progress; GET /api/brand-guide?input=...&format=tokens|css|tailwind|md|json returns one export.

## LinkedIn post (draft)

Built a brand guide generator for the @TinyFish Student Bounty.

Type a URL, or just a company name, and it reads the live site and hands back a usable brand guide: logo, colour palette, typography, tone of voice and key messaging. It exports to Figma design tokens, CSS, Tailwind or a PDF deck.

How TinyFish powers it:
- Search finds the official site and the brand's own guidelines page
- Fetch reads the homepage and up to eight more pages for voice and messaging
- Browser renders the site to measure the real colours, fonts and logo

Every quote in the guide is checked against the page it came from. Tested on Stripe, Linear, Duolingo, Patagonia, Airbnb and Figma; it pulled Stripe's #533AFD and Airbnb's #FF385C straight from their sites.

https://github.com/giaphutran12/brand-guide-generator #TinyFish #buildinpublic

## X post (draft)

Built a brand guide generator on @TinyFish: URL or company name in; logo, palette, fonts, tone of voice and messaging out, as Figma tokens, CSS, Tailwind or a PDF deck.

Search finds the site, Fetch reads 9 pages, Browser measures the real colours and fonts. Every quote is verified against the page.

https://github.com/giaphutran12/brand-guide-generator
