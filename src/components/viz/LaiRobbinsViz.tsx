"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const T = 5000, RUNS = 20;
export const GAPS = [0.1, 0.3];
const STOPS = Array.from({ length: 41 }, (_, i) => Math.round(Math.exp((i * Math.log(T)) / 40)));

const kl = (p: number, q: number) => p * Math.log(p / q) + (1 - p) * Math.log((1 - p) / (1 - q));

/** Gamma(k, 1) by Marsaglia and Tsang, for k ≥ 1. */
function gamma(k: number, r: () => number) {
  const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x, v;
    do { x = Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r()); v = 1 + c * x; } while (v <= 0);
    v = v * v * v;
    const u = r();
    if (Math.log(u) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v;
  }
}

/** Mean regret of UCB1 and Thompson sampling on two Bernoulli arms 0.6 and 0.6 − gap, at the times in STOPS. */
export function banditCurves(gap: number) {
  const mu = [0.6, 0.6 - gap];
  const out = { ucb: new Array(STOPS.length).fill(0), ts: new Array(STOPS.length).fill(0) };
  for (const alg of ["ucb", "ts"] as const) {
    for (let s = 0; s < RUNS; s++) {
      const r = rand(1000 * s + (alg === "ucb" ? 1 : 2) + Math.round(gap * 100));
      const n = [0, 0], w = [0, 0];
      let reg = 0, k = 0;
      for (let t = 1; t <= T; t++) {
        let a: number;
        if (alg === "ucb") a = t <= 2 ? t - 1 : [0, 1].reduce((b, i) => (w[i] / n[i] + Math.sqrt((2 * Math.log(t)) / n[i]) > w[b] / n[b] + Math.sqrt((2 * Math.log(t)) / n[b]) ? i : b), 0);
        else {
          const th = [0, 1].map((i) => { const x = gamma(w[i] + 1, r), y = gamma(n[i] - w[i] + 1, r); return x / (x + y); });
          a = th[1] > th[0] ? 1 : 0;
        }
        n[a]++; w[a] += r() < mu[a] ? 1 : 0;
        reg += mu[0] - mu[a];
        while (k < STOPS.length && STOPS[k] === t) { out[alg][k] += reg / RUNS; k++; }
      }
    }
  }
  return { ...out, lower: gap / kl(0.6 - gap, 0.6) };
}

export function LaiRobbinsViz() {
  const [gi, setGi] = useState(0);
  const all = useMemo(() => GAPS.map(banditCurves), []);
  const c = all[gi];
  const W = 330, H = 160, X0 = 26, PW = 290, Y0 = 8, PH = 132, YH = gi === 0 ? 70 : 40;
  const sx = (t: number) => X0 + (Math.log(t) / Math.log(T)) * PW, sy = (y: number) => Y0 + PH - (Math.min(YH, y) / YH) * PH;
  const line = (ys: number[]) => ys.map((y, k) => `${k ? "L" : "M"}${sx(STOPS[k]).toFixed(1)},${sy(y).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">gap Δ</span>
        <div className="segmented" role="group" aria-label="Gap between the arms">
          {GAPS.map((g, i) => <button key={g} type="button" className="seg" aria-pressed={gi === i} onClick={() => setGi(i)}>{g}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Regret against the logarithm of time for UCB1 and Thompson sampling">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 + PH} stroke="var(--border)" />
        {[0, YH / 2, YH].map((v) => <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        {[10, 100, 1000].map((t) => <text key={t} x={sx(t)} y={H - 1} textAnchor="middle" className="viz-label">{t}</text>)}
        <path d={line(STOPS.map((t) => c.lower * Math.log(t)))} fill="none" stroke="var(--text)" strokeWidth={1} strokeDasharray="4 3" />
        <path d={line(c.ucb)} fill="none" stroke="var(--code-function)" strokeWidth={2} />
        <path d={line(c.ts)} fill="none" stroke="var(--accent)" strokeWidth={2} />
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--code-function)" }}>━</span> UCB1</span>
        <span><span style={{ color: "var(--accent)" }}>━</span> Thompson sampling</span>
        <span>┅ Lai–Robbins rate (Δ/KL) ln t</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        regret at t = {T}: UCB1 {c.ucb[STOPS.length - 1].toFixed(1)}, Thompson {c.ts[STOPS.length - 1].toFixed(1)}; Lai–Robbins {(c.lower * Math.log(T)).toFixed(1)}
      </div>
      <figcaption className="viz-caption">
        Two Bernoulli arms, the better with mean 0.6, averaged over 20 runs and plotted against log t, so regret growing like
        ln t would be a straight line. The dashed line is the Lai–Robbins rate, which no consistent algorithm beats in the long
        run. At gap 0.1 after 5000 rounds UCB1 has regret 66.3 and is still steepening, because its confidence width is set for
        the worst case and keeps it exploring; Thompson sampling has 15.4 and grows far more slowly. It lies below the dashed
        line here only because the bound is asymptotic. At gap 0.3 the two reach 37.1 and 8.6.
      </figcaption>
    </figure>
  );
}
