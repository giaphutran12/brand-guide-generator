---
version: alpha
name: "Figma"
description: "The full-stack creative canvas"
colors:
  primary: "#00B6FF"
  secondary: "#CB9FD2"
  tertiary: "#24CB71"
  accent-3: "#FF7237"
  accent-4: "#FF3737"
  background: "#FFFFFF"
  on-surface: "#000000"
  on-surface-variant: "#757575"
  on-primary: "#000000"
typography:
  headline-display:
    fontFamily: "figmaSans"
    fontSize: 56px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: "figmaSans"
    fontSize: 30px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: -0.02em
  headline-md:
    fontFamily: "figmaSans"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0em
  body-md:
    fontFamily: "figmaSans"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0em
  label-md:
    fontFamily: "figmaSans"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0em
  label-lg:
    fontFamily: "figmaSans"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0em
rounded:
  lg: 16px
components:
  button-primary:
    backgroundColor: "{colors.on-surface}"
    textColor: "{colors.background}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.lg}"
    padding: "24px 32px"
---

# Figma

Extracted from https://figma.com/ on 2026-10-09 by Brand Guide Generator. Colours, type and components were measured on the rendered site, and every quote was checked against the page it came from. This describes the live site; it is not an official brand guide.

## Overview

Go from WIP to ship, together, on one creative canvas. Bring your teammates, AI agents, design context, and code into the same workspace to build better products.

Figma pairs creative ambition with practical building language. Its voice is collaborative, action-led, and fluent in design and development, with occasional maker shorthand and playful warmth.

Tone: between formal and casual, serious, between technical and plain-spoken, bold.

Audiences: Designers and product teams; Developers; Organizations and enterprise teams; Marketing teams and agencies.

## Colors

8 colours, ordered by role. Share is how much of the rendered page each one covers.

- **Light Blue (#00B6FF):** Primary brand colour (`primary`), 0.6% of the page. Seen as: chosen from logo colour, also used across the page; 2% of icons and graphics.
- **Light Purple (#CB9FD2):** Accent (`secondary`), 1.1% of the page. Seen as: 2% of background area.
- **Light Green (#24CB71):** Accent (`tertiary`), 0.6% of the page. Seen as: 2% of icons and graphics; logo colour.
- **Light Red (#FF7237):** Accent (`accent-3`), 0.6% of the page. Seen as: 2% of icons and graphics; logo colour.
- **Vivid Red (#FF3737):** Accent (`accent-4`), 0.6% of the page. Seen as: 2% of icons and graphics; logo colour.
- **White (#FFFFFF):** Page background (`background`), 52.8% of the page. Seen as: 97% of background area; 4% of text.
- **Black (#000000):** Main text (`on-surface`), 26.2% of the page. Seen as: 48% of text; 32% of icons and graphics.
- **Gray (#757575):** Secondary text (`on-surface-variant`), 17% of the page. Seen as: 47% of text.
- **On primary (#000000):** Text and icons on the primary colour (`on-primary`), the higher-contrast of black and white. Computed, not measured; the site's own buttons are under Components.

## Typography

- **figmaSans** (self-hosted, sans-serif) for display, heading, subheading, body, navigation, button. Weights 320, 400. Stack: `figmaSans, "figmaSans Fallback", "SF Pro Display", system-ui, helvetica, sans-serif`.

- **Display** (`headline-display`): figmaSans 56px, weight 400, line height 1, tracking -0.02em.
- **Heading** (`headline-lg`): figmaSans 30px, weight 400, line height 1.2, tracking -0.02em.
- **Subheading** (`headline-md`): figmaSans 16px, weight 400, line height 1.4.
- **Body** (`body-md`): figmaSans 16px, weight 400, line height 1.4.
- **Navigation** (`label-md`): figmaSans 16px, weight 400, line height 1.45.
- **Button** (`label-lg`): figmaSans 16px, weight 400, line height 1.45.

Headings are set in sentence case.

## Shapes

Measured on buttons: 16px corners (`rounded.lg`).

## Components

- **button-primary** ("Get started"): #000000 background, #FFFFFF text, 16px radius, padding 24px 32px, weight 400.

## Do's and Don'ts

- Do use #000000 on #FFFFFF for body text on page background (21:1, WCAG AAA).
- Do use #000000 on #00B6FF for text on primary (9.14:1, WCAG AAA).
- Do use #757575 on #FFFFFF for muted text on page background (4.59:1, WCAG AA).
- Don't use #00B6FF on #FFFFFF for text (primary on page background): 2.3:1 fails WCAG.
- Do use #000000 on #CB9FD2 for text on light purple accent (9.43:1, WCAG AAA).
- Do use #000000 on #24CB71 for text on light green accent (9.86:1, WCAG AAA).
- Do (Together by default): Describe how teammates contribute, align, and build in the same space.
- Don't (Together by default): Position a lone genius or individual ownership as the source of great products.
- Do (Expressive and exact): Pair creative outcomes with concrete controls, context, or tools that make them achievable.
- Don't (Expressive and exact): Celebrate limitless creativity without explaining how people can refine or build it.
- Do (Momentum with intention): Use active verbs and connect faster work to better decisions or faithful delivery.
- Don't (Momentum with intention): Treat speed as a reason to skip craft, context, or feedback.
- Do (Maker-minded warmth): Use familiar maker terms sparingly and welcome exploration alongside practical work.
- Don't (Maker-minded warmth): Use stiff corporate abstractions or force jokes into feature and pricing explanations.
- Don't use these words in copy: lone genius, autopilot, effortless perfection, synergize, paradigm shift, one-size-fits-all.

## Voice

- Use sentence case for headings, preserving product names and acronyms.
- Lead headings and CTAs with active verbs such as Build, Create, Explore, and Choose.
- Keep headlines short; use fuller explanatory sentences around 20 words when describing workflows or capabilities.
- Address the reader as you or your in product copy; use we and our for company values and culture.
- Use em dashes to connect an outcome or aside, and paired short sentences for emphasis; keep exclamation marks and rhetorical questions rare.
- Retain useful design and developer terminology, but connect it to an action or outcome; present pricing and limits with numerals and clear units.

Words they use: together, build, design, teams, canvas, shared, context, design systems, collaboration, AI, craft, from start to finish.

How it sounds on their site:

> "Made so your whole team can go from WIP to ship, together." (https://figma.com/)
> "Our vision is to make design accessible to all because we know that nothing great is made alone." (https://www.figma.com/careers)
> "Powerfully expressive. Incredibly precise." (https://figma.com/)

## Logo

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="19" height="28" fill="none" viewBox="0 0 32 48" aria-label="Homepage"><path fill="rgb(0, 182, 255)" d="M16 23.059A7.06 7.06 0 0 1 23.06 16H24a8 8 0 1 1 0 16h-.941A7.06 7.06 0 0 1 16 24.941z"></path><path fill="rgb(36, 203, 113)" d="M0 40a8 8 0 0 1 8-8h8v8a8 8 0 1 1-16 0"></path><path fill="rgb(255, 114, 55)" d="M16 0v16h8a8 8 0 1 0 0-16z"></path><path fill="rgb(255, 55, 55)" d="M0 8a8 8 0 0 0 8 8h8V0H8a8 8 0 0 0-8 8"></path><path fill="rgb(135, 79, 255)" d="M0 24a8 8 0 0 0 8 8h8V16H8a8 8 0 0 0-8 8"></path></svg>
```
