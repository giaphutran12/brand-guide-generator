---
version: alpha
name: "Stripe"
description: "Financial infrastructure to grow your revenue."
colors:
  primary: "#533AFD"
  secondary: "#7F7DFC"
  tertiary: "#81B81A"
  accent-3: "#50617A"
  accent-4: "#F44BCC"
  background: "#FFFFFF"
  on-surface: "#061B31"
  on-surface-variant: "#64748D"
  surface: "#E5EDF5"
  neutral: "#000000"
  on-primary: "#FFFFFF"
typography:
  headline-display:
    fontFamily: "Sohne Var"
    fontSize: 48px
    fontWeight: 300
    lineHeight: 1.15
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: "Sohne Var"
    fontSize: 32px
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: -0.02em
  headline-md:
    fontFamily: "Sohne Var"
    fontSize: 26px
    fontWeight: 300
    lineHeight: 1.12
    letterSpacing: -0.01em
  body-md:
    fontFamily: "Sohne Var"
    fontSize: 16px
    fontWeight: 300
    lineHeight: 1.4
    letterSpacing: 0em
  label-md:
    fontFamily: "Sohne Var"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0em
  label-lg:
    fontFamily: "Sohne Var"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0em
rounded:
  sm: 4px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.sm}"
    padding: "15.5px 24px 16.5px"
  button-secondary:
    backgroundColor: "rgba(255, 255, 255, 0.65)"
    textColor: "{colors.primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.sm}"
    padding: "14.5px 24px 15.5px"
---

# Stripe

Extracted from https://stripe.com/ on 2026-10-09 by Brand Guide Generator. Colours, type and components were measured on the rendered site, and every quote was checked against the page it came from. This describes the live site; it is not an official brand guide.

## Overview

Build and run a global business with programmable financial infrastructure. Accept payments, manage revenue, prevent fraud, and move money across borders—from your first transaction to your billionth.

Technically precise and commercially ambitious. Stripe connects programmable infrastructure to concrete business outcomes, supporting its confidence with scale, operational detail, and a broader belief in economic growth.

Tone: formal, serious, technical, bold.

Audiences: Founders and growing businesses; Enterprises; Developers and technical teams; Platforms and marketplaces; AI businesses and agent builders.

## Colors

10 colours, ordered by role. Share is how much of the rendered page each one covers.

