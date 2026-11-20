"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

type Doc = { good: boolean; words: number; meanLen: number; symbols: number; alpha: number; stop: number; dupLines: number };
const RULES: [string, (d: Doc) => boolean][] = [
  ["length", (d) => d.words >= 50 && d.words <= 100000],
  ["word length", (d) => d.meanLen >= 3 && d.meanLen <= 10],
  ["symbols", (d) => d.symbols <= 0.1],
  ["alphabetic", (d) => d.alpha >= 0.8],
  ["stop words", (d) => d.stop >= 2],
  ["repeated lines", (d) => d.dupLines <= 0.3],
];

/** 400 synthetic web documents: prose, link lists, number tables, short snippets and templated spam. */
export function docs(): Doc[] {
  const rng = rand(33);
  const u = (a: number, b: number) => a + (b - a) * rng();
  const out: Doc[] = [];
  const make = (k: number, f: () => Doc) => { for (let i = 0; i < k; i++) out.push(f()); };
  make(200, () => ({ good: true, words: Math.round(Math.exp(u(3.7, 8))), meanLen: u(4, 6), symbols: u(0, 0.07), alpha: u(0.83, 0.99), stop: Math.round(u(1.3, 8)), dupLines: u(0, 0.15) }));
  make(60, () => ({ good: false, words: Math.round(Math.exp(u(3, 6))), meanLen: u(3, 8), symbols: u(0, 0.3), alpha: u(0.75, 0.95), stop: Math.round(u(0, 3)), dupLines: u(0, 0.5) }));
  make(50, () => ({ good: false, words: Math.round(Math.exp(u(4, 7))), meanLen: u(2, 4), symbols: u(0, 0.05), alpha: u(0.2, 0.7), stop: Math.round(u(0, 2)), dupLines: u(0, 0.2) }));
  make(50, () => ({ good: false, words: Math.round(u(5, 60)), meanLen: u(3.5, 6), symbols: u(0, 0.1), alpha: u(0.8, 1), stop: Math.round(u(0, 5)), dupLines: 0 }));
  make(40, () => ({ good: false, words: Math.round(Math.exp(u(5, 8))), meanLen: u(4, 6), symbols: u(0, 0.15), alpha: u(0.8, 0.95), stop: Math.round(u(2, 6)), dupLines: u(0.2, 0.8) }));
  return out;
}

export function HeuristicFunnelViz() {
  const [on, setOn] = useState(RULES.map(() => true));
  const all = docs();
  const stages = [all];
  RULES.forEach(([, f], i) => { const prev = stages[stages.length - 1]; stages.push(on[i] ? prev.filter(f) : prev); });
  const last = stages[stages.length - 1];
  const goodAll = all.filter((d) => d.good).length, goodKept = last.filter((d) => d.good).length;
  const W = 330, X0 = 92, BH = 13, GAP = 5, Y0 = 4, PW = 200;
  const x = (v: number) => (v / all.length) * PW;
  const labels = ["all documents", ...RULES.map(([n]) => n)];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {RULES.map(([n], i) => (
          <button key={n} type="button" className="seg" aria-pressed={on[i]} onClick={() => setOn(on.map((v, j) => (j === i ? !v : v)))}>{n}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + labels.length * (BH + GAP)}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Documents remaining after each filter">
        {stages.map((s, i) => {
          const y = Y0 + i * (BH + GAP);
          const g = s.filter((d) => d.good).length;
          return (
            <g key={labels[i]} opacity={i > 0 && !on[i - 1] ? 0.4 : 1}>
              <text x={X0 - 6} y={y + BH - 3} textAnchor="end" className="viz-label">{labels[i]}</text>
              <rect x={X0} y={y} width={x(g)} height={BH} style={{ fill: "var(--accent)" }} opacity={0.85} />
              <rect x={X0 + x(g)} y={y} width={x(s.length - g)} height={BH} style={{ fill: "var(--text-muted)" }} opacity={0.6} />
              <text x={X0 + x(s.length) + 4} y={y + BH - 3} className="viz-label">{s.length}</text>
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        kept {last.length}; {((100 * goodKept) / Math.max(last.length, 1)).toFixed(0)}% of them prose; {((100 * goodKept) / goodAll).toFixed(0)}% of the prose kept
      </div>
      <figcaption className="viz-caption">
        Synthetic web documents passing a sequence of Gopher-style rules; coloured parts of the bars are well-formed prose, grey parts
        link lists, tables of numbers, snippets and templated spam. Each button switches one rule on or off. Every rule removes some
        junk the others miss, and a few good documents with them.
      </figcaption>
    </figure>
  );
}
