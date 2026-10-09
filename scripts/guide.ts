// Usage: npm run guide -- <url or company name> [outDir]
// Writes <outDir>/<slug>/brand.json plus tokens, CSS, Tailwind and Markdown exports.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { exportGuide, EXPORTS, type ExportFormat } from "../src/lib/exporters";
import { generateBrandGuide } from "../src/lib/guide";

export async function writeGuide(input: string, outDir: string) {
  const guide = await generateBrandGuide(input, (event) => console.log(`  [${event.stage}] ${event.message}`));
  const slug = guide.brand.domain.replace(/[^a-z0-9.-]/gi, "-");
  const dir = path.join(outDir, slug);
  await mkdir(dir, { recursive: true });
  for (const format of Object.keys(EXPORTS) as ExportFormat[]) {
    await writeFile(path.join(dir, EXPORTS[format].extension), exportGuide(guide, format));
  }
  console.log(`wrote ${dir}`);
  return { guide, slug };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [input, outDir = "examples"] = process.argv.slice(2);
  if (!input) {
    console.error("Usage: npm run guide -- <url or company name> [outDir]");
    process.exit(1);
  }
  writeGuide(input, outDir).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
