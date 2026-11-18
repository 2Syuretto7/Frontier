"use client";

import { useEffect, useState } from "react";

const SIZES = [10, 50, 200, 800];
const XMAX = 2;

/** TV distance to stationarity for the lazy walk on the n-cube, tracked through the Hamming weight, at t = s * (n ln n)/2. */
export function cubeCurve(n: number, pts = 120) {
  const lg: number[] = [0];
  for (let k = 1; k <= n; k++) lg.push(lg[k - 1] + Math.log(k));
  const pi = Array.from({ length: n + 1 }, (_, k) => Math.exp(lg[n] - lg[k] - lg[n - k] - n * Math.log(2)));
  const c = 0.5 * n * Math.log(n), T = Math.ceil(XMAX * c);
  let d = Array(n + 1).fill(0); d[0] = 1;
  const tv: number[] = [];
  for (let t = 0; t <= T; t++) {
    tv.push(0.5 * d.reduce((s, v, k) => s + Math.abs(v - pi[k]), 0));
    const nd = Array(n + 1).fill(0);
    for (let k = 0; k <= n; k++) {
      nd[k] += 0.5 * d[k];
      if (k > 0) nd[k - 1] += (0.5 * k / n) * d[k];
      if (k < n) nd[k + 1] += (0.5 * (n - k) / n) * d[k];
    }
    d = nd;
  }
  const xs = Array.from({ length: pts + 1 }, (_, i) => (XMAX * i) / pts);
  return { c, tv, xs, ys: xs.map((x) => tv[Math.min(T, Math.round(x * c))]) };
}

/** Width of the window where the distance falls from 0.75 to 0.25, in units of (n ln n)/2. */
export function cutoffWindow(tv: number[], c: number) {
  const a = tv.findIndex((v) => v <= 0.75), b = tv.findIndex((v) => v <= 0.25);
  return (b - a) / c;
}

export function CutoffViz() {
  const [n, setN] = useState(200);
  const [data, setData] = useState<Record<number, ReturnType<typeof cubeCurve>> | null>(null);
  useEffect(() => {
    const out: Record<number, ReturnType<typeof cubeCurve>> = {};
    for (const s of SIZES) out[s] = cubeCurve(s);
    setData(out);
  }, []);
  const W = 330, H = 160, X0 = 30, PW = W - 40, PH = 130;
  const sx = (x: number) => X0 + (x / XMAX) * PW, sy = (v: number) => 10 + (1 - v) * PH;
  const cur = data?.[n];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {SIZES.map((s) => (
          <button key={s} type="button" className="seg" aria-pressed={s === n} onClick={() => setN(s)}>n = {s}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Distance to uniform for the lazy walk on the hypercube against rescaled time">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={sx(1)} y1={sy(0)} x2={sx(1)} y2={sy(1)} stroke="var(--text-muted)" strokeDasharray="3 3" />
        {data && SIZES.filter((s) => s !== n).map((s) => (
          <polyline key={s} fill="none" stroke="var(--text-muted)" strokeWidth={1} opacity={0.6} points={data[s].xs.map((x, i) => `${sx(x)},${sy(data[s].ys[i])}`).join(" ")} />
        ))}
        {cur && <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={cur.xs.map((x, i) => `${sx(x)},${sy(cur.ys[i])}`).join(" ")} />}
        <text x={X0 - 4} y={sy(1) + 4} textAnchor="end" className="viz-label">1</text>
        <text x={X0 - 4} y={sy(0) + 4} textAnchor="end" className="viz-label">0</text>
        <text x={sx(1)} y={H + 12} textAnchor="middle" className="viz-label">½ n ln n</text>
        <text x={X0 + PW} y={H + 12} textAnchor="end" className="viz-label">n ln n</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {cur ? `½ n ln n = ${cur.c.toFixed(0)} steps; distance falls from ¾ to ¼ within ${cutoffWindow(cur.tv, cur.c).toFixed(2)} of that` : "computing"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The lazy walk on the n-dimensional hypercube, started at the all-zeros corner. Time is measured in units of ½ n ln n. As
        n grows the curves pile up around 1 and the drop from near 1 to near 0 takes a shrinking fraction of the total time: the
        chain is far from uniform, and then, abruptly, close to it. This is the cutoff phenomenon.
      </figcaption>
    </figure>
  );
}
