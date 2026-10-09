// The brand guide contract. This is what the API returns and what every exporter
// (design tokens, CSS, Tailwind, Markdown) reads from.

import type { TinyFishCall } from "./tinyfish";
import type { PageKind } from "./pages";

export type ColorRole = "primary" | "accent" | "background" | "surface" | "text" | "muted-text" | "neutral" | "official";

export interface BrandColor {
  name: string;
  role: ColorRole;
  hex: string;
  rgb: string;
  hsl: string;
  cmyk: string;
  /** Share of what a visitor sees, across backgrounds, text and graphics (0-100). */
  share: number;
  /** Where this colour was observed, e.g. "primary button background", "--brand-blue CSS variable". */
  evidence: string[];
  bestTextColor: "#FFFFFF" | "#000000";
  contrastOnWhite: number;
  contrastOnBlack: number;
}

export interface ColorPairing {
  foreground: string;
  background: string;
  label: string;
  ratio: number;
  wcag: "AAA" | "AA" | "AA Large" | "Fail";
}

export interface FontFamily {
  name: string;
  cssName: string;
  usedFor: string[];
  stack: string;
  category: "sans-serif" | "serif" | "monospace" | "display";
  weights: number[];
  source: "Google Fonts" | "Adobe Fonts" | "self-hosted" | "system" | "unknown";
  files: string[];
  share: number;
}

export interface TypeStyle {
  role: "display" | "heading" | "subheading" | "body" | "navigation" | "button" | "code";
  family: string;
  sizePx: number;
  weight: number;
  lineHeight: number | null;
  letterSpacingEm: number;
  transform: string;
  color: string;
  sample: string;
}

export interface Quote {
  quote: string;
  sourceUrl: string;
}

export interface VoiceTrait {
  name: string;
  description: string;
  do: string;
  dont: string;
  evidence: Quote[];
}

export interface BrandGuide {
  schema: "brand-guide/v1";
  generatedAt: string;
  input: string;
  brand: {
    name: string;
    url: string;
    domain: string;
    tagline: string | null;
    elevatorPitch: string;
    boilerplate: string;
    description: string | null;
  };
  logo: {
    primary: { format: "svg" | "image"; svg: string | null; url: string | null; png: string | null; width: number; height: number; label: string } | null;
    icons: { rel: string; href: string; sizes: string | null }[];
    socialImage: string | null;
    notes: string[];
  };
  colors: {
    palette: BrandColor[];
    pairings: ColorPairing[];
    cssVariables: { name: string; value: string; hex: string }[];
    themeColor: string | null;
  };
  typography: {
    families: FontFamily[];
    scale: TypeStyle[];
  };
  components: {
    buttons: { text: string; background: string; color: string; radius: string; padding: string; weight: number }[];
  };
  voice: {
    summary: string;
    traits: VoiceTrait[];
    toneSpectrum: { formalToCasual: number; seriousToPlayful: number; technicalToPlain: number; understatedToBold: number };
    preferredWords: string[];
    wordsToAvoid: string[];
    styleRules: string[];
    metrics: WritingMetrics;
  };
  messaging: {
    audiences: { name: string; need: string }[];
    pillars: { headline: string; message: string; proof: Quote[] }[];
    proofPoints: Quote[];
    keyPhrases: string[];
    ctas: string[];
  };
  sources: {
    pages: { url: string; kind: PageKind | "home"; title: string | null; chars: number; via: "fetch" | "browser" }[];
    screenshot: string | null;
  };
  provenance: {
    tinyfish: TinyFishCall[];
    model: string;
    durationMs: number;
    verification: { quotesKept: number; quotesDropped: number; officialColorsKept: number; officialColorsDropped: number };
    warnings: string[];
  };
}

export interface WritingMetrics {
  wordsAnalysed: number;
  averageSentenceWords: number;
  readingEase: number;
  readingLevel: string;
  headingCase: "Sentence case" | "Title Case" | "UPPERCASE" | "Mixed";
  youPer100Words: number;
  wePer100Words: number;
  exclamationsPer100Sentences: number;
  questionsPer100Sentences: number;
  contractionsPer100Words: number;
}

export type ProgressEvent = { stage: string; message: string; endpoint?: "search" | "fetch" | "browser" | "llm" };
