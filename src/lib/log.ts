// One-line structured logs. Ids, sizes, counts and reason labels only: never page bodies or keys.

type Fields = Record<string, string | number | boolean | null | undefined>;

export function log(event: string, fields: Fields = {}): void {
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${formatValue(value)}`);
  console.log(`[brand-guide] ${event}${parts.length ? " " + parts.join(" ") : ""}`);
}

function formatValue(value: string | number | boolean | null | undefined): string {
  if (typeof value === "string" && /\s/.test(value)) return JSON.stringify(value);
  return String(value);
}
