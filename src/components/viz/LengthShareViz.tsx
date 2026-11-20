"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const SOURCES = ["web pages", "papers", "books"];
const SPEC: [number, number, number][] = [[900, 700, 1.0], [80, 12000, 0.5], [20, 110000, 0.5]];   // count, median tokens, log spread
const BINS = 16, LO = 1.5, HI = 6.3;

/** Document lengths in tokens for each source, from log-normal distributions. */
export function lengths() {
  const rng = rand(17);
  const normal = () => Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
  return SPEC.map(([n, med, s]) => Array.from({ length: n }, () => Math.round(med * Math.exp(s * normal()))));
}

export function LengthShareViz() {
  const [byTokens, setByTokens] = useState(false);
  const ls = lengths();
  const w = (v: number) => (byTokens ? v : 1);
  const hist = ls.map((arr) => {
    const h = new Array(BINS).fill(0);
    for (const v of arr) h[Math.min(BINS - 1, Math.max(0, Math.floor(((Math.log10(v) - LO) / (HI - LO)) * BINS)))] += w(v);
    return h;
  });
  const totals = ls.map((arr) => arr.reduce((a, v) => a + w(v), 0));
  const all = totals.reduce((a, b) => a + b, 0);
  const stack = Array.from({ length: BINS }, (_, b) => hist.reduce((a, h) => a + h[b], 0));
  const mx = Math.max(...stack);
  const W = 330, X0 = 20, Y0 = 6, PW = 300, PH = 120, bw = PW / BINS;
  const fills = ["var(--text-muted)", "var(--text)", "var(--accent)"];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="What to count">
          {["count documents", "count tokens"].map((m, j) => (
            <button key={m} type="button" className="seg" aria-pressed={byTokens === (j === 1)} onClick={() => setByTokens(j === 1)}>{m}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + PH + 18}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of document lengths by source">
        {Array.from({ length: BINS }, (_, b) => {
          let base = Y0 + PH;
          return hist.map((h, s) => {
            const hh = (h[b] / mx) * PH;
            base -= hh;
            return <rect key={`${b}-${s}`} x={X0 + b * bw + 1} y={base} width={bw - 2} height={hh} style={{ fill: fills[s] }} opacity={s === 0 ? 0.6 : 0.85} />;
          });
        })}
        {[2, 3, 4, 5, 6].map((e) => (
          <text key={e} x={X0 + ((e - LO) / (HI - LO)) * PW} y={Y0 + PH + 13} textAnchor="middle" className="viz-label">10<tspan dy={-4} fontSize={8}>{e}</tspan></text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        share of {byTokens ? "tokens" : "documents"}: {SOURCES.map((s, j) => `${s} ${((100 * totals[j]) / all).toFixed(1)}%`).join(", ")}
      </div>
      <figcaption className="viz-caption">
        Lengths in tokens, on a log scale, of 1000 synthetic documents: web pages in grey, papers in dark and books in colour. Counted
        by document, books barely register; counted by token, which is what a model trains on, they are a large share of the corpus.
      </figcaption>
    </figure>
  );
}
