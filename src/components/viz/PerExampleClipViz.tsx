"use client";

import { useState } from "react";
import { makeNormal, makeRng } from "./ml";

/** Per-example gradients of squared error for a 2-parameter linear model, one example an outlier. */
const normal = makeNormal(makeRng(3));
const W = [0.4, -0.2];
const DATA = Array.from({ length: 10 }, (_, i) => {
  const x = [normal(), normal()];
  if (i === 7) x.splice(0, 2, 2.0, -1.6);
  const y = x[0] - x[1] + 0.3 * normal();
  return { x, y };
});
export const GRADS = DATA.map(({ x, y }) => {
  const r = x[0] * W[0] + x[1] * W[1] - y;
  return [2 * r * x[0], 2 * r * x[1]];
});

export function clip(g: number[], c: number | null) {
  if (c === null) return g;
  const n = Math.hypot(g[0], g[1]);
  const s = Math.min(1, c / Math.max(n, 1e-12));
  return [g[0] * s, g[1] * s];
}

export function mean(gs: number[][]) {
  return [gs.reduce((s, g) => s + g[0], 0) / gs.length, gs.reduce((s, g) => s + g[1], 0) / gs.length];
}

const CLIPS: (number | null)[] = [null, 4, 2, 1];

export function PerExampleClipViz() {
  const [c, setC] = useState<number | null>(2);
  const clipped = GRADS.map((g) => clip(g, c));
  const m = mean(clipped), raw = mean(GRADS);
  const R = Math.max(...GRADS.map((g) => Math.hypot(g[0], g[1]))) * 1.05;
  const S = 260, C0 = S / 2, sc = (S / 2 - 10) / R;
  const px = (v: number) => C0 + v * sc, py = (v: number) => C0 - v * sc;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">clip norm</span>
        {CLIPS.map((v) => (
          <button key={String(v)} type="button" className="seg" aria-pressed={c === v} onClick={() => setC(v)}>{v === null ? "none" : v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }} role="img" aria-label="Per-example gradient vectors, their clipped versions and the mean">
        <line x1={0} y1={C0} x2={S} y2={C0} stroke="var(--border)" />
        <line x1={C0} y1={0} x2={C0} y2={S} stroke="var(--border)" />
        {c !== null && <circle cx={C0} cy={C0} r={c * sc} fill="none" stroke="var(--text-muted)" strokeDasharray="3 3" />}
        {GRADS.map((g, i) => (
          <line key={`r${i}`} x1={C0} y1={C0} x2={px(g[0])} y2={py(g[1])} stroke="var(--text-muted)" strokeOpacity={0.35} />
        ))}
        {clipped.map((g, i) => (
          <line key={`c${i}`} x1={C0} y1={C0} x2={px(g[0])} y2={py(g[1])} stroke="var(--accent)" strokeWidth={1.5} />
        ))}
        <line x1={C0} y1={C0} x2={px(raw[0])} y2={py(raw[1])} stroke="var(--text)" strokeWidth={2} strokeDasharray="4 2" />
        <line x1={C0} y1={C0} x2={px(m[0])} y2={py(m[1])} stroke="var(--danger)" strokeWidth={3} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`mean gradient (${m[0].toFixed(2)}, ${m[1].toFixed(2)}), unclipped (${raw[0].toFixed(2)}, ${raw[1].toFixed(2)})`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Ten per-example gradients of a linear model&apos;s squared error, as vmap over grad returns them (faint lines),
        one of them from an outlier. Clipping rescales each to at most the chosen norm (blue, inside the dashed circle)
        before averaging. The red arrow is the clipped mean, the dashed one the ordinary mean: clipping bounds how much any
        single example can move the model, which is the basis of differentially private training, and it needs the
        individual gradients that an ordinary backward pass sums away.
      </figcaption>
    </figure>
  );
}
