---
version: alpha
name: "Linear"
description: "The product development system for teams and agents"
colors:
  primary: "#5E6AD2"
  background: "#08090A"
  on-surface: "#F7F8F8"
  on-surface-variant: "#8A8F98"
  neutral: "#D0D6E0"
  neutral-2: "#62666D"
  surface: "#101112"
  on-primary: "#FFFFFF"
typography:
  headline-display:
    fontFamily: "Inter Variable"
    fontSize: 64px
    fontWeight: 510
    lineHeight: 1
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: "Inter Variable"
    fontSize: 48px
    fontWeight: 510
    lineHeight: 1
    letterSpacing: -0.02em
  headline-md:
    fontFamily: "Inter Variable"
    fontSize: 20px
    fontWeight: 590
    lineHeight: 1.33
    letterSpacing: -0.01em
  body-md:
    fontFamily: "Inter Variable"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: -0.01em
  label-md:
    fontFamily: "Inter Variable"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
  label-lg:
    fontFamily: "Inter Variable"
    fontSize: 13px
    fontWeight: 510
    lineHeight: 2.46
    letterSpacing: 0em
  code:
    fontFamily: "Berkeley Mono"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.67
    letterSpacing: -0.01em
rounded:
  full: 9999px
components:
  button-primary:
    backgroundColor: "#E5E5E6"
    textColor: "{colors.background}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    padding: "0px 12px"
---

# Linear

Extracted from https://linear.app/ on 2026-10-09 by Brand Guide Generator. Colours, type and components were measured on the rendered site, and every quote was checked against the page it came from. This describes the live site; it is not an official brand guide.

## Overview

Linear is a purpose-built system for planning and building products, designed for workflows shared by teams and agents. Bring customer feedback, decisions, and code into one place to restore momentum and ship with focus.

Calmly ambitious and technically fluent. Linear pairs a clear thesis about the future of product development with concrete workflow language, restrained confidence, and a deep concern for craftsmanship.

Tone: formal, serious, technical, between understated and bold.

Audiences: Product and engineering teams; Enterprise product organizations; Teams adopting AI agents; Prospective teammates.

## Colors

7 colours, ordered by role. Share is how much of the rendered page each one covers.

