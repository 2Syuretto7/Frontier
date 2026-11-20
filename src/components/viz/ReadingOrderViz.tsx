"use client";

import { useState } from "react";

const LEFT = ["Models trained", "on clean text", "learn faster", "and generalise", "better than", "those trained"];
const RIGHT = ["on raw pages", "full of menus,", "cookie notices", "and repeated", "footer links", "and buttons."];
const COLX = [24, 176], CW = 130, Y0 = 18, DY = 22;

/** Lines of a two-column page as [x, y, text]; the right column sits one point lower, as scanned pages often do. */
export function pageLines(): [number, number, string][] {
  return [
    ...LEFT.map((t, i): [number, number, string] => [COLX[0], Y0 + i * DY, t]),
    ...RIGHT.map((t, i): [number, number, string] => [COLX[1], Y0 + i * DY + 1, t]),
  ];
}

/** Reading order: top to bottom across the page (merging lines within 2 points), or column by column. */
export function order(columns: boolean) {
  const ls = pageLines();
  const key = (l: [number, number, string]) => (columns ? (l[0] > 150 ? 1 : 0) * 1e4 : 0) + Math.round(l[1] / 3) * 3 * 10 + l[0] / 1000;
  return [...ls].sort((a, b) => key(a) - key(b));
}

export function ReadingOrderViz() {
  const [columns, setColumns] = useState(false);
  const ord = order(columns);
  const W = 330, H = Y0 + LEFT.length * DY + 4;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Reading order">
          {["sort by height", "find columns first"].map((m, j) => (
            <button key={m} type="button" className="seg" aria-pressed={columns === (j === 1)} onClick={() => setColumns(j === 1)}>{m}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Reading order of lines on a two-column page">
        <rect x={COLX[0] - 6} y={4} width={W - 2 * (COLX[0] - 6)} height={H - 6} fill="none" stroke="var(--border)" />
        {ord.map(([x, y, t], i) => (
          <g key={t}>
            <rect x={x} y={y - 11} width={CW} height={14} style={{ fill: "var(--text-muted)" }} opacity={0.12} />
            <text x={x + 4} y={y} className="viz-label">{t}</text>
            <text x={x - 3} y={y} textAnchor="end" className="viz-label" style={{ fill: "var(--accent)" }}>{i + 1}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {ord.slice(0, 5).map((l) => l[2]).join(" ")} ...
      </div>
      <figcaption className="viz-caption">
        Lines of a two-column page, numbered in the order an extractor emits them. Sorting all lines by height interleaves the columns
        and scrambles the text; finding the gutter between the columns first and reading each column top to bottom restores it.
      </figcaption>
    </figure>
  );
}
