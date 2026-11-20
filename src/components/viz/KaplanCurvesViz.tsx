"use client";

import { useState } from "react";

const NC = 8.8e13, DC = 5.4e13, AN = 0.076, AD = 0.095;

/** Kaplan and colleagues' joint fit, losses in nats per token. */
export function lossND(N: number, D: number) {
  return Math.pow(Math.pow(NC / N, AN / AD) + DC / D, AD);
}

/** Tokens at which L(N, D) is within a factor (1 + eps) of its plateau L(N). */
export function tokensToPlateau(N: number, eps: number) {
  return DC / ((Math.pow(1 + eps, 1 / AD) - 1) * Math.pow(NC / N, AN / AD));
}

const NS = [1e7, 1e8, 1e9, 1e10];
const COLS = ["var(--code-string)", "var(--code-function)", "var(--accent)", "var(--code-number)"];

export function KaplanCurvesViz() {
  const [sel, setSel] = useState(1e9);
  const W = 330, H = 170, X0 = 30, PW = 290, Y0 = 8, PH = 130;
  const lx0 = 8, lx1 = 13, L0 = 1.8, L1 = 4.2;
  const px = (d: number) => X0 + ((Math.log10(d) - lx0) / (lx1 - lx0)) * PW;
  const py = (l: number) => Y0 + PH - ((Math.min(L1, Math.max(L0, l)) - L0) / (L1 - L0)) * PH;
  const ds = Array.from({ length: 61 }, (_, i) => Math.pow(10, lx0 + ((lx1 - lx0) * i) / 60));
  const plateau = Math.pow(NC / sel, AN);
  const d5 = tokensToPlateau(sel, 0.05);
  const fmt = (x: number) => (x >= 1e12 ? `${(x / 1e12).toFixed(1)}T` : x >= 1e9 ? `${(x / 1e9).toFixed(1)}B` : `${(x / 1e6).toFixed(0)}M`);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Model size">
          {NS.map((n) => (
            <button key={n} className="seg" aria-pressed={sel === n} onClick={() => setSel(n)}>N = {fmt(n)}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Loss against training tokens for four model sizes under Kaplan's fit">
        {[2, 3, 4].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(v) + 3} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        {[8, 9, 10, 11, 12, 13].map((e) => (
          <text key={e} x={px(Math.pow(10, e))} y={Y0 + PH + 12} textAnchor={e === 13 ? "end" : "middle"} className="viz-label">{fmt(Math.pow(10, e))}</text>
        ))}
        <polyline points={ds.map((d) => `${px(d).toFixed(1)},${py(Math.pow(DC / d, AD)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" />
        {NS.map((n, j) => (
          <polyline key={n} points={ds.map((d) => `${px(d).toFixed(1)},${py(lossND(n, d)).toFixed(1)}`).join(" ")} fill="none" style={{ stroke: COLS[j] }} strokeWidth={n === sel ? 2.4 : 1} opacity={n === sel ? 1 : 0.55} />
        ))}
        {d5 <= 1e13 ? <circle cx={px(d5)} cy={py(1.05 * plateau)} r={3.5} fill="var(--text)" /> : null}
        <text x={X0} y={H - 2} className="viz-label">training tokens (log); dashed: unlimited parameters</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        N = {fmt(sel)}: within 5% of its plateau after {fmt(d5)} tokens ({(d5 / sel).toFixed(0)} tokens per parameter)
      </div>
      <figcaption className="viz-caption">
        Kaplan and colleagues&apos; fit L(N, D) for four model sizes (non-embedding parameters). Each curve follows the data-limited
        line at first, then flattens to a plateau set by its size. Larger models reach any given loss with fewer tokens, which
        led the authors to recommend spending extra compute mostly on model size and stopping well before convergence.
      </figcaption>
    </figure>
  );
}
