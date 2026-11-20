"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

export const NS = [50, 200, 800];
const A = 0.45, SIGMA = 0.5;
const f = (x: number) => Math.sin(2 * Math.PI * x);
const GRID = Array.from({ length: 400 }, (_, i) => (i + 0.5) / 400);

/** Two interpolating rules on n noisy samples: nearest neighbour, and Nadaraya–Watson with the singular weight |u/h|^(−a) on |u| ≤ h. */
export function interpolants(n: number, seed: number) {
  const r = rand(seed);
  const nrm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const xs = Array.from({ length: n }, () => r()).sort((a, b) => a - b), ys = xs.map((x) => f(x) + SIGMA * nrm());
  const h = n ** (-1 / 3);
  const nn = (x: number) => { let b = 0; for (let i = 1; i < n; i++) if (Math.abs(xs[i] - x) < Math.abs(xs[b] - x)) b = i; return ys[b]; };
  const sing = (x: number) => {
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(x - xs[i]) / h;
      if (d === 0) return ys[i];
      if (d <= 1) { const w = d ** -A; num += w * ys[i]; den += w; }
    }
    return den > 0 ? num / den : 0;
  };
  const err = (g: (x: number) => number) => GRID.reduce((s, x) => s + (g(x) - f(x)) ** 2, 0) / GRID.length;
  return { xs, ys, nn, sing, errNN: err(nn), errSing: err(sing) };
}

export function SpikySmoothViz() {
  const [ni, setNi] = useState(1);
  const e = useMemo(() => interpolants(NS[ni], 9), [ni]);
  const W = 330, H = 170, X0 = 10, PW = 310, Y0 = 8, PH = 154, YL = -2.4, YH = 2.4;
  const sx = (x: number) => X0 + x * PW, sy = (y: number) => Y0 + PH - ((Math.max(YL, Math.min(YH, y)) - YL) / (YH - YL)) * PH;
  const pts = useMemo(() => [...GRID, ...e.xs, ...e.xs.map((x) => x - 1e-4), ...e.xs.map((x) => x + 1e-4)].filter((x) => x > 0 && x < 1).sort((a, b) => a - b), [e]);
  const line = (g: (x: number) => number, xs: number[]) => xs.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(g(x)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">samples n</span>
        <div className="segmented" role="group" aria-label="Number of samples">
          {NS.map((n, i) => <button key={n} type="button" className="seg" aria-pressed={ni === i} onClick={() => setNi(i)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Two interpolating estimators through noisy samples">
        {e.xs.map((x, i) => <circle key={i} cx={sx(x)} cy={sy(e.ys[i])} r={1.6} fill="var(--text)" fillOpacity={0.45} />)}
        <path d={line(e.nn, GRID)} fill="none" stroke="var(--code-function)" strokeWidth={1} strokeOpacity={0.55} />
        <path d={line(e.sing, pts)} fill="none" stroke="var(--accent)" strokeWidth={1.3} />
        <path d={line(f, GRID)} fill="none" stroke="var(--text)" strokeWidth={1.2} strokeDasharray="4 3" />
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--code-function)" }}>━</span> nearest neighbour</span>
        <span><span style={{ color: "var(--accent)" }}>━</span> singular-kernel average</span>
        <span>┅ true function</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        mean squared distance from the true function: nearest neighbour {e.errNN.toFixed(3)}, singular kernel {e.errSing.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Noisy samples of sin 2πx with noise standard deviation 0.5, and two rules that pass through every sample. Nearest
        neighbour copies the noise into whole intervals, so its error stays near the noise variance 0.25: 0.292, 0.268 and
        0.255 at n = 50, 200 and 800. The singular-kernel average is smooth except for thin spikes up to each sample, and the
        spikes cover less and less of the interval: its error falls from 0.082 to 0.036 to 0.006.
      </figcaption>
    </figure>
  );
}
