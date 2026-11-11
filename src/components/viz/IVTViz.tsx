"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Axes, curvePath, scales, type View } from "./Plot";

type Case = { name: string; f: (x: number) => number; a: number; b: number; v: View; k0: number; rationals?: boolean; breakAt?: number; note: string };

const W = 520, H = 260;
const CASES: Case[] = [
  {
    name: "Continuous", f: (x) => x ** 3 - 3 * x + 1, a: -2, b: 2, k0: 0.5,
    v: { xmin: -2.5, xmax: 2.5, ymin: -2, ymax: 4, w: W, h: H },
    note: "f is continuous on [−2, 2], with f(−2) = −1 and f(2) = 3. Every level between −1 and 3 is crossed at least once; some are crossed three times.",
  },
  {
    name: "With a jump", f: (x) => (x < 0.5 ? x - 1 : x + 1), a: -1, b: 2, k0: 0.5, breakAt: 0.5,
    v: { xmin: -1.5, xmax: 2.5, ymin: -2, ymax: 4, w: W, h: H },
    note: "f(−1) = −2 and f(2) = 3, but f jumps over every level strictly between −0.5 and 1.5. Without continuity, the theorem fails.",
  },
  {
    name: "In the rationals", f: (x) => x * x - 2, a: 1, b: 2, k0: 0, rationals: true,
    v: { xmin: 0, xmax: 2.5, ymin: -2, ymax: 3, w: W, h: H },
    note: "On [1, 2], x² − 2 goes from −1 to 2. In ℝ it crosses 0 at √2. If only rational numbers existed, it would pass from negative to positive without ever being 0: the theorem needs completeness.",
  },
];

function crossings(f: (x: number) => number, a: number, b: number, k: number) {
  const out: number[] = [];
  const N = 3000;
  let x0 = a, s0 = Math.sign(f(a) - k);
  if (s0 === 0) out.push(a);
  for (let i = 1; i <= N; i++) {
    const x1 = a + ((b - a) * i) / N;
    const s1 = Math.sign(f(x1) - k);
    if (s1 === 0) out.push(x1);
    else if (s0 !== 0 && s1 !== s0) {
      let lo = x0, hi = x1;
      for (let j = 0; j < 50; j++) { const m = (lo + hi) / 2; if (Math.sign(f(m) - k) === s0) lo = m; else hi = m; }
      // A sign change across a jump is not a crossing.
      if (Math.abs(f((lo + hi) / 2) - k) < 1e-6) out.push((lo + hi) / 2);
    }
    x0 = x1; s0 = s1;
  }
  return out;
}

/** The intermediate value theorem: a continuous function on [a, b] meets every level between f(a) and f(b). */
export function IVTViz() {
  const [c, setC] = useState(0);
  const C = CASES[c];
  const [k, setK] = useState(C.k0);
  const { X, Y } = scales(C.v);
  const fa = C.f(C.a), fb = C.f(C.b);
  const lo = Math.min(fa, fb), hi = Math.max(fa, fb);
  const between = k > lo && k < hi;
  const xs = crossings(C.f, C.a, C.b, k);
  const pick = (i: number) => { setC(i); setK(CASES[i].k0); };
  const inside = (x: number) => (x >= C.a && x <= C.b ? C.f(x) : NaN);
  const rationalMiss = C.rationals && Math.abs(k) < 1e-9;

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Function">
        {CASES.map((g, i) => (
          <button key={g.name} type="button" className={i === c ? "btn btn-primary" : "btn"} aria-pressed={i === c} onClick={() => pick(i)}>{g.name}</button>
        ))}
      </div>
      <Axes v={C.v} label={`${C.name}: the level y = ${k}`}>
        <rect x={0} y={Y(hi)} width={C.v.w} height={Y(lo) - Y(hi)} className="viz-region" style={{ strokeWidth: 0, opacity: 0.6 }} />
        <path d={curvePath(C.v, (x) => (x < C.a ? C.f(x) : NaN), 400)} className="plot-ghost" />
        <path d={curvePath(C.v, (x) => (x > C.b ? C.f(x) : NaN), 400)} className="plot-ghost" />
        {C.breakAt === undefined ? (
          <path d={curvePath(C.v, inside, 1200)} className="plot-curve" />
        ) : (
          <>
            <path d={curvePath(C.v, (x) => (x < C.breakAt! ? inside(x) : NaN), 1200)} className="plot-curve" />
            <path d={curvePath(C.v, (x) => (x >= C.breakAt! ? inside(x) : NaN), 1200)} className="plot-curve" />
            <circle cx={X(C.breakAt)} cy={Y(C.f(C.breakAt - 1e-9))} r={5} style={{ fill: "var(--surface)", stroke: "var(--accent)", strokeWidth: 2 }} />
            <circle cx={X(C.breakAt)} cy={Y(C.f(C.breakAt))} r={5} className="plot-point" />
          </>
        )}
        <line x1={0} x2={C.v.w} y1={Y(k)} y2={Y(k)} className="plot-line" />
        <circle cx={X(C.a)} cy={Y(fa)} r={5} className="plot-point" />
        <circle cx={X(C.b)} cy={Y(fb)} r={5} className="plot-point" />
        {xs.map((x) => rationalMiss
          ? <circle key={x} cx={X(x)} cy={Y(k)} r={6} style={{ fill: "var(--surface)", stroke: "var(--danger)", strokeWidth: 2 }} />
          : <circle key={x} cx={X(x)} cy={Y(k)} r={6} className="plot-hot" />)}
      </Axes>
      <div className="viz-controls">
        <label className="viz-stepper-label" style={{ flex: 1 }}>
          Level k = <span className="mono">{fmtNum(k)}</span>
          <input type="range" className="viz-range" min={C.v.ymin} max={C.v.ymax} step={0.1} value={k} onChange={(e) => setK(Number(e.target.value))} />
        </label>
      </div>
      <p className={`viz-verdict ${!between || xs.length > 0 ? "viz-verdict-right" : "viz-verdict-wrong"}`} style={{ margin: "8px 0 0" }}>
        {rationalMiss
          ? "In ℝ the graph meets the level at √2 ≈ 1.4142. In ℚ that point is missing, so there is no crossing."
          : xs.length > 0
            ? `The graph meets y = ${fmtNum(k)} at x ≈ ${xs.map((x) => fmtNum(Number(x.toFixed(3)))).join(", ")}.`
            : between
              ? `k lies between f(a) and f(b), yet the graph never meets y = ${fmtNum(k)}.`
              : `k is not between f(a) and f(b), and the graph does not meet it on [${C.a}, ${C.b}]; the theorem promises nothing here.`}
      </p>
      <figcaption className="viz-caption" aria-live="polite">The shaded band runs from f(a) to f(b). {C.note}</figcaption>
    </figure>
  );
}
