"use client";

import { useMemo, useState } from "react";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = 60, MAXR = 300;
const LRS = [1, 0.3, 0.1];
const truth = (x: number) => Math.sin(1.5 * x) + 0.3 * x;

/** Gradient boosting with stumps under squared loss: each stump fits the current residuals, the learning rate shrinks its step, and test error eventually rises when the ensemble starts fitting noise. */
export function GbStageViz() {
  const [lri, setLri] = useState(1);
  const [k, setK] = useState(20);
  const lr = LRS[lri];
  const data = useMemo(() => {
    const r = makeRng(1234);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    const xs = Array.from({ length: N }, (_, i) => (4 * (i + 0.5)) / N);
    const ys = xs.map((x) => truth(x) + 0.35 * normal());
    const yt = xs.map((x) => truth(x) + 0.35 * normal());
    return { xs, ys, yt };
  }, []);
  const run = useMemo(() => {
    const F = Array(N).fill(0);
    const snaps: number[][] = [F.slice()];
    const tr: number[] = [], te: number[] = [];
    for (let m = 0; m < MAXR; m++) {
      const r = data.ys.map((y, i) => y - F[i]);
      let best = Infinity, bi = 0, la = 0, ra = 0;
      let s = 0, s2 = 0;
      const T = r.reduce((a, b) => a + b, 0), T2 = r.reduce((a, b) => a + b * b, 0);
      for (let i = 1; i < N; i++) {
        s += r[i - 1]; s2 += r[i - 1] * r[i - 1];
        const sse = s2 - (s * s) / i + (T2 - s2) - ((T - s) * (T - s)) / (N - i);
        if (sse < best) { best = sse; bi = i; la = s / i; ra = (T - s) / (N - i); }
      }
      for (let i = 0; i < N; i++) F[i] += lr * (i < bi ? la : ra);
      snaps.push(F.slice());
      tr.push(data.ys.reduce((a, y, i) => a + (y - F[i]) * (y - F[i]), 0) / N);
      te.push(data.yt.reduce((a, y, i) => a + (y - F[i]) * (y - F[i]), 0) / N);
    }
    return { snaps, tr, te };
  }, [data, lr]);
  const F = run.snaps[k];
  const W = 330, H = 150;
  const X = (x: number) => 12 + (x / 4) * (W - 24);
  const Y = (y: number) => H / 2 + 10 - y * (H / 5);
  const H2 = 100;
  const emax = 0.6;
  const CX = (m: number) => 24 + (Math.log(m) / Math.log(MAXR)) * (W - 36);
  const CY = (v: number) => H2 - 14 - (Math.min(v, emax) / emax) * (H2 - 24);
  const best = run.te.indexOf(Math.min(...run.te)) + 1;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {LRS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={lri === i} onClick={() => setLri(i)}>learning rate {v}</button>)}
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          stumps = {k}
          <input type="range" min={1} max={MAXR} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="number of stumps" style={{ width: 140 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Training data, the true curve and the boosted fit">
        <polyline fill="none" stroke="var(--text)" strokeDasharray="4 3" strokeWidth={1.2} points={data.xs.map((x) => `${X(x).toFixed(1)},${Y(truth(x)).toFixed(1)}`).join(" ")} />
        {data.xs.map((x, i) => <circle key={i} cx={X(x)} cy={Y(data.ys[i])} r={2.2} fill="var(--danger)" />)}
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={data.xs.map((x, i) => `${X(x).toFixed(1)},${Y(F[i]).toFixed(1)}`).join(" ")} />
      </svg>
      <svg viewBox={`0 0 ${W} ${H2}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Training and test error against the number of stumps on a log scale">
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.5} points={run.tr.map((v, m) => `${CX(m + 1).toFixed(1)},${CY(v).toFixed(1)}`).join(" ")} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={run.te.map((v, m) => `${CX(m + 1).toFixed(1)},${CY(v).toFixed(1)}`).join(" ")} />
        <line x1={CX(k)} x2={CX(k)} y1={8} y2={H2 - 14} stroke="var(--danger)" strokeDasharray="3 3" />
        <text x={24} y={H2 - 2} className="viz-label">1</text>
        <text x={W - 12} y={H2 - 2} textAnchor="end" className="viz-label">{MAXR} stumps (log scale)</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        train MSE {run.tr[k - 1].toFixed(3)}, test MSE {run.te[k - 1].toFixed(3)}; best test at {best} stumps
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Gradient boosting on 60 noisy points with squared loss, so each stump is fitted to the current residuals and added
        with weight equal to the learning rate. Training error (grey) falls steadily. Test error, measured on fresh noise at
        the same inputs, falls and then creeps back up once the stumps start fitting the noise. A smaller learning rate
        needs more stumps, and its test curve is usually flatter around the minimum, which makes the stopping point less
        critical.
      </figcaption>
    </figure>
  );
}
