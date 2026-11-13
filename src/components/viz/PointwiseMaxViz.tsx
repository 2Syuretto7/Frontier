"use client";

import { useState } from "react";

const LINES = [
  { a: -1.2, b: -0.2 },
  { a: -0.3, b: 0.4 },
  { a: 0.4, b: 0.3 },
  { a: 1.3, b: -0.6 },
  { a: 0.0, b: 0.9 },
];

/** Pointwise maximum and minimum of affine functions: the maximum is always convex, the minimum is concave. */
export function PointwiseMaxViz() {
  const [on, setOn] = useState([true, true, true, true, false]);
  const [op, setOp] = useState<"max" | "min">("max");
  const act = LINES.filter((_, i) => on[i]);
  const lo = -2, hi = 2, ylo = -2.5, yhi = 3;
  const W = 300, H = 200;
  const X = (x: number) => 14 + ((x - lo) / (hi - lo)) * (W - 28);
  const Y = (y: number) => H - 12 - ((Math.min(Math.max(y, ylo), yhi) - ylo) / (yhi - ylo)) * (H - 22);
  const xs = Array.from({ length: 201 }, (_, i) => lo + ((hi - lo) * i) / 200);
  const env = (x: number) => {
    const v = act.map((l) => l.a * x + l.b);
    return op === "max" ? Math.max(...v) : Math.min(...v);
  };
  let worst = 0;
  if (act.length) for (let i = 0; i < 21; i++) for (let j = i + 1; j < 21; j++) {
    const a = lo + ((hi - lo) * i) / 20, b = lo + ((hi - lo) * j) / 20;
    worst = Math.min(worst, (env(a) + env(b)) / 2 - env((a + b) / 2));
  }
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {LINES.map((_, i) => (
          <button key={i} type="button" className="seg" aria-pressed={on[i]} onClick={() => setOn(on.map((v, j) => (j === i ? !v : v)))}>ℓ{i + 1}</button>
        ))}
        <button type="button" className="seg" aria-pressed={op === "max"} onClick={() => setOp("max")}>max</button>
        <button type="button" className="seg" aria-pressed={op === "min"} onClick={() => setOp("min")}>min</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Affine functions and their pointwise maximum or minimum">
        {LINES.map((l, i) => (
          <line key={i} x1={X(lo)} y1={Y(l.a * lo + l.b)} x2={X(hi)} y2={Y(l.a * hi + l.b)} stroke="var(--text-muted)" strokeWidth={1} opacity={on[i] ? 0.9 : 0.2} strokeDasharray={on[i] ? undefined : "3 3"} />
        ))}
        {act.length > 0 && (
          <polyline fill="none" stroke={worst < -1e-9 ? "var(--danger)" : "var(--accent)"} strokeWidth={2.6} points={xs.map((x) => `${X(x).toFixed(1)},${Y(env(x)).toFixed(1)}`).join(" ")} />
        )}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {act.length === 0 ? "switch on at least one line" : worst < -1e-9 ? `the ${op} is not convex: a chord dips ${(-worst).toFixed(3)} below it` : `the ${op} is convex: no chord dips below it`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each thin line is an affine function ℓᵢ(x) = aᵢx + bᵢ. Their pointwise maximum (thick) is convex whichever lines you
        keep, because its epigraph is the intersection of the halfplanes above each line. Every convex function is a
        maximum of this kind, of all the affine functions below it. The pointwise minimum is concave instead, and with two
        or more lines that cross it fails the chord test.
      </figcaption>
    </figure>
  );
}
