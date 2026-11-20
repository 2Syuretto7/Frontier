"use client";

import { useState } from "react";

/** Blocks of one news page: [label, words, words inside links, part of the article]. */
const BLOCKS: [string, number, number, boolean][] = [
  ["top menu", 9, 9, false], ["login link", 2, 2, false], ["headline", 9, 0, true], ["byline", 5, 2, true],
  ["paragraph 1", 62, 0, true], ["paragraph 2", 85, 4, true], ["photo caption", 14, 0, true], ["paragraph 3", 47, 9, true],
  ["pull quote", 18, 0, true], ["paragraph 4", 71, 0, true], ["short paragraph", 7, 0, true], ["related stories", 36, 33, false],
  ["tag list", 8, 8, false], ["share buttons", 4, 4, false], ["newsletter box", 23, 3, false], ["cookie notice", 31, 2, false],
  ["comments header", 3, 0, false], ["footer links", 42, 40, false], ["copyright", 8, 0, false],
];
const MINW = [1, 5, 10, 20];
const MAXLD = 0.3;

/** Word-level precision and recall of keeping blocks with at least minWords words and link density at most MAXLD. */
export function scores(minWords: number) {
  let tp = 0, kept = 0, gold = 0;
  for (const [, w, l, c] of BLOCKS) {
    const keep = w >= minWords && l / w <= MAXLD;
    if (keep) kept += w;
    if (c) gold += w;
    if (keep && c) tp += w;
  }
  return { precision: tp / kept, recall: tp / gold };
}

export function BoilerplateViz() {
  const [mi, setMi] = useState(1);
  const minWords = MINW[mi];
  const { precision, recall } = scores(minWords);
  const W = 330, X0 = 30, Y0 = 8, PW = 290, PH = 130;
  const x = (w: number) => X0 + (Math.log10(w) / 2) * PW;
  const y = (ld: number) => Y0 + PH - ld * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">minimum words per block</span>
        <div className="segmented" role="group" aria-label="Minimum words">
          {MINW.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={mi === j} onClick={() => setMi(j)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + PH + 18}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Blocks by word count and link density">
        <rect x={x(minWords)} y={y(MAXLD)} width={X0 + PW - x(minWords)} height={Y0 + PH - y(MAXLD)} style={{ fill: "var(--accent)" }} opacity={0.08} />
        <line x1={X0} x2={X0 + PW} y1={y(MAXLD)} y2={y(MAXLD)} stroke="var(--text)" strokeDasharray="4 3" />
        <line x1={x(minWords)} x2={x(minWords)} y1={Y0} y2={Y0 + PH} stroke="var(--text)" strokeDasharray="4 3" />
        {BLOCKS.map(([label, w, l, c]) => {
          const keep = w >= minWords && l / w <= MAXLD;
          const cx = x(w), cy = y(l / w);
          const fill = keep ? "var(--accent)" : "var(--text-muted)";
          return c ? <circle key={label} cx={cx} cy={cy} r={3.5} style={{ fill }}><title>{label}</title></circle>
            : <rect key={label} x={cx - 3.2} y={cy - 3.2} width={6.4} height={6.4} style={{ fill }}><title>{label}</title></rect>;
        })}
        {[1, 10, 100].map((v) => <text key={v} x={x(v)} y={Y0 + PH + 13} textAnchor="middle" className="viz-label">{v}</text>)}
        {[0, 0.5, 1].map((v) => <text key={v} x={X0 - 5} y={y(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        precision {precision.toFixed(2)}, recall {recall.toFixed(2)} (in words, against the article)
      </div>
      <figcaption className="viz-caption">
        The blocks of one news page, placed by number of words (log scale) and the fraction of their text inside links. Circles belong
        to the article, squares are menus, related links, notices and footers. Keeping blocks in the shaded region, with link density at
        most 0.3, removes the link-heavy boilerplate. The cookie notice and newsletter box have many words and few links, so neither
        threshold removes them, while raising the word minimum starts to cut short parts of the article.
      </figcaption>
    </figure>
  );
}