- **Indigo (#5E6AD2):** Primary brand colour (`primary`), 0% of the page. Seen as: chosen from brand CSS variable; --color-brand-bg CSS variable.
- **Black (#08090A):** Page background (`background`), 38.8% of the page. Seen as: 54% of background area; 30% of icons and graphics.
- **White (#F7F8F8):** Main text (`on-surface`), 8.4% of the page. Seen as: 19% of text; logo colour.
- **Gray (#8A8F98):** Secondary text (`on-surface-variant`), 19.4% of the page. Seen as: 45% of text.
- **Light Gray (#D0D6E0):** Neutral (`neutral`), 14.1% of the page. Seen as: 5% of background area; 25% of text.
- **Gray (#62666D):** Neutral (`neutral-2`), 5.5% of the page. Seen as: 11% of text; 3% of icons and graphics.
- **Black (#101112):** Surface for cards and sections (`surface`), 11.7% of the page. Seen as: 22% of background area.
- **On primary (#FFFFFF):** Text and icons on the primary colour (`on-primary`), the higher-contrast of black and white. Computed, not measured; the site's own buttons are under Components.

## Typography

- **Inter Variable** (self-hosted, sans-serif) for display, heading, subheading, body, navigation, button. Weights 400, 510, 590. Stack: `"Inter Variable", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif`.
- **Berkeley Mono** (self-hosted, monospace) for code. Weights 400. Stack: `"Berkeley Mono", ui-monospace, "SF Mono", Menlo, monospace`.

- **Display** (`headline-display`): Inter Variable 64px, weight 510, line height 1, tracking -0.02em.
- **Heading** (`headline-lg`): Inter Variable 48px, weight 510, line height 1, tracking -0.02em.
- **Subheading** (`headline-md`): Inter Variable 20px, weight 590, line height 1.33, tracking -0.01em.
- **Body** (`body-md`): Inter Variable 15px, weight 400, line height 1.6, tracking -0.01em.
- **Navigation** (`label-md`): Inter Variable 13px, weight 400, line height 1.5.
- **Button** (`label-lg`): Inter Variable 13px, weight 510, line height 2.46.
- **Code** (`code`): Berkeley Mono 12px, weight 400, line height 1.67, tracking -0.01em.

Headings are set in sentence case.

## Shapes

Measured on buttons: 9999px corners (`rounded.full`).

## Components

- **button-primary** ("Sign up"): #E5E5E6 background, #08090A text, 9999px radius, padding 0px 12px, weight 510.

## Do's and Don'ts

- Do use #F7F8F8 on #08090A for body text on page background (18.73:1, WCAG AAA).
- Do use #FFFFFF on #5E6AD2 for text on primary (4.7:1, WCAG AA).
- Do use #8A8F98 on #08090A for muted text on page background (6.13:1, WCAG AA).
- Do use #5E6AD2 on #08090A for primary on page background (4.24:1, WCAG AA Large).
- Do (Future-facing, grounded in systems): Connect statements about the AI era to specific changes in context, coordination, or execution.
- Don't (Future-facing, grounded in systems): Promise an undefined AI revolution or present agents as magic.
- Do (Momentum without noise): Name what becomes faster and which friction is removed.
- Don't (Momentum without noise): Use breathless urgency, exclamation-heavy copy, or speed claims detached from quality.
- Do (Craft-led conviction): Describe the care, decisions, and standards behind the work.
- Don't (Craft-led conviction): Equate quality with generating more output or adding more features.
- Do (Direct and technically specific): Use precise workflow terms and get to the practical point.
- Don't (Direct and technically specific): Replace concrete actions with vague business jargon or lengthy introductory framing.
- Don't use these words in copy: magic bullet, game-changing, effortless, hustle, crush it, synergy, disrupt everything.

## Voice

- Use sentence case for headings; keep headings compact and centered on a capability or outcome.
- Pair short declarative headlines with explanatory sentences around 20–25 words; retain technical detail when it adds precision.
- Lead product copy with Linear, the system, or the action; use second person sparingly and first-person plural mainly for company perspectives.
- Use periods and restrained punctuation. Avoid routine exclamation marks and reserve questions for purposeful prompts.
- Use established product and engineering terms such as PRDs, PRs, triage, and code reviews rather than replacing them with vague abstractions.
- Write Linear with a capital L, not “Linear app”; capitalize dedicated releases as proper nouns and express numerical proof with exact figures.

Words they use: purpose-built, teams and agents, product development, shared context, planning and building, focus, ship, company priorities, software craftsmanship, quality, AI, triage.

How it sounds on their site:

> "AI increases what teams can create, but it also raises the bar for clarity and coordination." (https://linear.app/about)
> "A purpose-built system where teams and agents operate together in a shared, structured environment." (https://linear.app/about)
> "Reduces noise and restores momentum to help teams ship with high velocity and focus." (https://linear.app/)

## Logo

```svg
<svg height="22" viewBox="0 0 400 100" fill="rgb(247, 248, 248)" size="22" color="currentColor" aria-label="Linear" xmlns="http://www.w3.org/2000/svg" width="88"><path d="M12.927 16.371a1.47 1.47 0 0 0 .061 2.027l68.595 68.594c.555.555 1.446.59 2.026.062 10.058-9.152 16.372-22.348 16.372-37.018C99.98 22.402 77.579 0 49.945 0c-14.67 0-27.866 6.313-37.018 16.371M4.353 29.39a1.47 1.47 0 0 0 .309 1.648L68.943 95.32c.434.434 1.09.562 1.648.308a50 50 0 0 0 4.335-2.227c.834-.482.962-1.62.28-2.3L8.882 24.773c-.68-.68-1.818-.553-2.3.281a50 50 0 0 0-2.228 4.334m-3.9 18.407a1.48 1.48 0 0 1-.432-1.14q.2-2.986.74-5.866c.215-1.15 1.62-1.55 2.448-.722l56.703 56.704c.828.827.429 2.233-.722 2.448a50 50 0 0 1-5.865.74 1.48 1.48 0 0 1-1.14-.433zm3.48 13.963c-1.033-1.033-2.7-.143-2.322 1.268C6.221 80.22 19.761 93.76 36.954 98.37c1.41.379 2.3-1.289 1.268-2.322z" fill="rgb(247, 248, 248)"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M201.602 27.536c3.587 0 6.494-2.918 6.494-6.518s-2.907-6.517-6.494-6.517-6.493 2.918-6.493 6.518 2.907 6.517 6.493 6.517m-55.621 56.84v-69.87h11.54v59.648h31.115v10.223zm82.136-28.511v28.51h-11.166V34.857h11.026v8.487l.14-.094q1.682-3.986 5.42-6.659 3.737-2.72 9.531-2.72 5.139 0 9.344 2.299 4.204 2.25 6.727 6.611 2.523 4.362 2.523 10.692v30.903h-11.166V55.02q0-5.628-2.99-8.535-2.943-2.954-7.896-2.954-3.177 0-5.793 1.313t-4.158 4.032-1.542 6.988M329.222 83.53q3.831 1.642 8.783 1.642 4.065 0 6.961-1.032 2.898-1.078 4.766-2.86 1.915-1.782 3.037-3.893h.187v6.988h10.699V50.283q0-3.61-1.402-6.612-1.401-3-4.065-5.205-2.616-2.205-6.354-3.376-3.737-1.22-8.409-1.22-6.4 0-11.073 2.205-4.625 2.157-7.242 5.814t-2.85 8.254h10.793a7.15 7.15 0 0 1 1.495-3.846q1.308-1.687 3.551-2.626 2.242-.984 5.186-.984t4.999.984q2.102.986 3.223 2.673 1.122 1.689 1.122 3.94v.375q0 1.687-1.168 2.485-1.122.797-3.831 1.172-2.664.375-7.289.891a59 59 0 0 0-7.288 1.266q-3.504.844-6.261 2.486a12.25 12.25 0 0 0-4.298 4.36q-1.588 2.72-1.588 6.988 0 4.923 2.242 8.253 2.243 3.282 6.074 4.97m18.081-8.3q-2.71 1.454-6.681 1.454-4.019 0-6.401-1.688-2.383-1.736-2.383-4.736 0-2.345 1.308-3.799 1.356-1.454 3.551-2.297t4.765-1.173q1.869-.281 3.645-.562 1.775-.329 3.317-.61 1.542-.329 2.616-.657 1.122-.328 1.635-.703v5.533q0 2.908-1.355 5.346-1.308 2.392-4.017 3.892m26.094 9.145v-49.52h10.745v8.16h.141q1.354-4.22 4.251-6.425 2.943-2.25 7.709-2.25 1.169 0 2.102.093.982.048 1.636.094V44.61a41 41 0 0 0-2.149-.234 36 36 0 0 0-3.271-.14q-2.756 0-5.046 1.265-2.29 1.267-3.644 3.892-1.308 2.58-1.308 6.518v28.465zm-177.401 0v-49.52h11.166v49.52zm84.238-2.204q5.373 3.33 12.755 3.329 5.7 0 10.372-2.063 4.719-2.11 7.849-5.768 3.13-3.705 4.065-8.535h-10.512a10.1 10.1 0 0 1-2.29 3.892q-1.541 1.642-3.877 2.58-2.337.937-5.42.937-4.158 0-7.148-1.875-2.943-1.876-4.485-5.205-1.4-3.065-1.529-6.94h35.915V59.52q0-5.721-1.682-10.41-1.682-4.735-4.766-8.16-3.082-3.47-7.428-5.345-4.298-1.875-9.578-1.876-6.867 0-12.147 3.33t-8.27 9.19-2.99 13.412q0 7.503 2.897 13.364 2.897 5.815 8.269 9.145m23.501-32.779q-1.542-3.189-4.392-4.923-2.85-1.736-6.728-1.736-3.831 0-6.681 1.736-2.802 1.734-4.391 4.923-1.134 2.31-1.434 5.252h25.059q-.3-2.942-1.433-5.252" fill="rgb(247, 248, 248)"></path></svg>
```
