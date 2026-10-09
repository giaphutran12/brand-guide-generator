// Tone of voice and messaging. The model reads the pages TinyFish fetched and must
// cite verbatim quotes; every quote, phrase and official colour is then checked
// against the fetched text and dropped if it is not actually on the page.

import { normalizeForMatch, type CorpusPage } from "./corpus";
import { log } from "./log";
import type { Quote, WritingMetrics } from "./types";

export const DEFAULT_MODEL = "gpt-6.1-sol";

const quoteSchema = {
  type: "object",
  properties: { quote: { type: "string" }, source_url: { type: "string" } },
  required: ["quote", "source_url"],
  additionalProperties: false,
};
const strings = { type: "array", items: { type: "string" } };
const score = { type: "integer", minimum: 0, maximum: 100 };

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["brand_name", "tagline", "elevator_pitch", "boilerplate", "audiences", "voice", "messaging", "official_colors", "official_fonts"],
  properties: {
    brand_name: { type: "string" },
    tagline: { type: ["string", "null"] },
    elevator_pitch: { type: "string" },
    boilerplate: { type: "string" },
    audiences: {
      type: "array",
      items: { type: "object", properties: { name: { type: "string" }, need: { type: "string" } }, required: ["name", "need"], additionalProperties: false },
    },
    voice: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "traits", "tone_spectrum", "preferred_words", "words_to_avoid", "style_rules"],
      properties: {
        summary: { type: "string" },
        traits: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "description", "do", "dont", "evidence"],
            properties: { name: { type: "string" }, description: { type: "string" }, do: { type: "string" }, dont: { type: "string" }, evidence: { type: "array", items: quoteSchema } },
          },
        },
        tone_spectrum: {
          type: "object",
          additionalProperties: false,
          required: ["formal_to_casual", "serious_to_playful", "technical_to_plain", "understated_to_bold"],
          properties: { formal_to_casual: score, serious_to_playful: score, technical_to_plain: score, understated_to_bold: score },
        },
        preferred_words: strings,
        words_to_avoid: strings,
        style_rules: strings,
      },
    },
    messaging: {
      type: "object",
      additionalProperties: false,
      required: ["pillars", "proof_points", "key_phrases", "ctas"],
      properties: {
        pillars: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["headline", "message", "proof"],
            properties: { headline: { type: "string" }, message: { type: "string" }, proof: { type: "array", items: quoteSchema } },
          },
        },
        proof_points: { type: "array", items: quoteSchema },
        key_phrases: strings,
        ctas: strings,
      },
    },
    official_colors: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "hex", "source_url"],
        properties: { name: { type: "string" }, hex: { type: "string" }, source_url: { type: "string" } },
      },
    },
    official_fonts: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["name", "source_url"], properties: { name: { type: "string" }, source_url: { type: "string" } } },
    },
  },
} as const;

interface ModelOutput {
  brand_name: string;
  tagline: string | null;
  elevator_pitch: string;
  boilerplate: string;
  audiences: { name: string; need: string }[];
  voice: {
    summary: string;
    traits: { name: string; description: string; do: string; dont: string; evidence: { quote: string; source_url: string }[] }[];
    tone_spectrum: { formal_to_casual: number; serious_to_playful: number; technical_to_plain: number; understated_to_bold: number };
    preferred_words: string[];
    words_to_avoid: string[];
    style_rules: string[];
  };
  messaging: {
    pillars: { headline: string; message: string; proof: { quote: string; source_url: string }[] }[];
    proof_points: { quote: string; source_url: string }[];
    key_phrases: string[];
    ctas: string[];
  };
  official_colors: { name: string; hex: string; source_url: string }[];
  official_fonts: { name: string; source_url: string }[];
}

