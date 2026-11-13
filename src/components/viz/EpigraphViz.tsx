"use client";

import { useState } from "react";

const FNS = [
  { label: "x²", f: (x: number) => x * x, convex: true },
  { label: "|x| + x/2", f: (x: number) => Math.abs(x) + x / 2, convex: true },
  { label: "x⁴ − 2x²", f: (x: number) => x ** 4 - 2 * x * x, convex: false },
  { label: "√|x|", f: (x: number) => Math.sqrt(Math.abs(x)), convex: false },
];

/** The epigraph of a function and one of its sublevel sets: the function is convex exactly when the epigraph is a convex set. */
export function EpigraphViz() {
  const [k, setK] = useState(0);
  const [alpha, setAlpha] = useState(0.8);
  const { f, label } = FNS[k];
  const lo = -1.8, hi = 1.8, ylo = -1.3, yhi = 3;
  const W = 300, H = 210;
  const X = (x: number) => 14 + ((x - lo) / (hi - lo)) * (W - 28);
  const Y = (y: number) => H - 14 - ((Math.min(Math.max(y, ylo), yhi) - ylo) / (yhi - ylo)) * (H - 24);
  const xs = Array.from({ length: 241 }, (_, i) => lo + ((hi - lo) * i) / 240);
  const curve = xs.map((x) => `${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`);
  const epi = [`${X(lo)},${Y(yhi)}`, ...curve, `${X(hi)},${Y(yhi)}`].join(" ");
  // worst chord gap: min over pairs of theta f(a) + (1 - theta) f(b) - f(theta a + (1 - theta) b)
  let worst = { gap: 0, a: 0, b: 0 };
  for (let i = 0; i < 37; i++) for (let j = i + 1; j < 37; j++) {
    const a = lo + ((hi - lo) * i) / 36, b = lo + ((hi - lo) * j) / 36;
    const gap = (f(a) + f(b)) / 2 - f((a + b) / 2);
    if (gap < worst.gap - 1e-12) worst = { gap, a, b };
  }
  const below = xs.filter((x) => f(x) <= alpha);
  const pieces: [number, number][] = [];
  below.forEach((x, i) => {
    if (i === 0 || x - below[i - 1] > (hi - lo) / 200) pieces.push([x, x]);
    else pieces[pieces.length - 1][1] = x;
  });
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {FNS.map((g, i) => (
          <button key={g.label} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{g.label}</button>
        ))}
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          level α = {alpha.toFixed(1)}
          <input type="range" min={-0.9} max={2.5} step={0.1} value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} aria-label="sublevel threshold" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Function with its epigraph and a sublevel set">
        <polygon points={epi} fill="var(--accent)" opacity={0.15} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={curve.join(" ")} />
        <line x1={X(lo)} x2={X(hi)} y1={Y(alpha)} y2={Y(alpha)} stroke="var(--text-muted)" strokeDasharray="4 3" />
        {pieces.map(([a, b], i) => (
          <line key={i} x1={X(a)} x2={X(b)} y1={Y(ylo) - 2} y2={Y(ylo) - 2} stroke="var(--text)" strokeWidth={4} />
        ))}
        {worst.gap < 0 && (
          <line x1={X(worst.a)} y1={Y(f(worst.a))} x2={X(worst.b)} y2={Y(f(worst.b))} stroke="var(--danger)" strokeWidth={2} />
        )}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {label}: {worst.gap < 0 ? `chord below the graph by up to ${(-worst.gap).toFixed(3)} at its midpoint, so not convex` : "every chord lies on or above the graph"}; sublevel set {"{"}f ≤ α{"}"} has {pieces.length} piece{pieces.length === 1 ? "" : "s"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The shaded region above the graph is the epigraph. A chord between two points of the graph lies in the epigraph
        exactly when it lies on or above the graph, so the function is convex exactly when its epigraph is a convex set.
        For a non-convex function the red chord is the worst one found, dipping below the graph. The thick bar on the axis
        is the sublevel set where f ≤ α (the dashed line). It is an interval for every convex function, but √|x| shows that
        convex sublevel sets do not make a function convex, and x⁴ − 2x² splits into two pieces for small α.
      </figcaption>
    </figure>
  );
}
