"use client";

import { useEffect, useMemo, useState } from "react";
import { parseColor } from "@/lib/color";
import { cssColorToHex, EXPORTS, exportGuide, type ExportFormat } from "@/lib/exporters";
import type { BrandColor, BrandGuide, Quote } from "@/lib/types";

const ENDPOINT_LABEL: Record<string, string> = { search: "Search", fetch: "Fetch", browser: "Browser" };

export function GuideView({ guide }: { guide: BrandGuide }) {
  useWebFonts(guide);
  const primary = guide.colors.palette.find((color) => color.role === "primary");
  const heading = guide.typography.scale.find((style) => style.role === "display" || style.role === "heading");
  const headingFamily = guide.typography.families.find((family) => family.usedFor.includes("display") || family.usedFor.includes("heading"));

  return (
    <article className="guide">
      <section className="guide-cover sheet" style={{ ["--brand" as string]: primary?.hex ?? "#111" }}>
        <div className="cover-text">
          <p className="eyebrow">Brand guide · {guide.brand.domain}</p>
          <h1 style={{ fontFamily: headingFamily?.stack, fontWeight: heading?.weight, letterSpacing: heading ? `${heading.letterSpacingEm}em` : undefined }}>{guide.brand.name}</h1>
          {guide.brand.tagline && <p className="tagline">“{guide.brand.tagline}”</p>}
          <p className="pitch">{guide.brand.elevatorPitch}</p>
          <p className="meta">
            Extracted from the live site on {guide.generatedAt.slice(0, 10)} in {Math.round(guide.provenance.durationMs / 1000)}s ·{" "}
            {guide.sources.pages.length} pages read · {guide.provenance.tinyfish.length} TinyFish calls
          </p>
        </div>
        {guide.sources.screenshot && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="cover-shot" src={guide.sources.screenshot} alt={`${guide.brand.name} homepage as rendered by the TinyFish browser`} />
        )}
      </section>

      <Exports guide={guide} />

      <Section number="01" title="Logo">
        <LogoBlock guide={guide} />
      </Section>

      <Section number="02" title="Colour">
        <div className="swatches">
          {guide.colors.palette.map((color) => (
            <Swatch key={`${color.role}-${color.hex}`} color={color} />
          ))}
        </div>
        <h3 className="sub">Contrast pairings</h3>
        <div className="pairings">
          {guide.colors.pairings.map((pairing) => (
            <div key={pairing.label} className="pairing" style={{ background: pairing.background, color: pairing.foreground }}>
              <span className="pairing-sample">Aa</span>
              <span>{pairing.label}</span>
              <span className="pairing-ratio">
                {pairing.ratio}:1 · {pairing.wcag}
              </span>
            </div>
          ))}
        </div>
        {guide.colors.cssVariables.length > 0 && (
          <details className="vars">
            <summary>{guide.colors.cssVariables.length} colour variables found in the site&apos;s CSS</summary>
            <div className="var-grid">
              {guide.colors.cssVariables.map((variable) => (
                <code key={variable.name}>
                  <i style={{ background: variable.hex }} /> {variable.name}: {variable.hex}
                </code>
              ))}
            </div>
          </details>
        )}
      </Section>

      <Section number="03" title="Typography">
        <div className="families">
          {guide.typography.families.map((family) => (
            <div key={family.cssName} className="family">
              <p className="family-specimen" style={{ fontFamily: family.stack }}>
                Aa
              </p>
              <div>
                <h3 style={{ fontFamily: family.stack }}>{family.name}</h3>
                <p className="muted">
                  {family.category} · {family.source} · used for {family.usedFor.join(", ") || "supporting text"}
                </p>
                <p className="muted">Weights {family.weights.join(" · ") || "n/a"}</p>
                <code className="stack">{family.stack}</code>
              </div>
            </div>
          ))}
        </div>
        <div className="scale">
          {guide.typography.scale.map((style) => {
            const family = guide.typography.families.find((item) => item.name === style.family);
            return (
              <div key={style.role} className="scale-row">
                <div className="scale-meta">
                  <strong>{style.role}</strong>
                  <span>
                    {style.family} · {style.sizePx}px · {style.weight}
                    {style.lineHeight ? ` · ${style.lineHeight}` : ""}
                    {style.letterSpacingEm ? ` · ${style.letterSpacingEm}em` : ""}
                  </span>
                </div>
                <p
                  className="scale-sample"
                  style={{
                    fontFamily: family?.stack ?? style.family,
                    fontSize: Math.min(style.sizePx, 56),
                    fontWeight: style.weight,
                    lineHeight: style.lineHeight ?? undefined,
                    letterSpacing: `${style.letterSpacingEm}em`,
                    textTransform: style.transform as React.CSSProperties["textTransform"],
                  }}
                >
                  {style.sample || "The quick brown fox"}
                </p>
              </div>
            );
          })}
        </div>
        {guide.components.buttons.length > 0 && (
          <>
            <h3 className="sub">Buttons as rendered</h3>
            <div className="buttons">
              {guide.components.buttons.map((button) => (
                <div key={button.background + button.text} className="button-spec">
                  <span
                    className="button-sample"
                    style={{ background: button.background, color: button.color, borderRadius: button.radius, padding: button.padding, fontWeight: button.weight, fontFamily: headingFamily?.stack }}
                  >
                    {button.text}
                  </span>
                  <code>
                    bg {cssColorToHex(button.background)} · text {cssColorToHex(button.color)} · radius {button.radius}
                  </code>
                </div>
              ))}
            </div>
          </>
        )}
      </Section>

      <Section number="04" title="Tone of voice">
        <p className="lead">{guide.voice.summary}</p>
        <div className="traits">
          {guide.voice.traits.map((trait) => (
            <div key={trait.name} className="trait">
              <h3>{trait.name}</h3>
              <p>{trait.description}</p>
              <div className="rule-box do">
                <span className="rule-label">
                  <i aria-hidden>✓</i> Do
                </span>
                <p>{trait.do}</p>
              </div>
              <div className="rule-box dont">
                <span className="rule-label">
                  <i aria-hidden>✕</i> Don&apos;t
                </span>
                <p>{trait.dont}</p>
              </div>
              {trait.evidence.length > 0 && <p className="evidence-label">How it sounds on their site</p>}
              {trait.evidence.map((quote) => (
                <QuoteLine key={quote.quote} quote={quote} />
              ))}
            </div>
          ))}
        </div>
        <div className="voice-grid">
          <div>
            <h3 className="sub">Tone spectrum</h3>
            <Spectrum left="Formal" right="Casual" value={guide.voice.toneSpectrum.formalToCasual} />
            <Spectrum left="Serious" right="Playful" value={guide.voice.toneSpectrum.seriousToPlayful} />
            <Spectrum left="Technical" right="Plain" value={guide.voice.toneSpectrum.technicalToPlain} />
            <Spectrum left="Understated" right="Bold" value={guide.voice.toneSpectrum.understatedToBold} />
          </div>
          <div>
            <h3 className="sub">Measured on {guide.voice.metrics.wordsAnalysed.toLocaleString()} words</h3>
            <dl className="metrics">
              <dt>Sentence length</dt>
              <dd>{guide.voice.metrics.averageSentenceWords} words</dd>
              <dt>Reading ease</dt>
              <dd>
                {guide.voice.metrics.readingEase} · {guide.voice.metrics.readingLevel}
              </dd>
              <dt>Headings</dt>
              <dd>{guide.voice.metrics.headingCase}</dd>
              <dt>“You” vs “we”</dt>
              <dd>
                {guide.voice.metrics.youPer100Words} vs {guide.voice.metrics.wePer100Words} per 100 words
              </dd>
              <dt>Exclamations</dt>
              <dd>{guide.voice.metrics.exclamationsPer100Sentences} per 100 sentences</dd>
              <dt>Contractions</dt>
              <dd>{guide.voice.metrics.contractionsPer100Words} per 100 words</dd>
            </dl>
          </div>
        </div>
        <h3 className="sub">Style rules</h3>
        <ul className="rules">
          {guide.voice.styleRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <div className="words">
          <div>
            <h3 className="sub">Words we use</h3>
            <p className="chips use">{guide.voice.preferredWords.map((word) => <span key={word}>{word}</span>)}</p>
          </div>
          <div>
            <h3 className="sub">Words we avoid</h3>
            <p className="chips avoid">{guide.voice.wordsToAvoid.map((word) => <span key={word}>{word}</span>)}</p>
          </div>
        </div>
      </Section>

      <Section number="05" title="Messaging">
        <div className="pillars">
          {guide.messaging.pillars.map((pillar) => (
            <div key={pillar.headline} className="pillar">
              <h3>{pillar.headline}</h3>
              <p>{pillar.message}</p>
              {pillar.proof.map((quote) => (
                <QuoteLine key={quote.quote} quote={quote} />
              ))}
            </div>
          ))}
        </div>
        <div className="voice-grid">
          <div>
            <h3 className="sub">Audiences</h3>
            <ul className="rules">
              {guide.messaging.audiences.map((audience) => (
                <li key={audience.name}>
                  <strong>{audience.name}.</strong> {audience.need}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="sub">Proof points</h3>
            {guide.messaging.proofPoints.map((quote) => (
              <QuoteLine key={quote.quote} quote={quote} />
            ))}
          </div>
        </div>
        {guide.messaging.keyPhrases.length > 0 && (
          <>
            <h3 className="sub">Key phrases</h3>
            <p className="chips">{guide.messaging.keyPhrases.map((phrase) => <span key={phrase}>{phrase}</span>)}</p>
          </>
        )}
        {guide.messaging.ctas.length > 0 && (
          <>
            <h3 className="sub">Calls to action</h3>
            <p className="chips">{guide.messaging.ctas.map((cta) => <span key={cta}>{cta}</span>)}</p>
          </>
        )}
        <h3 className="sub">Boilerplate</h3>
        <p className="boilerplate">{guide.brand.boilerplate}</p>
      </Section>

      <Section number="06" title="How this was built">
        <p className="muted">
          Every fact above traces to one of these calls. Quotes were checked against the fetched text:{" "}
          {guide.provenance.verification.quotesKept} kept, {guide.provenance.verification.quotesDropped} dropped as not verbatim. Voice written by{" "}
          {guide.provenance.model}.
        </p>
        <table className="calls">
          <thead>
            <tr>
              <th>TinyFish</th>
              <th>Purpose</th>
              <th>Result</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {guide.provenance.tinyfish.map((call, index) => (
              <tr key={index}>
                <td>
                  <span className={`endpoint ${call.endpoint}`}>{ENDPOINT_LABEL[call.endpoint]}</span>
                </td>
                <td>
                  {call.purpose}
                  <br />
                  <span className="muted small">{call.input.length > 140 ? `${call.input.slice(0, 140)}…` : call.input}</span>
                </td>
                <td className="small">{call.detail}</td>
                <td className="small">{(call.ms / 1000).toFixed(1)}s</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 className="sub">Pages read</h3>
        <ul className="sources">
          {guide.sources.pages.map((page) => (
            <li key={page.url}>
              <span className="kind">{page.kind}</span>
              <span className={`endpoint ${page.via}`}>{ENDPOINT_LABEL[page.via]}</span>
              <a href={page.url} target="_blank" rel="noreferrer">
                {page.url}
              </a>
            </li>
          ))}
        </ul>
        {guide.provenance.warnings.length > 0 && (
          <ul className="warnings">
            {guide.provenance.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}
      </Section>
    </article>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="sheet">
      <header className="section-head">
        <span>{number}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function LogoBlock({ guide }: { guide: BrandGuide }) {
  const logo = guide.logo.primary;
  // Original file before the PNG clip: the clip carries the site's background behind the logo.
  const source = logo?.svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logo.svg)}` : logo?.url ?? logo?.png ?? null;
  return (
    <>
      {source ? (
        <div className="logo-tiles">
          {logoTiles(guide).map((background) => (
            <div key={background} className="logo-tile" style={{ background }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={source} alt={logo?.label || `${guide.brand.name} logo`} style={{ maxWidth: "70%", maxHeight: 96, minHeight: 28 }} />
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">No header logo was found with confidence; the site icons are below.</p>
      )}
      <ul className="notes">
        {guide.logo.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <div className="logo-downloads">
        {logo?.svg && <Download label="Logo SVG" filename={`${guide.brand.domain}-logo.svg`} content={logo.svg} type="image/svg+xml" />}
        {logo?.png && (
          <a className="button ghost" href={logo.png} download={`${guide.brand.domain}-logo.png`}>
            Logo PNG
          </a>
        )}
        {logo?.url && (
          <a className="button ghost" href={logo.url} target="_blank" rel="noreferrer">
            Logo file
          </a>
        )}
        {guide.logo.icons.slice(0, 4).map((icon) => (
          <a key={icon.href} className="icon-link" href={icon.href} target="_blank" rel="noreferrer" title={`${icon.rel} ${icon.sizes ?? ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={icon.href} alt="" width={24} height={24} />
            {icon.rel}
            {icon.sizes ? ` ${icon.sizes}` : ""}
          </a>
        ))}
      </div>
    </>
  );
}

/** Light logos go on dark tiles and vice versa, plus the brand colour, so no tile shows an invisible logo. */
function logoTiles(guide: BrandGuide): string[] {
  const primary = guide.colors.palette.find((color) => color.role === "primary")?.hex ?? "#111111";
  const fills = [...(guide.logo.primary?.svg ?? "").matchAll(/fill="(#[0-9a-f]{3,8}|rgba?\([^)]*\))"/gi)].map((match) => parseColor(match[1])).filter((color) => color !== null);
  if (fills.length === 0) return ["#FFFFFF", "#F3F3F1", "#111111"];
  const lightness = fills.reduce((sum, color) => sum + (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255, 0) / fills.length;
  return lightness > 0.6 ? ["#111111", "#2A2A2E", primary] : ["#FFFFFF", "#F3F3F1", primary];
}

function Swatch({ color }: { color: BrandColor }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="swatch"
      onClick={() => {
        navigator.clipboard?.writeText(color.hex).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
      }}
      title={color.evidence.join("\n")}
    >
      <span className="chip" style={{ background: color.hex, color: color.bestTextColor }}>
        <span className="role">{color.role}</span>
        <span className="hex">{copied ? "Copied" : color.hex}</span>
      </span>
      <span className="swatch-info">
        <strong>{color.name}</strong>
        <span>{color.rgb}</span>
        <span>{color.cmyk}</span>
        <span className="evidence">{color.evidence[0]}</span>
      </span>
    </button>
  );
}

function Spectrum({ left, right, value }: { left: string; right: string; value: number }) {
  return (
    <div className="spectrum">
      <span>{left}</span>
      <span className="track">
        <i style={{ left: `${value}%` }} />
      </span>
      <span>{right}</span>
    </div>
  );
}

function QuoteLine({ quote }: { quote: Quote }) {
  let path = quote.sourceUrl;
  try {
    path = new URL(quote.sourceUrl).pathname;
  } catch {}
  if (path === "/") path = "home";
  return (
    <blockquote className="quote">
      “{quote.quote}”{" "}
      <a href={quote.sourceUrl} target="_blank" rel="noreferrer">
        {path}
      </a>
    </blockquote>
  );
}

function Exports({ guide }: { guide: BrandGuide }) {
  const files = useMemo(
    () =>
      (Object.keys(EXPORTS) as ExportFormat[]).map((format) => ({
        format,
        ...EXPORTS[format],
        content: exportGuide(guide, format),
      })),
    [guide],
  );
  return (
    <section className="exports">
      <span className="muted">Take it with you</span>
      {files.map((file) => (
        <Download key={file.format} label={file.label} filename={`${guide.brand.domain}-${file.extension}`} content={file.content} type={file.contentType} />
      ))}
      <button type="button" className="button" onClick={() => window.print()}>
        Save as PDF deck
      </button>
    </section>
  );
}

function Download({ label, filename, content, type }: { label: string; filename: string; content: string; type: string }) {
  return (
    <button
      type="button"
      className="button ghost"
      onClick={() => {
        const url = URL.createObjectURL(new Blob([content], { type }));
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }}
    >
      {label}
    </button>
  );
}

/** Load the brand's own font files so specimens render in the real typeface where the host allows it. */
function useWebFonts(guide: BrandGuide) {
  useEffect(() => {
    const loaded: FontFace[] = [];
    for (const family of guide.typography.families) {
      const file = family.files.find((url) => /\.woff2?(\?|$)/i.test(url));
      if (!file || typeof FontFace === "undefined") continue;
      const face = new FontFace(family.cssName, `url(${JSON.stringify(file)})`, { weight: "100 900" });
      face
        .load()
        .then((ready) => {
          document.fonts.add(ready);
          loaded.push(ready);
        })
        .catch(() => console.info(`[brand-guide] font host blocked cross-origin load for ${family.name}; showing the fallback stack`));
    }
    return () => loaded.forEach((face) => document.fonts.delete(face));
  }, [guide]);
}
