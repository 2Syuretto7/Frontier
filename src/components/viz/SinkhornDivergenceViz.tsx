"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

// 30 points X from N(0, 1); the comparison dataset is the scaled copy sX, s in [0.2, 1.8]
const N = 30;
const r = rand(7);
const X = Array.from({ length: N }, () => {
  const u = Math.max(r(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
});
const SS = Array.from({ length: 33 }, (_, k) => 0.2 + k * 0.05);
const EPS = [0.1, 0.5, 2];

/** Entropic OT value <C, P> + eps KL(P | a x b) between uniform point clouds on the line. */
export function otEps(x: number[], y: number[], eps: number, iters = 400) {
  const n = x.length,
    m = y.length;
  const C = x.map((xi) => y.map((yj) => (xi - yj) ** 2));
  const K = C.map((row) => row.map((c) => Math.exp(-c / eps)));
  const u = new Array(n).fill(1);
  const v = new Array(m).fill(1);
  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < n; i++) {
      let s = 0;
      for (let j = 0; j < m; j++) s += K[i][j] * v[j];
      u[i] = 1 / n / s;
    }
    for (let j = 0; j < m; j++) {
      let s = 0;
      for (let i = 0; i < n; i++) s += K[i][j] * u[i];
      v[j] = 1 / m / s;
    }
  }
  let val = 0;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) {
      const p = u[i] * K[i][j] * v[j];
      if (p > 0) val += p * C[i][j] + eps * p * Math.log(p * n * m);
    }
  return val;
}

export function curves(eps: number) {
  const self = otEps(X, X, eps);
  return SS.map((s) => {
    const Y = X.map((v) => s * v);
    const ot = otEps(X, Y, eps);
    return { s, ot, div: ot - 0.5 * self - 0.5 * otEps(Y, Y, eps) };
  });
}

export function SinkhornDivergenceViz() {
  const [k, setK] = useState(1);
  const data = useMemo(() => curves(EPS[k]), [k]);
  const W = 340,
    H = 210,
    XL = 34,
    XR = W - 12,
    YT = 12,
    YB = H - 24;
  const top = Math.max(...data.map((d) => d.ot));
  const sx = (s: number) => XL + ((s - 0.2) / 1.6) * (XR - XL);
  const sy = (v: number) => YB - (v / top) * (YB - YT);
  const argmin = (key: "ot" | "div") =>
    data.reduce((b, d) => (d[key] < b[key] ? d : b)).s;
  const line = (key: "ot" | "div") =>
    data.map((d, i) => `${i ? "L" : "M"}${sx(d.s)},${sy(d[key])}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Regularisation">
          {EPS.map((e, j) => (
            <button
              key={e}
              type="button"
              className="seg"
              aria-pressed={k === j}
              onClick={() => setK(j)}
            >
              ε = {e}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Entropic transport cost and Sinkhorn divergence between a dataset and a scaled copy, as functions of the scale"
      >
        <line x1={XL} y1={YB} x2={XR} y2={YB} stroke="var(--border)" />
        <line x1={XL} y1={YT} x2={XL} y2={YB} stroke="var(--border)" />
        <line
          x1={sx(1)}
          y1={YT}
          x2={sx(1)}
          y2={YB}
          stroke="var(--grid-line)"
          strokeDasharray="3 3"
        />
        <path
          d={line("ot")}
          fill="none"
          stroke="var(--danger)"
          strokeWidth={1.8}
          strokeDasharray="5 3"
        />
        <path
          d={line("div")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        <circle
          cx={sx(argmin("ot"))}
          cy={sy(Math.min(...data.map((d) => d.ot)))}
          r={3.5}
          fill="var(--danger)"
        />
        <circle
          cx={sx(argmin("div"))}
          cy={sy(0)}
          r={3.5}
          fill="var(--accent)"
        />
        {[0.2, 0.6, 1, 1.4, 1.8].map((s) => (
          <text
            key={s}
            x={sx(s)}
            y={H - 8}
            textAnchor="middle"
            className="viz-label"
          >
            {s}
          </text>
        ))}
        <text x={XL + 4} y={YT + 4} className="viz-label">
          cost
        </text>
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        Entropic cost smallest at s = {argmin("ot").toFixed(2)}, Sinkhorn
        divergence smallest at s = {argmin("div").toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        A dataset of 30 points is compared with a copy of itself scaled by s
        (horizontal axis). Dashed: the entropic transport cost. Solid: the
        Sinkhorn divergence. The entropic cost is positive even at s = 1, and
        with enough blur it is smallest for a shrunken copy, so minimising it
        would pull a generated dataset towards the centre; the larger ε, the
        stronger the pull. Subtracting the two self-comparison terms removes the
        bias, and the divergence is zero exactly at s = 1.
      </figcaption>
    </figure>
  );
}
