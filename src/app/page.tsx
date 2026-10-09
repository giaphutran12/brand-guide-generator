import Link from "next/link";
import { Generator } from "@/components/Generator";
import { listExamples } from "@/lib/examples";

export const dynamic = "force-static";

export default async function Home() {
  const examples = await listExamples();
  return (
    <main className="shell">
      <header className="intro">
        <p className="eyebrow">Built on TinyFish Search, Fetch and Browser</p>
        <h1>Brand Guide Generator</h1>
        <p className="lead">
          Give it a company website or just a name. It reads the live site and returns a brand guide you can drop into a deck or a design tool:
          logo, colour palette, typography, tone of voice and key messaging, with every quote traced to the page it came from.
        </p>
      </header>

      <Generator />

      {examples.length > 0 && (
        <section className="gallery">
          <h2>Example guides</h2>
          <div className="gallery-grid">
            {examples.map(({ slug, guide }) => {
              const swatches = guide.colors.palette.slice(0, 5);
              return (
                <Link key={slug} href={`/g/${slug}`} className="card">
                  <span className="card-bar">
                    {swatches.map((color) => (
                      <i key={color.hex + color.role} style={{ background: color.hex }} />
                    ))}
                  </span>
                  <strong>{guide.brand.name}</strong>
                  <span className="muted small">{guide.brand.domain}</span>
                  {guide.brand.tagline && <span className="small">“{guide.brand.tagline}”</span>}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="api">
        <h2>Use it as an API</h2>
        <pre>{`# Stream progress, then the full guide (NDJSON)
curl -N -X POST /api/brand-guide -H 'Content-Type: application/json' -d '{"input":"linear.app"}'

# One finished export: json | tokens | css | tailwind | md
curl '/api/brand-guide?input=Duolingo&format=tokens'`}</pre>
      </section>
    </main>
  );
}
