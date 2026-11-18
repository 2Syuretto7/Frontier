"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const N = 60, HALF = 30;
const KS = [0, 2, 8, 32, 128];

/** Two-community random graph, noisy community signal, and k rounds of GCN propagation without weights. */
export function simulate(seed = 1) {
  const u = makeRng(seed), z = makeNormal(makeRng(seed + 1));
  const A = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let i = 0; i < N; i++)
    for (let j = i + 1; j < N; j++)
      if (u() < ((i < HALF) === (j < HALF) ? 0.2 : 0.03)) A[i][j] = A[j][i] = 1;
  const d = A.map((r) => r.reduce((a, b) => a + b, 0) + 1);
  let x = Array.from({ length: N }, (_, i) => (i < HALF ? 0.5 : -0.5) + z());
  const out = new Map<number, { r: number[]; acc: number }>();
  for (let k = 0; k <= KS[KS.length - 1]; k++) {
    if (KS.includes(k)) {
      const r = x.map((v, i) => v / Math.sqrt(d[i])), med = [...x].sort((a, b) => a - b)[HALF];
      let hit = 0;
      x.forEach((v, i) => { if ((v >= med) === (i < HALF)) hit++; });
      out.set(k, { r, acc: Math.max(hit, N - hit) / N });
    }
    x = x.map((_, i) => (x[i] / d[i] + A[i].reduce((a, aij, j) => a + (aij ? x[j] / Math.sqrt(d[i] * d[j]) : 0), 0)));
  }
  return out;
}

export function OversmoothViz() {
  const [k, setK] = useState(2);
  const [res, setRes] = useState<ReturnType<typeof simulate> | null>(null);
  useEffect(() => setRes(simulate()), []);
  const W = 300, H = 180, X0 = 34, PW = W - 42, YM = 0.5;
  const sx = (i: number) => X0 + ((i + 0.5) / N) * PW, sy = (v: number) => 8 + ((YM - Math.max(-YM, Math.min(YM, v))) / (2 * YM)) * (H - 16);
  const cur = res?.get(k);
  const mean = cur ? cur.r.reduce((a, b) => a + b, 0) / N : 0;
  const sd = cur ? Math.sqrt(cur.r.reduce((a, b) => a + (b - mean) ** 2, 0) / N) : 0;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {KS.map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={v === k} onClick={() => setK(v)}>{v} layers</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Node features after repeated graph convolution, for two communities">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={sx(HALF - 0.5)} y1={8} x2={sx(HALF - 0.5)} y2={H - 8} stroke="var(--border)" strokeDasharray="3 3" />
        {cur?.r.map((v, i) => <circle key={i} cx={sx(i)} cy={sy(v - mean)} r={2.8} fill={i < HALF ? "var(--accent)" : "var(--danger)"} />)}
        {[-0.5, 0, 0.5].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {cur ? `spread ${sd.toFixed(4)}; a split at the median recovers ${(100 * cur.acc).toFixed(0)}% of labels` : "simulating"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Sixty nodes in two communities (left and right of the dashed line), densely linked inside and sparsely across. Each
        starts with a noisy scalar whose mean is +0.5 or −0.5 by community. Each layer replaces it by the GCN average over the
        node and its neighbours; the plot shows it divided by the square root of the degree, minus the average over nodes. A few layers average away the
        noise and the communities separate; many layers average across the sparse links too, and every node converges to the
        same value.
      </figcaption>
    </figure>
  );
}
