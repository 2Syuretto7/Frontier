"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

export const TRUE = [1.6, 0.9, 0.4, 0.0, -0.8, -2.1];
const NAMES = ["A", "B", "C", "D", "E", "F"];
const sig = (x: number) => 1 / (1 + Math.exp(-x));

/** Simulate n random comparisons under Bradley–Terry with the true scores, then fit scores by gradient ascent. */
export function fitFrom(n: number, seed = 21) {
  const r = rand(seed);
  const comps: [number, number][] = [];
  for (let k = 0; k < n; k++) {
    const a = Math.floor(r() * 6);
    let b = Math.floor(r() * 5);
    if (b >= a) b++;
    comps.push(r() < sig(TRUE[a] - TRUE[b]) ? [a, b] : [b, a]);
  }
  const s = new Array(6).fill(0);
  for (let it = 0; it < 400; it++) {
    const g = new Array(6).fill(0);
    for (const [w, l] of comps) {
      const d = 1 - sig(s[w] - s[l]);
      g[w] += d; g[l] -= d;
    }
    for (let i = 0; i < 6; i++) s[i] += (4 / n) * g[i] - 0.002 * s[i];
    const m = s.reduce((a, b) => a + b, 0) / 6;
    for (let i = 0; i < 6; i++) s[i] -= m;
  }
  const tm = TRUE.reduce((a, b) => a + b, 0) / 6;
  return { fit: s, truth: TRUE.map((t) => t - tm) };
}

export function BradleyTerryViz() {
  const [n, setN] = useState(300);
  const { fit, truth } = useMemo(() => fitFrom(n), [n]);
  const W = 330, H = 190, X0 = 40, PW = 280, Y0 = 14, ROW = 26;
  const px = (v: number) => X0 + ((Math.max(-3.2, Math.min(3.2, v)) + 3) / 6) * PW;
  const maxErr = Math.max(...fit.map((f, i) => Math.abs(f - truth[i])));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Comparisons">
          {[30, 300, 3000].map((v) => (
            <button key={v} className="seg" aria-pressed={n === v} onClick={() => setN(v)}>{v.toLocaleString("en-IN")} comparisons</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="True and fitted Bradley–Terry scores">
        {[-3, -2, -1, 0, 1, 2, 3].map((v) => (
          <g key={v}>
            <line x1={px(v)} x2={px(v)} y1={Y0 - 4} y2={Y0 + 6 * ROW - 8} stroke="var(--border)" strokeWidth={0.5} />
            <text x={px(v)} y={Y0 + 6 * ROW + 4} textAnchor="middle" className="viz-label">{v}</text>
          </g>
        ))}
        {NAMES.map((name, i) => {
          const y = Y0 + i * ROW;
          return (
            <g key={name}>
              <text x={X0 - 8} y={y + 4} textAnchor="end" className="viz-label">{name}</text>
              <line x1={px(truth[i])} x2={px(fit[i])} y1={y} y2={y} stroke="var(--text-muted)" />
              <circle cx={px(truth[i])} cy={y} r={4} style={{ fill: "none", stroke: "var(--text)" }} />
              <circle cx={px(fit[i])} cy={y} r={4} style={{ fill: "var(--accent)" }} />
            </g>
          );
        })}
        <text x={X0} y={H - 4} className="viz-label">score, centred to mean zero; open: true, filled: fitted</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {n.toLocaleString("en-IN")} comparisons: largest error in a fitted score {maxErr.toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        Six responses with hidden quality scores are compared in random pairs, each outcome drawn from the Bradley–Terry
        model. Maximising the likelihood recovers the scores up to a shared constant, fixed here by centring them. With few
        comparisons the estimates are noisy, and items far apart in quality are hard to separate because the stronger one
        almost always wins.
      </figcaption>
    </figure>
  );
}