- **Vivid Indigo (#533AFD):** Primary brand colour (`primary`), 0.4% of the page. Seen as: chosen from call-to-action buttons; button background ("Get started").
- **Vivid Indigo (#7F7DFC):** Accent (`secondary`), 6.5% of the page. Seen as: 6% of background area; 11% of text.
- **Light Lime (#81B81A):** Accent (`tertiary`), 4% of the page. Seen as: 11% of text.
- **Blue Gray (#50617A):** Accent (`accent-3`), 3.7% of the page. Seen as: 11% of text.
- **Vivid Purple (#F44BCC):** Accent (`accent-4`), 2.6% of the page. Seen as: 6% of background area.
- **White (#FFFFFF):** Page background (`background`), 28.8% of the page. Seen as: 59% of background area; 7% of icons and graphics.
- **Deep Blue Gray (#061B31):** Main text (`on-surface`), 14.9% of the page. Seen as: 38% of text; 5% of icons and graphics.
- **Blue Gray (#64748D):** Secondary text (`on-surface-variant`), 4.4% of the page. Seen as: 12% of text.
- **Light Gray (#E5EDF5):** Surface for cards and sections (`surface`), 16.7% of the page. Seen as: 25% of background area; --hds-color-util-accent-ruby-50 CSS variable.
- **Black (#000000):** Neutral (`neutral`), 3.5% of the page. Seen as: 2% of text; 10% of icons and graphics.
- **On primary (#FFFFFF):** Text and icons on the primary colour (`on-primary`), the higher-contrast of black and white. Computed, not measured; the site's own buttons are under Components.

## Typography

- **Sohne Var** (self-hosted, sans-serif) for display, heading, subheading, body, navigation, button. Weights 300, 400. Stack: `sohne-var, "SF Pro Display", sans-serif`.

- **Display** (`headline-display`): Sohne Var 48px, weight 300, line height 1.15, tracking -0.02em.
- **Heading** (`headline-lg`): Sohne Var 32px, weight 300, line height 1.1, tracking -0.02em.
- **Subheading** (`headline-md`): Sohne Var 26px, weight 300, line height 1.12, tracking -0.01em.
- **Body** (`body-md`): Sohne Var 16px, weight 300, line height 1.4.
- **Navigation** (`label-md`): Sohne Var 14px, weight 400, line height 1.
- **Button** (`label-lg`): Sohne Var 16px, weight 400, line height 1.

Headings are set in sentence case.

## Shapes

Measured on buttons: 4px corners (`rounded.sm`).

## Components

- **button-primary** ("Get started"): #533AFD background, #FFFFFF text, 4px radius, padding 15.5px 24px 16.5px, weight 400.
- **button-secondary** ("Sign up with Google"): rgba(255, 255, 255, 0.65) background, #533AFD text, 4px radius, padding 14.5px 24px 15.5px, weight 400.

## Do's and Don'ts

- Do use #061B31 on #FFFFFF for body text on page background (17.37:1, WCAG AAA).
- Do use #FFFFFF on #533AFD for text on primary (6.19:1, WCAG AA).
- Do use #64748D on #FFFFFF for muted text on page background (4.75:1, WCAG AA).
- Do use #533AFD on #FFFFFF for primary on page background (6.19:1, WCAG AA).
- Do use #000000 on #7F7DFC for text on vivid indigo accent (6.24:1, WCAG AA).
- Do use #000000 on #81B81A for text on light lime accent (8.8:1, WCAG AAA).
- Do (Infrastructure-minded): Name the underlying capability and explain how it connects to a customer's systems or workflows.
- Don't (Infrastructure-minded): Replace technical specifics with vague promises of effortless transformation.
- Do (Outcome-led): Start with an action and its business benefit, then explain the enabling product.
- Don't (Outcome-led): List features without showing what they help a business achieve.
- Do (Measured confidence): Pair claims about scale or reliability with a number, time frame, or specific capability.
- Don't (Measured confidence): Use exclamation-heavy hype or unsupported superlatives.
- Do (First-principles ambition): Connect new capabilities to making businesses easier to start, scale, or serve globally.
- Don't (First-principles ambition): Treat innovation as novelty without an economic or practical purpose.
- Don't use these words in copy: magic, miracle, get rich quick, crush it, mind-blowing, guaranteed success, one-size-fits-all.

## Voice

- Use sentence case for headings; favor short, benefit-led headings beginning with action verbs.
- Aim for sentences around 18 words, allowing longer sentences when explaining technical capabilities or related benefits.
- Address customers as “you” and “your”; use “we” and “our” to explain Stripe’s mission and what it builds.
- Use precise financial and developer terminology when useful, and connect it to a clear business outcome.
- Use em dashes for ranges and explanatory extensions; keep exclamation marks rare and questions mainly for FAQs.
- Use numerals, percentages, and compact scale notation such as $1.9T; retain dates, units, and qualifiers with numerical claims.

Words they use: infrastructure, programmable, economic growth, grow, start and scale, global, payments, revenue, flexible, integrate, financial tools, ambitious, developer tools, AI.

How it sounds on their site:

> "Reliable, extensible infrastructure for every stack." (https://stripe.com/)
> "Stripe is programmable financial infrastructure that helps you build and run a global business." (https://stripe.com/products)
> "Safeguard your business without slowing growth" (https://stripe.com/products)

## Logo

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="60" height="25" fill="rgb(3, 19, 35)" viewBox="0 0 60 25" aria-label="Stripe logo"><path fill="rgb(6, 27, 49)" fill-rule="evenodd" d="M59.6444 14.2813h-8.062c.1843 1.9296 1.5983 2.5476 3.2032 2.5476 1.6352 0 2.9534-.3656 4.0453-.9506v3.3179c-1.1186.7115-2.5964 1.1068-4.5645 1.1068-4.011 0-6.8218-2.5122-6.8218-7.4783 0-4.19441 2.3837-7.52509 6.3017-7.52509 3.912 0 5.9537 3.28038 5.9537 7.49819 0 .3982-.0372 1.261-.0556 1.4835Zm-5.9241-5.62407c-1.0294 0-2.1739.72812-2.1739 2.58387h4.2573c0-1.85362-1.0721-2.58387-2.0834-2.58387ZM40.9547 20.303c-1.4411 0-2.322-.6087-2.9133-1.0417l-.0088 4.6271-4.1181.8755-.0014-19.19053h3.7543l.0864 1.01784c.6035-.52914 1.6114-1.29157 3.2256-1.29162 2.8925 0 5.6162 2.6052 5.6162 7.39971 0 5.2327-2.6948 7.6037-5.6409 7.6037Zm-.959-11.35573c-.9453 0-1.5376.34559-1.9669.81586l.0245 6.11967c.3997.433.9763.7813 1.9424.7813 1.5231 0 2.5437-1.6575 2.5437-3.8745 0-2.1544-1.037-3.84233-2.5437-3.84233Zm-11.7602-3.3739h4.1341V20.0088h-4.1341V5.57337Zm0-4.694699L32.3696 0v3.35821l-4.1341.87868V.878671ZM23.9198 10.2223v9.7861h-4.1156V5.57296h3.6867l.1317 1.21751c1.0035-1.7722 3.0722-1.41321 3.6209-1.21594v3.78524c-.5242-.16908-2.2894-.42779-3.3237.86253Zm-8.5525 4.7221c0 2.4275 2.5988 1.6719 3.1263 1.4609v3.3522c-.5492.3013-1.5437.5458-2.8901.5458-2.4441 0-4.2773-1.7999-4.2773-4.2379l.0173-13.17658 4.0206-.85464.0032 3.5395h3.1278V9.0857h-3.1278v5.8588-.0001Zm-4.9069.7026c0 2.9645-2.31051 4.6562-5.73464 4.6562-1.41958 0-2.92289-.2761-4.453935-.9347v-3.9319c1.382085.7516 3.093705 1.315 4.457755 1.315.91864 0 1.53106-.2459 1.53106-1.0069C6.26064 13.7786 0 14.5192 0 9.95995 0 7.04457 2.27622 5.2998 5.61655 5.2998c1.36404 0 2.72806.20934 4.09208.75351V9.9317c-1.25265-.67618-2.84332-1.05979-4.09588-1.05979-.86296 0-1.44753.24965-1.44753.8924.0001 1.85329 6.29518.97249 6.29518 5.88279v-.0001Z" clip-rule="evenodd"></path></svg>
```
