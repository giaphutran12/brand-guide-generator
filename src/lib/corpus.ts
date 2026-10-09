// Cleans fetched Markdown into readable copy and measures how the brand writes.
// The measurements are deterministic so tone claims rest on numbers, not vibes.

import type { WritingMetrics } from "./types";

export interface CorpusPage {
  url: string;
  kind: string;
  title: string | null;
  text: string;
  via: "fetch" | "browser";
}

const PER_PAGE_CHARS = 6_000;
const TOTAL_CHARS = 32_000;

/** Strip Markdown furniture and lines repeated across pages (nav, footer, cookie copy). */
export function cleanPages(pages: CorpusPage[]): CorpusPage[] {
  const lineCounts = new Map<string, number>();
  const splitPages = pages.map((page) => {
    const lines = page.text
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/<[^>]+>/g, " ")
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter((line) => line.replace(/[#*>\-|_`]/g, "").trim().length > 2);
    for (const line of new Set(lines)) lineCounts.set(line, (lineCounts.get(line) ?? 0) + 1);
    return { page, lines };
  });

  let budget = TOTAL_CHARS;
  return splitPages.map(({ page, lines }) => {
    const unique = pages.length > 2 ? lines.filter((line) => (lineCounts.get(line) ?? 0) < Math.ceil(pages.length * 0.6)) : lines;
    const text = unique.join("\n").slice(0, Math.min(PER_PAGE_CHARS, Math.max(budget, 0)));
    budget -= text.length;
    return { ...page, text };
  });
}

export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”″]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/[   ]/g, " ")
    .replace(/[*_#`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function measureWriting(pages: CorpusPage[]): WritingMetrics {
  const prose = pages.flatMap((page) => page.text.split("\n")).filter((line) => !line.startsWith("#") && !line.startsWith("|"));
  const headings = pages.flatMap((page) => page.text.split("\n")).filter((line) => /^#{1,4}\s/.test(line)).map((line) => line.replace(/^#+\s*/, ""));
  const text = prose.join(" ");
  const words = text.match(/[A-Za-z][A-Za-z'’-]*/g) ?? [];
  const sentences = text.split(/(?<=[.!?])\s+/).filter((sentence) => /[A-Za-z]/.test(sentence) && sentence.split(/\s+/).length >= 3);
  const wordCount = Math.max(words.length, 1);
  const sentenceCount = Math.max(sentences.length, 1);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const per100 = (count: number, base: number) => Math.round((count / base) * 1000) / 10;
  const countMatches = (pattern: RegExp) => (text.match(pattern) ?? []).length;

  const averageSentenceWords = Math.round((wordCount / sentenceCount) * 10) / 10;
  const readingEase = Math.round(206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / wordCount));

  return {
    wordsAnalysed: words.length,
    averageSentenceWords,
    readingEase,
    readingLevel: readingEase >= 70 ? "Easy (general audience)" : readingEase >= 50 ? "Plain (high-school level)" : readingEase >= 30 ? "Dense (college level)" : "Very dense (specialist)",
    headingCase: headingCase(headings),
    youPer100Words: per100(countMatches(/\b(you|your|you're|yours)\b/gi), wordCount),
    wePer100Words: per100(countMatches(/\b(we|our|us|we're|ours)\b/gi), wordCount),
    exclamationsPer100Sentences: per100(countMatches(/!/g), sentenceCount),
    questionsPer100Sentences: per100(countMatches(/\?/g), sentenceCount),
    contractionsPer100Words: per100(countMatches(/\b\w+['’](s|re|ve|ll|d|t|m)\b/gi), wordCount),
  };
}

function headingCase(headings: string[]): WritingMetrics["headingCase"] {
  const scored = headings.filter((heading) => heading.split(/\s+/).length >= 3).slice(0, 80);
  if (scored.length === 0) return "Mixed";
  let sentence = 0, title = 0, upper = 0;
  for (const heading of scored) {
    const words = heading.split(/\s+/).filter((word) => /^[A-Za-z]/.test(word));
    if (heading === heading.toUpperCase() && /[A-Z]/.test(heading)) upper++;
    else if (words.slice(1).filter((word) => word.length > 3).every((word) => /^[A-Z]/.test(word))) title++;
    else if (words.slice(1).filter((word) => word.length > 3).filter((word) => /^[a-z]/.test(word)).length >= 1) sentence++;
  }
  const max = Math.max(sentence, title, upper);
  if (max / scored.length < 0.6) return "Mixed";
  return max === sentence ? "Sentence case" : max === title ? "Title Case" : "UPPERCASE";
}

function countSyllables(word: string): number {
  const lower = word.toLowerCase().replace(/[^a-z]/g, "");
  if (lower.length <= 3) return 1;
  const groups = lower.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "").match(/[aeiouy]{1,2}/g);
  return Math.max(groups?.length ?? 1, 1);
}
