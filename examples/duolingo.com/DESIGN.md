---
version: alpha
name: "Duolingo"
description: "free. fun. effective."
colors:
  primary: "#58CC02"
  secondary: "#1CB0F6"
  background: "#FFFFFF"
  on-surface: "#4B4B4B"
  on-surface-variant: "#777777"
  neutral: "#E5E5E5"
  neutral-2: "#000000"
  on-primary: "#000000"
typography:
  headline-display:
    fontFamily: "Duolingo Sans"
    fontSize: 32px
    fontWeight: 700
    letterSpacing: 0em
  headline-lg:
    fontFamily: "Feather"
    fontSize: 48px
    fontWeight: 700
    letterSpacing: 0em
  body-md:
    fontFamily: "Duolingo Sans"
    fontSize: 17px
    fontWeight: 500
    lineHeight: 1.41
    letterSpacing: 0em
  label-md:
    fontFamily: "Duolingo Sans"
    fontSize: 15px
    fontWeight: 700
    letterSpacing: 0.05em
  label-lg:
    fontFamily: "Duolingo Sans"
    fontSize: 15px
    fontWeight: 700
    letterSpacing: 0.05em
rounded:
  lg: 12px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.lg}"
    padding: "0px 16px"
---

# Duolingo

Extracted from https://www.duolingo.com/ on 2026-10-09 by Brand Guide Generator. Colours, type and components were measured on the rendered site, and every quote was checked against the page it came from. This describes the live site; it is not an official brand guide.

## Overview

Learn a language with quick, bite-sized lessons that make serious learning fun. Research-backed teaching methods, personalized learning, and game-like features help you build a habit and gain real-world communication skills.

Duolingo pairs playful encouragement with learning science. It speaks directly to learners, makes progress feel achievable, and explains practical benefits without losing its sense of fun.

Tone: casual, playful, plain-spoken, between understated and bold.

Audiences: Language learners; Employers and team administrators; English test takers; Curious learners.

## Colors

7 colours, ordered by role. Share is how much of the rendered page each one covers.

- **Light Lime (#58CC02):** Primary brand colour (`primary`), 4.6% of the page. Seen as: chosen from call-to-action buttons; 12% of text.
- **Light Blue (#1CB0F6):** Accent (`secondary`), 1.8% of the page. Seen as: 6% of text.
- **White (#FFFFFF):** Page background (`background`), 41% of the page. Seen as: 100% of background area; 2% of text.
- **Dark Gray (#4B4B4B):** Main text (`on-surface`), 3.5% of the page. Seen as: 11% of text.
- **Gray (#777777):** Secondary text (`on-surface-variant`), 21.7% of the page. Seen as: 69% of text.
- **Light Gray (#E5E5E5):** Neutral (`neutral`), 5.9% of the page.
- **Black (#000000):** Neutral (`neutral-2`), 18.7% of the page. Seen as: 79% of icons and graphics.
- **On primary (#000000):** Text and icons on the primary colour (`on-primary`), the higher-contrast of black and white. Computed, not measured; the site's own buttons are under Components.

## Typography

- **Duolingo Sans** (self-hosted, sans-serif) for display, body, navigation, button. Weights 500, 700. Stack: `duolingo-sans, sans-serif`.
- **Feather** (self-hosted, sans-serif) for heading. Weights 700. Stack: `feather, sans-serif`.

- **Display** (`headline-display`): Duolingo Sans 32px, weight 700.
- **Heading** (`headline-lg`): Feather 48px, weight 700.
- **Body** (`body-md`): Duolingo Sans 17px, weight 500, line height 1.41.
- **Navigation** (`label-md`): Duolingo Sans 15px, weight 700, tracking 0.05em, uppercase.
- **Button** (`label-lg`): Duolingo Sans 15px, weight 700, tracking 0.05em, uppercase.

Headings are set in sentence case.

## Shapes

Measured on buttons: 12px corners (`rounded.lg`).

## Components

- **button-primary** ("GET STARTED"): #58CC02 background, #FFFFFF text, 12px radius, padding 0px 16px, weight 700.

## Do's and Don'ts

- Do use #4B4B4B on #FFFFFF for body text on page background (8.72:1, WCAG AAA).
- Do use #000000 on #58CC02 for text on primary (10.05:1, WCAG AAA).
- Do use #777777 on #FFFFFF for muted text on page background (4.48:1, WCAG AA Large).
- Don't use #58CC02 on #FFFFFF for text (primary on page background): 2.09:1 fails WCAG.
- Do use #000000 on #1CB0F6 for text on light blue accent (8.59:1, WCAG AAA).
- Do (Playful with a purpose): Connect playful features or short learning breaks to progress, skills, or habit-building.
- Don't (Playful with a purpose): Use jokes or game language without explaining the learning benefit.
- Do (Science made approachable): Name the scientific foundation and immediately explain what it helps learners do.
- Don't (Science made approachable): Bury the benefit under academic terminology or imply unsupported results.
- Do (Progress-positive): Emphasize achievable steps, encouragement, and continued progress.
- Don't (Progress-positive): Shame learners for mistakes or frame learning as a test of personal worth.
- Do (Curious and learner-led): Use real learner questions as headings and address the reader directly.
- Don't (Curious and learner-led): Talk down to beginners or assume readers already know specialist terms.
- Don't use these words in copy: effortless mastery, guaranteed fluency, punishment, failure, elite-only, pedagogical optimization, enterprise synergies.

## Voice

- Use sentence-case editorial headings and lowercase promotional headings; avoid title case.
- Keep explanatory sentences near 19 words on average, with short benefit-led headings to break up longer copy.
- Address readers as 'you' and 'your'; use 'we' when explaining how Duolingo supports learning.
- Use questions frequently in advice and FAQs, rather than making every promotional statement a question.
- Use contractions for a conversational feel and reserve exclamation marks for occasional enthusiastic emphasis.
- Keep technical terms tied to plain-language benefits; use numerals for quantities and uppercase for prominent CTA labels.

Words they use: fun, effective, learning, progress, bite-sized, personalized, learners, research, science, everyone, get started.

How it sounds on their site:

> "serious learning, made fun for all" (https://www.duolingo.com/business)
> "Short, varied lessons make it fun to take a learning break" (https://www.duolingo.com/business)
> "Learning with Duolingo is fun, and research shows that it works!" (https://www.duolingo.com/)

## Logo

- https://d35aaqx5ub95lt.cloudfront.net/images/splash/f92d5f2f7d56636846861c458c0d0b6c.svg
