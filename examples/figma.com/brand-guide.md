# Figma brand guide

Extracted from https://figma.com/ on 2026-10-09.

**Tagline:** The full-stack creative canvas

**Elevator pitch:** Go from WIP to ship, together, on one creative canvas. Bring your teammates, AI agents, design context, and code into the same workspace to build better products.

**Boilerplate:** About Figma: Figma is a design platform for teams who build products together. Its tools help teams brainstorm, design, and build products from start to finish, with shared libraries, prototyping, developer tools, and AI capabilities. Serving solo founders through enterprise organizations, Figma connects workflows across teams and time zones. Based on March 2025 data, 95% of the Fortune 500 uses Figma.

## Logo

- Primary logo: inline SVG (see brand.json `logo.primary.svg`)
- icon (128x128): https://static.figma.com/app/icon/2/icon-128.png
- icon (192x192): https://static.figma.com/app/icon/2/icon-192.png
- icon (256x256): https://static.figma.com/app/icon/2/icon-256.png
- icon: https://static.figma.com/app/icon/2/favicon.png
- Taken from the rendered site header (19x28px on a 1440px-wide viewport).
- Vector SVG with computed fills inlined, so it renders the same outside the site.

## Colour

| Role | Name | HEX | RGB | CMYK | Share | Text on it |
|---|---|---|---|---|---|---|
| primary | Light Blue | `#00B6FF` | rgb(0, 182, 255) | cmyk(100, 29, 0, 0) | 0.6% | #000000 |
| accent | Light Purple | `#CB9FD2` | rgb(203, 159, 210) | cmyk(3, 24, 0, 18) | 1.1% | #000000 |
| accent | Light Green | `#24CB71` | rgb(36, 203, 113) | cmyk(82, 0, 44, 20) | 0.6% | #000000 |
| accent | Light Red | `#FF7237` | rgb(255, 114, 55) | cmyk(0, 55, 78, 0) | 0.6% | #000000 |
| accent | Vivid Red | `#FF3737` | rgb(255, 55, 55) | cmyk(0, 78, 78, 0) | 0.6% | #000000 |
| background | White | `#FFFFFF` | rgb(255, 255, 255) | cmyk(0, 0, 0, 0) | 52.8% | #000000 |
| text | Black | `#000000` | rgb(0, 0, 0) | cmyk(0, 0, 0, 100) | 26.2% | #FFFFFF |
| muted-text | Gray | `#757575` | rgb(117, 117, 117) | cmyk(0, 0, 0, 54) | 17% | #FFFFFF |

**Contrast checks**

- Body text on page background: #000000 on #FFFFFF = 21:1 (AAA)
- Text on primary: #000000 on #00B6FF = 9.14:1 (AAA)
- Muted text on page background: #757575 on #FFFFFF = 4.59:1 (AA)
- Primary on page background: #00B6FF on #FFFFFF = 2.3:1 (Fail)
- Text on light purple accent: #000000 on #CB9FD2 = 9.43:1 (AAA)
- Text on light green accent: #000000 on #24CB71 = 9.86:1 (AAA)

## Typography

- **figmaSans** (sans-serif, self-hosted) for display, heading, subheading, body, navigation, button. Weights: 320, 400. Stack: `figmaSans, "figmaSans Fallback", "SF Pro Display", system-ui, helvetica, sans-serif`

| Role | Family | Size | Weight | Line height | Tracking |
|---|---|---|---|---|---|
| display | figmaSans | 56px | 400 | 1 | -0.022em |
| heading | figmaSans | 30px | 400 | 1.2 | -0.022em |
| subheading | figmaSans | 16px | 400 | 1.4 | 0em |
| body | figmaSans | 16px | 400 | 1.4 | 0em |
| navigation | figmaSans | 16px | 400 | 1.45 | 0em |
| button | figmaSans | 16px | 400 | 1.45 | 0em |

## Tone of voice

Figma pairs creative ambition with practical building language. Its voice is collaborative, action-led, and fluent in design and development, with occasional maker shorthand and playful warmth.

### Together by default

Frames creativity and product development as shared work, not individual heroics.

- **Do:** Describe how teammates contribute, align, and build in the same space.
- **Don't:** Position a lone genius or individual ownership as the source of great products.

