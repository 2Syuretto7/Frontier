"use client";

import { useMemo, useState } from "react";
import { makeRng } from "./ml";

const D = 200, LR = 0.01, T = 3000;

/** Norm of x under x ← (1 − ηλ)x − η·u with random sign updates u, from zero and from every coordinate 0.5. */
export function wdNorms(wd: number) {
  const rng = makeRng(5);
  const a = new Float64Array(D), b = new Float64Array(D).fill(0.5);
  const na: number[] = [], nb: number[] = [];
  for (let t = 0; t < T; t++) {
    let sa = 0, sb = 0;
    for (let i = 0; i < D; i++) {
      const u = rng() < 0.5 ? -1 : 1;
      a[i] = (1 - LR * wd) * a[i] - LR * u;
      b[i] = (1 - LR * wd) * b[i] - LR * u;
      sa += a[i] * a[i];
      sb += b[i] * b[i];
    }
    na.push(Math.sqrt(sa));
    nb.push(Math.sqrt(sb));
  }
  return { na, nb, eq: Math.sqrt((D * LR) / (wd * (2 - LR * wd))) };
}

export function WdEquilibriumViz() {
  const [wd, setWd] = useState(0.2);
  const r = useMemo(() => wdNorms(wd), [wd]);
  const W = 300, H = 160, X0 = 34, PW = W - 42, PH = 136, YMAX = 8;
  const sx = (t: number) => X0 + (t / T) * PW;
  const sy = (n: number) => 8 + (1 - Math.min(n, YMAX) / YMAX) * PH;
  const line = (a: number[]) => a.filter((_, t) => t % 10 === 0).map((n, j) => `${sx(j * 10)},${sy(n)}`).join(" ");
  const tail = r.na.slice(-1000).reduce((s, v) => s + v, 0) / 1000;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">weight decay λ (η = 0.01)</span>
        {[0.05, 0.2, 1].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={wd === v} onClick={() => setWd(v)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Weight norm under AdamW-style updates approaching its equilibrium from below and above">
        <line x1={X0} y1={sy(r.eq)} x2={X0 + PW} y2={sy(r.eq)} stroke="var(--danger)" strokeDasharray="4 3" />
        {1 / (LR * wd) < T && <line x1={sx(1 / (LR * wd))} y1={8} x2={sx(1 / (LR * wd))} y2={8 + PH} stroke="var(--border)" strokeDasharray="2 3" />}
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={line(r.na)} />
        <polyline fill="none" stroke="var(--text)" strokeWidth={2} points={line(r.nb)} />
        {[0, 1000, 2000, 3000].map((t) => (
          <text key={t} x={sx(t)} y={H + 12} textAnchor="middle" className="viz-label">{t}</text>
        ))}
        {[0, 2, 4, 6, 8].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`τ = 1/(ηλ) = ${(1 / (LR * wd)).toFixed(0)} steps; equilibrium √(dη/(λ(2 − ηλ))) = ${r.eq.toFixed(2)}; measured ${tail.toFixed(2)}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The norm of a 200-dimensional weight under decoupled decay and sign-like updates of size η, started from zero (blue)
        and from a large initialisation (black). Both settle at the same equilibrium (red), reached on the timescale
        τ = 1/(ηλ) (grey). Larger λ means a smaller equilibrium and faster forgetting of the initialisation; with λ = 0.05
        the run is too short to forget it.
      </figcaption>
    </figure>
  );
}
