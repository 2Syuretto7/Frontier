"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { Axes, curvePath, scales, type View } from "./Plot";

type Case = { name: string; f: (x: number) => number; a: number; L: number; v: View; suggest: ((eps: number) => number) | null; rule: string };

const W = 520, H = 280;
const CASES: Case[] = [
  {
    name: "2x + 1 near 1", f: (x) => 2 * x + 1, a: 1, L: 3, v: { xmin: -1, xmax: 3, ymin: 0, ymax: 6, w: W, h: H },
    suggest: (e) => e / 2, rule: "Since |f(x) − 3| = 2|x − 1|, the choice δ = ε/2 always works.",
  },
  {
    name: "x² near 2", f: (x) => x * x, a: 2, L: 4, v: { xmin: 0, xmax: 4, ymin: 0, ymax: 9, w: W, h: H },
    suggest: (e) => Math.min(1, e / 5), rule: "Since |x² − 4| < 5|x − 2| once |x − 2| < 1, the choice δ = min(1, ε/5) always works.",
  },
  {
    name: "a jump at 1", f: (x) => (x < 1 ? 1 : 2), a: 1, L: 2, v: { xmin: -1, xmax: 3, ymin: 0, ymax: 3, w: W, h: H },
    suggest: null, rule: "Points just left of 1 have f(x) = 1, a distance 1 from the claimed limit 2. So once ε ≤ 1, no δ works, and 2 is not the limit.",
  },
];

/** The epsilon-delta game: a band of height ε around L, and a strip of width δ around a. */
export function EpsDeltaViz() {
  const [k, setK] = useState(1);
  const [eps, setEps] = useState(1);
  const [delta, setDelta] = useState(0.5);
  const C = CASES[k];
  const { X, Y } = scales(C.v);

  // Find the worst point in the punctured strip.
  let worst = 0, worstX = C.a;
  for (let i = 1; i < 1000; i++) {
    for (const s of [-1, 1]) {
      const x = C.a + (s * delta * i) / 1000;
      const d = Math.abs(C.f(x) - C.L);
      if (d > worst) { worst = d; worstX = x; }
    }
  }
  const ok = worst < eps;
  const inside = (x: number) => (Math.abs(x - C.a) < delta && x !== C.a ? C.f(x) : NaN);
  const top = Math.min(C.v.ymax, C.L + eps), bot = Math.max(C.v.ymin, C.L - eps);
  const lo = Math.max(C.v.xmin, C.a - delta), hi = Math.min(C.v.xmax, C.a + delta);

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Function">
        {CASES.map((c, i) => (
          <button key={c.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => setK(i)}>{c.name}</button>
        ))}
      </div>
      <Axes v={C.v} label={`ε = ${eps}, δ = ${delta}, for ${C.name}`}>
        <rect x={0} y={Y(top)} width={C.v.w} height={Y(bot) - Y(top)} className="viz-region" style={{ strokeWidth: 0 }} />
        <rect x={X(lo)} y={0} width={X(hi) - X(lo)} height={C.v.h} style={{ fill: "var(--text-faint)", opacity: 0.16 }} />
        <path d={curvePath(C.v, C.f, 800)} className="plot-curve-2" />
        <path d={curvePath(C.v, inside, 1600)} style={{ fill: "none", stroke: ok ? "var(--accent)" : "var(--danger)", strokeWidth: 4 }} />
        <circle cx={X(C.a)} cy={Y(C.L)} r={5} style={{ fill: "var(--surface)", stroke: "var(--text)", strokeWidth: 2 }} />
        {!ok && <circle cx={X(worstX)} cy={Y(C.f(worstX))} r={6} className="plot-hot" />}
        <text x={C.v.w - 4} y={Y(top) - 4} textAnchor="end" className="plot-tick">L + ε</text>
        <text x={C.v.w - 4} y={Y(bot) + 12} textAnchor="end" className="plot-tick">L − ε</text>
      </Axes>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        <label className="viz-stepper-label" style={{ flex: 1, minWidth: 150 }}>
          ε = <span className="mono">{fmtNum(eps)}</span>
          <input type="range" className="viz-range" min={0.05} max={2} step={0.05} value={eps} onChange={(e) => setEps(Number(e.target.value))} />
        </label>
        <label className="viz-stepper-label" style={{ flex: 1, minWidth: 150 }}>
          δ = <span className="mono">{fmtNum(delta)}</span>
          <input type="range" className="viz-range" min={0.01} max={1} step={0.01} value={delta} onChange={(e) => setDelta(Number(e.target.value))} />
        </label>
        {C.suggest && (
          <button type="button" className="btn" onClick={() => setDelta(Math.max(0.01, Math.floor(C.suggest!(eps) * 100) / 100))}>Choose δ for me</button>
        )}
      </div>
      <p className={`viz-verdict ${ok ? "viz-verdict-right" : "viz-verdict-wrong"}`} style={{ margin: "8px 0 0" }}>
        {ok
          ? `This δ works: every x within ${fmtNum(delta)} of ${C.a} (other than ${C.a} itself) has f(x) within ${fmtNum(eps)} of ${C.L}.`
          : `This δ fails: at x ≈ ${fmtNum(Number(worstX.toFixed(3)))}, f(x) is ${fmtNum(Number(worst.toFixed(3)))} away from ${C.L}, which is not less than ε.`}
      </p>
      <figcaption className="viz-caption" aria-live="polite">
        The shaded band is the target: within ε of L. The grey strip is your answer: within δ of a. The limit is L if, however
        thin the band, some strip keeps the graph inside it. {C.rule}
      </figcaption>
    </figure>
  );
}
