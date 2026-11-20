"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

/** A hypothetical true loss curve: an irreducible floor plus a power law in compute, with compute in FLOPs. */
const E = 1.8, A = 1.6, ALPHA = 0.15, C0 = 17;
export const trueLoss = (lc: number) => E + A * Math.pow(10, -ALPHA * (lc - C0));
const TARGET = 24;

function lineFit(xs: number[], ys: number[]) {
  const n = xs.length, mx = xs.reduce((s, x) => s + x, 0) / n, my = ys.reduce((s, y) => s + y, 0) / n;
  let sxy = 0, sxx = 0;
  xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; });
  const b = sxy / sxx;
  return { b, a: my - b * mx };
}

/**
 * Small runs at seven log-spaced budgets from 1e17 FLOPs up to 10^top, with 0.5% multiplicative noise, then a fit in log-log space:
 * a pure power law, or a power law plus a floor chosen by grid search to minimise squared error.
 */
export function proxyFit(top: number, floor: boolean, seed = 7) {
  const r = rand(seed);
  const lcs = Array.from({ length: 7 }, (_, i) => C0 + ((top - C0) * i) / 6);
  const ys = lcs.map((lc) => trueLoss(lc) * (1 + 0.005 * (r() + r() + r() - 1.5) * 2));
  let best = { e: 0, a: 0, b: 0, sse: Infinity };
  const floors = floor ? Array.from({ length: Math.floor(Math.min(...ys) * 100) - 1 }, (_, i) => i / 100) : [0];
  for (const e of floors) {
    const f = lineFit(lcs, ys.map((y) => Math.log10(y - e)));
    const sse = lcs.reduce((s, lc, i) => s + (e + Math.pow(10, f.a + f.b * lc) - ys[i]) ** 2, 0);
    if (sse < best.sse) best = { e, a: f.a, b: f.b, sse };
  }
  const pred = (lc: number) => best.e + Math.pow(10, best.a + best.b * lc);
  return { lcs, ys, pred, floorFit: best.e };
}

const TOPS = [19, 20, 21];
const SEEDS = [7, 1, 3];

export function ProxyExtrapolationViz() {
  const [t, setT] = useState(0);
  const [fl, setFl] = useState(0);
  const [d, setD] = useState(0);
  const { lcs, ys, pred, floorFit } = proxyFit(TOPS[t], fl === 1, SEEDS[d]);
  const W = 330, H = 186, X0 = 30, PW = 290, Y0 = 10, PH = 146, LO = 1.2, HI = 3.6;
  const px = (lc: number) => X0 + ((lc - C0) / (TARGET - C0)) * PW;
  const py = (y: number) => Y0 + PH - ((Math.min(HI, Math.max(LO, y)) - LO) / (HI - LO)) * PH;
  const grid = Array.from({ length: 71 }, (_, i) => C0 + (i / 70) * (TARGET - C0));
  const path = (f: (x: number) => number, xs: number[]) => xs.map((x, i) => `${i ? "L" : "M"}${px(x).toFixed(1)},${py(f(x)).toFixed(1)}`).join(" ");
  const p = pred(TARGET), tr = trueLoss(TARGET);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Largest small run">
          {TOPS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={t === i} onClick={() => setT(i)}>runs to 1e{v}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Form of the fit">
          {["power law", "with floor"].map((v, i) => <button key={v} type="button" className="seg" aria-pressed={fl === i} onClick={() => setFl(i)}>{v}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Noise draw">
          {SEEDS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={d === i} onClick={() => setD(i)}>draw {i + 1}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Loss against compute: small runs, the fitted curve and its extrapolation">
        {[1.5, 2, 2.5, 3, 3.5].map((y) => (
          <g key={y}>
            <line x1={X0} x2={X0 + PW} y1={py(y)} y2={py(y)} stroke="var(--border)" strokeDasharray="2 3" />
            <text x={X0 - 4} y={py(y) + 4} textAnchor="end" className="viz-label">{y}</text>
          </g>
        ))}
        <rect x={px(C0)} y={Y0} width={px(TOPS[t]) - px(C0)} height={PH} style={{ fill: "var(--bg-subtle)" }} />
        <path d={path(trueLoss, grid)} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeDasharray="4 3" />
        <path d={path(pred, grid)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {lcs.map((lc, i) => <circle key={i} cx={px(lc)} cy={py(ys[i])} r={2.6} style={{ fill: "var(--text)" }} />)}
        <circle cx={px(TARGET)} cy={py(tr)} r={3.5} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} />
        <circle cx={px(TARGET)} cy={py(p)} r={3.5} style={{ fill: "var(--accent)" }} />
        {[17, 19, 21, 23].map((lc) => <text key={lc} x={px(lc)} y={Y0 + PH + 13} textAnchor={lc === 17 ? "start" : "middle"} className="viz-label">1e{lc}</text>)}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">FLOPs (log scale); dashed: truth, shaded: fitted</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        loss at 1e24: predicted {p.toFixed(3)}, true {tr.toFixed(3)}, error {(p - tr >= 0 ? "+" : "") + (p - tr).toFixed(3)}
        {fl === 1 ? `; fitted floor ${floorFit.toFixed(2)} (true ${E})` : ""}
      </div>
      <figcaption className="viz-caption">
        Seven small training runs, each with half a percent of noise, are fitted and the fit is extrapolated to 1e24 FLOPs. The true
        curve, which is hypothetical, flattens towards a floor of 1.8. A pure power law cannot flatten, so it predicts a loss that is
        too low, and the error shrinks only as the runs reach closer to the target. Adding a floor to the fit removes most of the bias,
        but the floor is estimated from the curvature of the small runs, which noise easily disturbs: try the other noise draws.
      </figcaption>
    </figure>
  );
}