> "Made so your whole team can go from WIP to ship, together." ([source](https://figma.com/))
> "Our vision is to make design accessible to all because we know that nothing great is made alone." ([source](https://www.figma.com/careers))

### Expressive and exact

Balances imaginative possibility with precision, craft, and intentional execution.

- **Do:** Pair creative outcomes with concrete controls, context, or tools that make them achievable.
- **Don't:** Celebrate limitless creativity without explaining how people can refine or build it.

> "Powerfully expressive. Incredibly precise." ([source](https://figma.com/))
> "We build for builders and try to make complex things feel simple." ([source](https://www.figma.com/careers))

### Momentum with intention

Promises speed while insisting on alignment, consistency, and the right outcome.

- **Do:** Use active verbs and connect faster work to better decisions or faithful delivery.
- **Don't:** Treat speed as a reason to skip craft, context, or feedback.

> "Move fast in the right direction on an AI-native canvas." ([source](https://figma.com/))
> "Start with design context. Build with consistency." ([source](https://figma.com/))

### Maker-minded warmth

Uses insider language and playful phrasing to make ambitious technical work feel human.

- **Do:** Use familiar maker terms sparingly and welcome exploration alongside practical work.
- **Don't:** Use stiff corporate abstractions or force jokes into feature and pricing explanations.

> "We’re multiplayer people who love the weird, wonderful magic that happens when people connect." ([source](https://www.figma.com/careers))
> "Playing is learning." ([source](https://www.figma.com/careers))

**Tone spectrum** (0 to 100)

- Formal 58 Casual
- Serious 30 Playful
- Technical 40 Plain
- Understated 72 Bold

**Style rules**

- Use sentence case for headings, preserving product names and acronyms.
- Lead headings and CTAs with active verbs such as Build, Create, Explore, and Choose.
- Keep headlines short; use fuller explanatory sentences around 20 words when describing workflows or capabilities.
- Address the reader as you or your in product copy; use we and our for company values and culture.
- Use em dashes to connect an outcome or aside, and paired short sentences for emphasis; keep exclamation marks and rhetorical questions rare.
- Retain useful design and developer terminology, but connect it to an action or outcome; present pricing and limits with numerals and clear units.

**Words we use:** together, build, design, teams, canvas, shared, context, design systems, collaboration, AI, craft, from start to finish

**Words we avoid:** lone genius, autopilot, effortless perfection, synergize, paradigm shift, one-size-fits-all

**Measured:** 20.8 words per sentence, reading ease 39 (Dense (college level)), headings in Sentence case, "you" 1.8 per 100 words vs "we" 1.4.

## Messaging

- **Designers and product teams:** Explore ideas, refine detailed designs, prototype experiences, and collaborate across the product development process.
- **Developers:** Access design context, specifications, and connected tools so what gets designed is what gets built.
- **Organizations and enterprise teams:** Scale shared design systems, centralize resources, and manage security and administration across products and departments.
- **Marketing teams and agencies:** Create campaign assets quickly and coordinate client workflows from ideas through delivery.

### One shared workspace, from idea to delivery

Figma brings teams and workflows together across the entire product development process.

> "One workspace for your entire product development process." ([source](https://figma.com/))
> "FigJam makes it easy to explore ideas with your team. Define the work, make decisions, and move forward—all in one place." ([source](https://www.figma.com/solutions))

### AI with shared creative context

Figma puts AI alongside teammates and connects it to the context needed to generate, refine, and build.

> "Teammates and AI agents work in the same space with shared context." ([source](https://figma.com/))
> "Ask Figma’s agent to add motion to designs, document your design systems, implement feedback, and more." ([source](https://figma.com/))

### Creative craft that carries through to code

Figma combines expressive design tools with connected development workflows to preserve intent through production.

> "Every technical tool you need to dial in the details." ([source](https://figma.com/))
> "Your context, codebase, and agents stay connected so what you design is what gets shipped." ([source](https://figma.com/))

### Consistency at team and enterprise scale

Figma helps organizations share resources and scale design systems across teams, brands, and products.

> "Manage and share design systems across multiple teams at your organization." ([source](https://www.figma.com/pricing))
> "Scale design systems across multiple brands and products with extended collections." ([source](https://www.figma.com/pricing))

**Proof points**

> "95% of the Fortune 500 uses Figma" ([source](https://figma.com/))
> "Based on data from March 2025." ([source](https://figma.com/))
> "Duotone moved their entire agency workflow into Figma. Today, they're saving 80+ hours per project." ([source](https://www.figma.com/customers))
> "PhonePe unifies teams and design systems in Figma to serve 700+ million users." ([source](https://www.figma.com/customers))
> "How Mercado Libre scales design for 100 million buyers across Latin America" ([source](https://www.figma.com/customers))
> "Uber keeps design consistent at scale with Figma’s design system and dev tools." ([source](https://www.figma.com/customers))

**Key phrases:** "The full-stack creative canvas", "from WIP to ship", "Build with intention", "Build with consistency", "build better products, together", "nothing great is made alone", "all in one place", "Love your craft"

**Calls to action:** Get started · Get started for free · Register

## Sources

- home: https://figma.com/
- product: https://www.figma.com/solutions
- pricing: https://www.figma.com/pricing
- customers: https://www.figma.com/customers
- blog: https://www.figma.com/blog
- careers: https://www.figma.com/careers