const INSTRUCTIONS = `You are a senior brand strategist writing a brand guide from a company's own website copy.
Rules:
- Base every claim on the pages provided. Do not use outside knowledge about the company.
- Every "quote" must be copied character-for-character from the page text you cite in "source_url" (a short sentence or phrase, under 200 characters). Never paraphrase inside a quote.
- tagline: the company's own headline or slogan as it appears on the HOME page, verbatim, or null if the home page has none. Never take it from careers, blog or other pages.
- elevator_pitch: one or two sentences, written in the brand's own voice.
- boilerplate: an "About <brand>" paragraph of 40-70 words a journalist could paste, factual, based only on the pages.
- voice.traits: 3 or 4 distinctive traits (not generic ones like "professional" unless strongly evidenced), each with a concrete "do" and "don't" a copywriter can follow, and 1-2 quotes as evidence.
- tone_spectrum: 0 = first word of the pair, 100 = second word. Use the writing metrics provided to calibrate.
- preferred_words: words and phrases the brand actually uses repeatedly. words_to_avoid: words that would clash with this voice.
- style_rules: 4-6 concrete mechanical rules (heading case, sentence length, person, punctuation, numbers, jargon), consistent with the metrics.
- messaging.pillars: 3 or 4 recurring themes with a one-sentence message each and 1-2 verbatim proof quotes.
- proof_points: verbatim quotes that contain hard evidence: numbers, named customers, awards, scale.
- key_phrases: short phrases (2-6 words) that appear verbatim and recur or define the brand.
- ctas: call-to-action labels used in the copy, verbatim.
- official_colors / official_fonts: ONLY values explicitly stated in the text (for example a hex code on a brand or press page). Otherwise return empty arrays.`;

export interface VoiceResult {
  brandName: string;
  tagline: string | null;
  elevatorPitch: string;
  boilerplate: string;
  audiences: { name: string; need: string }[];
  voice: {
    summary: string;
    traits: { name: string; description: string; do: string; dont: string; evidence: Quote[] }[];
    toneSpectrum: { formalToCasual: number; seriousToPlayful: number; technicalToPlain: number; understatedToBold: number };
    preferredWords: string[];
    wordsToAvoid: string[];
    styleRules: string[];
  };
  messaging: { pillars: { headline: string; message: string; proof: Quote[] }[]; proofPoints: Quote[]; keyPhrases: string[]; ctas: string[] };
  officialColors: { name: string; hex: string; sourceUrl: string }[];
  officialFonts: { name: string; sourceUrl: string }[];
  verification: { quotesKept: number; quotesDropped: number; officialColorsKept: number; officialColorsDropped: number };
  model: string;
}

export async function analyseVoice(input: {
  brandHint: string;
  pages: CorpusPage[];
  metrics: WritingMetrics;
}): Promise<VoiceResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set (needed to write the tone-of-voice section).");
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const pagesBlock = input.pages
    .filter((page) => page.text.length > 0)
    .map((page) => `<page url="${page.url}" kind="${page.kind}" title="${(page.title ?? "").replace(/"/g, "'")}">\n${page.text}\n</page>`)
    .join("\n\n");
  const userMessage = [
    `Brand: ${input.brandHint}`,
    `Writing metrics measured from these pages: ${JSON.stringify(input.metrics)}`,
    "",
    pagesBlock,
  ].join("\n");

  const startedAt = Date.now();
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      reasoning: { effort: process.env.OPENAI_REASONING_EFFORT || "low" },
      instructions: INSTRUCTIONS,
      input: userMessage,
      text: { format: { type: "json_schema", name: "brand_voice", strict: true, schema: OUTPUT_SCHEMA } },
    }),
    signal: AbortSignal.timeout(180_000),
  });
  const body = (await response.json()) as {
    output_text?: string;
    output?: { type: string; content?: { type: string; text?: string }[] }[];
    error?: { message: string };
    usage?: { input_tokens: number; output_tokens: number };
  };
  if (!response.ok) {
    log("voice.model_failed", { model, status: response.status, reason: body.error?.message?.slice(0, 160) });
    throw new Error(`Voice analysis failed (${response.status}): ${body.error?.message ?? "unknown error"}`);
  }
  const text =
    body.output_text ??
    body.output?.flatMap((item) => item.content ?? []).find((content) => content.type === "output_text")?.text ??
    "";
  const output = JSON.parse(text) as ModelOutput;
  log("voice.model_done", {
    model,
    ms: Date.now() - startedAt,
    inputChars: userMessage.length,
    inputTokens: body.usage?.input_tokens,
    outputTokens: body.usage?.output_tokens,
  });

  return verify(output, input.pages, model);
}

