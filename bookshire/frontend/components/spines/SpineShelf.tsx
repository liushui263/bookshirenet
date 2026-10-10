"use client";

import { useId, useState, type ReactNode } from "react";

// A book as the spine shelf needs it; discovery books and catalog books both map to this.
export type SpineItem = {
  id: string;
  title: string;
  authors: string[];
  cover?: string | null;
  publisher?: string | null;
  published?: string | null;
  isbn?: string | null;
  pages?: number | null;
  language?: string | null;
  description?: string | null;
  // Extra name/value rows after the bibliographic ones (e.g. condition on My Shelf).
  extraFacts?: [string, string][];
  link?: { href: string; label: string; external?: boolean };
};

type SpineShelfProps = {
  items: SpineItem[];
  label: string;
  renderActions?: (item: SpineItem) => ReactNode;
  // Books per shelf board; longer lists stack into a bookcase and the
  // detail panel opens under the board holding the active book.
  perRow?: number;
};

// Cloth colors for book spines: [background, text].
const SPINE_COLORS: [string, string][] = [
  ["#6e1f22", "#f3e3c3"], // oxblood
  ["#1f2f4d", "#efe2c2"], // navy
  ["#24432f", "#f1e6c9"], // forest
  ["#c8962e", "#2b1d07"], // mustard
  ["#1f5a5b", "#f2e8cf"], // teal
  ["#4b2a45", "#f1e2cc"], // plum
  ["#3d4650", "#ece3cf"], // slate
  ["#6b3e22", "#f4e5c8"], // chestnut
  ["#e6dbc2", "#3a2a18"], // cream
  ["#a2482b", "#f8ead2"], // terracotta
  ["#5d5f2a", "#f1e9cc"], // olive
  ["#22252b", "#e7d6b0"], // ink
];

const CJK = /[぀-ヿ㐀-鿿豈-﫿가-힯]/;

function hash(text: string) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function spineStyle(item: SpineItem) {
  const h = hash(item.id + item.title);
  const [background, color] = SPINE_COLORS[h % SPINE_COLORS.length];
  const long = item.title.length > (CJK.test(item.title) ? 9 : 18);
  const width = (long ? 52 : 40) + ((h >> 4) % 4) * 3;
  const height = 236 + ((h >> 8) % 6) * 9;
  return { background, color, width, height, long };
}

// CJK spines stack upright characters one per line, which renders the same with
// every font (vertical writing modes depend on the font's vertical metrics).
function SpineText({ text, className }: { text: string; className: string }) {
  if (!CJK.test(text)) {
    return <span className={className}>{text}</span>;
  }
  return (
    <span className={`${className} spine-stack`}>
      {Array.from(text.replace(/\s+/g, "")).map((char, index) => (
        <span key={index}>{char}</span>
      ))}
    </span>
  );
}

function yearOf(published?: string | null) {
  return published?.match(/\d{4}/)?.[0] ?? null;
}

export function SpineShelf({ items, label, renderActions, perRow }: SpineShelfProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? null);
  const panelId = useId();
  const active = items.find((item) => item.id === activeId) ?? items[0];

  if (!active) return null;

  const year = yearOf(active.published);
  const facts: [string, string][] = [];
  if (active.authors.length) facts.push(["Author", active.authors.join(", ")]);
  if (active.publisher) facts.push(["Publisher", active.publisher]);
  if (year) facts.push(["Published", active.published && active.published.length > 4 ? active.published : year]);
  if (active.isbn) facts.push(["ISBN", active.isbn]);
  if (active.pages) facts.push(["Pages", String(active.pages)]);
  facts.push(...(active.extraFacts ?? []));

  const size = perRow && perRow > 0 ? perRow : items.length;
  const rows: SpineItem[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));

  const detail = (
    <div className="spine-detail" id={panelId} aria-live="polite">
      <div className="spine-detail-cover">
        {active.cover ? (
          // Covers come from several hosts (Google Books, Open Library, uploads).
          // eslint-disable-next-line @next/next/no-img-element
          <img src={active.cover} alt={`Cover of ${active.title}`} loading="lazy" />
        ) : (
          <div
            className="spine-detail-cover-blank"
            style={{ background: spineStyle(active).background, color: spineStyle(active).color }}
          >
            {active.title}
          </div>
        )}
      </div>
      <div className="spine-detail-body">
        <h3>{active.title}</h3>
        <dl className="spine-facts">
          {facts.map(([name, value]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {active.description ? <p className="spine-description">{active.description}</p> : null}
        <div className="spine-actions">
          {active.link ? (
            <a
              className="spine-link"
              href={active.link.href}
              {...(active.link.external ? { target: "_blank", rel: "noreferrer" } : {})}
            >
              {active.link.label}
            </a>
          ) : null}
          {renderActions?.(active)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="spine-shelf">
      {rows.map((row, rowIndex) => (
        <div className="spine-board" key={rowIndex}>
          <div
            className="spine-row"
            role="list"
            aria-label={rows.length > 1 ? `${label} (${rowIndex + 1})` : label}
          >
            {row.map((item) => {
              const style = spineStyle(item);
              const isActive = item.id === active.id;
              return (
                <div role="listitem" key={item.id} className="spine-slot">
                  <button
                    type="button"
                    className={`spine${isActive ? " spine-active" : ""}${style.long ? " spine-long" : ""}`}
                    style={{
                      background: style.background,
                      color: style.color,
                      width: style.width,
                      height: style.height,
                    }}
                    aria-label={`${item.title}${item.authors[0] ? `, ${item.authors[0]}` : ""}`}
                    aria-controls={panelId}
                    aria-pressed={isActive}
                    onMouseEnter={() => setActiveId(item.id)}
                    onFocus={() => setActiveId(item.id)}
                    onClick={() => setActiveId(item.id)}
                  >
                    <span className="spine-band" aria-hidden="true" />
                    <SpineText className="spine-title" text={item.title} />
                    {item.authors[0] ? <SpineText className="spine-author" text={item.authors[0]} /> : null}
                    <span className="spine-band spine-band-bottom" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="spine-plank" aria-hidden="true" />
          {row.some((item) => item.id === active.id) ? detail : null}
        </div>
      ))}
    </div>
  );
}