function verify(output: ModelOutput, pages: CorpusPage[], model: string): VoiceResult {
  const normalizedPages = pages.map((page) => ({ url: page.url, text: normalizeForMatch(page.text) }));
  const allText = normalizedPages.map((page) => page.text).join("\n");
  let quotesKept = 0, quotesDropped = 0;

  // A quote survives if it is on the page it cites, or (cited wrongly) on another fetched page.
  const checkQuotes = (quotes: { quote: string; source_url: string }[]): Quote[] =>
    quotes.flatMap((quote) => {
      const needle = normalizeForMatch(quote.quote).replace(/^["']|["']$/g, "").replace(/[.…]+$/, "");
      if (needle.length < 4) { quotesDropped++; return []; }
      const cited = normalizedPages.find((page) => page.url === quote.source_url && page.text.includes(needle));
      const anywhere = cited ?? normalizedPages.find((page) => page.text.includes(needle));
      if (!anywhere) { quotesDropped++; return []; }
      quotesKept++;
      return [{ quote: quote.quote.trim(), sourceUrl: anywhere.url }];
    });

  const onSite = (phrase: string) => allText.includes(normalizeForMatch(phrase));
  const traits = output.voice.traits.map((trait) => ({ ...trait, evidence: checkQuotes(trait.evidence) }));
  const pillars = output.messaging.pillars.map((pillar) => ({ ...pillar, proof: checkQuotes(pillar.proof) }));
  const proofPoints = checkQuotes(output.messaging.proof_points);

  const officialColors = output.official_colors
    .map((color) => ({ name: color.name, hex: normalizeHex(color.hex), sourceUrl: color.source_url }))
    .filter((color) => color.hex && allText.includes(color.hex.slice(1).toLowerCase())) as { name: string; hex: string; sourceUrl: string }[];
  const officialFonts = output.official_fonts.filter((font) => onSite(font.name)).map((font) => ({ name: font.name, sourceUrl: font.source_url }));
  const homeText = normalizedPages.find((_, index) => pages[index].kind === "home")?.text ?? "";
  const tagline = output.tagline && homeText.includes(normalizeForMatch(output.tagline)) ? output.tagline : null;

  const verification = {
    quotesKept,
    quotesDropped,
    officialColorsKept: officialColors.length,
    officialColorsDropped: output.official_colors.length - officialColors.length,
  };
  log("voice.verified", {
    ...verification,
    keyPhrasesDropped: output.messaging.key_phrases.filter((phrase) => !onSite(phrase)).length,
    taglineVerbatim: tagline !== null,
  });

  return {
    brandName: output.brand_name,
    tagline,
    elevatorPitch: output.elevator_pitch,
    boilerplate: output.boilerplate,
    audiences: output.audiences,
    voice: {
      summary: output.voice.summary,
      traits,
      toneSpectrum: {
        formalToCasual: output.voice.tone_spectrum.formal_to_casual,
        seriousToPlayful: output.voice.tone_spectrum.serious_to_playful,
        technicalToPlain: output.voice.tone_spectrum.technical_to_plain,
        understatedToBold: output.voice.tone_spectrum.understated_to_bold,
      },
      preferredWords: output.voice.preferred_words,
      wordsToAvoid: output.voice.words_to_avoid,
      styleRules: output.voice.style_rules,
    },
    messaging: {
      pillars,
      proofPoints,
      keyPhrases: output.messaging.key_phrases.filter(onSite),
      ctas: output.messaging.ctas,
    },
    officialColors,
    officialFonts,
    verification,
    model,
  };
}

function normalizeHex(hex: string): string | null {
  const match = hex.trim().match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!match) return null;
  const digits = match[1].length === 3 ? [...match[1]].map((c) => c + c).join("") : match[1];
  return `#${digits.toUpperCase()}`;
}
