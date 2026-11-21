"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

// data: an equal mixture of N(-1.5, 0.3^2) and N(1.5, 0.3^2); forward VP SDE dX = -X/2 dt + dB on [0, T]
const MU = 1.5,
  S2 = 0.09,
  T = 5,
  N = 250,
  DT = T / N,
  NP = 40;
const r0 = rand(1941);
const gauss = () => {
  const u = Math.max(r0(), 1e-12),
    v = r0();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const ZF = Array.from({ length: NP }, () =>
  Array.from({ length: N + 1 }, gauss),
);
const ZR = Array.from({ length: NP }, () =>
  Array.from({ length: N + 1 }, gauss),
);

/** Score of the noised mixture at time t: each component is N(a mu, a^2 s2 + 1 - a^2) with a = exp(-t/2). */
export function score(x: number, t: number) {
  const a = Math.exp(-t / 2),
    v = a * a * S2 + 1 - a * a;
  const w1 = Math.exp(-((x - a * MU) ** 2) / (2 * v)),
    w2 = Math.exp(-((x + a * MU) ** 2) / (2 * v));
  return (-(x - a * MU) * w1 - (x + a * MU) * w2) / (v * (w1 + w2));
}

const MODES = ["forward", "reverse", "reverse, no score"] as const;

/** Paths indexed by forward time t = k DT: forward from data, or backward from noise with or without the score term. */
export function paths(mode: number) {
  return ZF.map((zf, i) => {
    const p = Array(N + 1).fill(0);
    if (mode === 0) {
      p[0] = (i % 2 ? MU : -MU) + Math.sqrt(S2) * zf[N];
      for (let k = 0; k < N; k++)
        p[k + 1] = p[k] - (p[k] / 2) * DT + Math.sqrt(DT) * zf[k];
    } else {
      const zr = ZR[i];
      p[N] = zr[N];
      for (let k = N; k > 0; k--) {
        const x = p[k],
          drift = -x / 2 - (mode === 1 ? score(x, k * DT) : 0);
        p[k - 1] = x - drift * DT + Math.sqrt(DT) * zr[k - 1];
      }
    }
    return p;
  });
}

export function ReverseSdeViz() {
  const [mode, setMode] = useState(1);
  const ps = paths(mode);
  const ends = ps.map((p) => p[0]);
  const near = ends.filter((x) => Math.abs(Math.abs(x) - MU) < 0.6).length;
  const W = 340,
    H = 200,
    XL = 30,
    XR = W - 8,
    Y0 = 8,
    Y1 = H - 22,
    LO = -3.5,
    HI = 3.5;
  const sx = (k: number) => XL + (k / N) * (XR - XL);
  const sy = (v: number) =>
    Y1 - ((Math.max(LO, Math.min(HI, v)) - LO) / (HI - LO)) * (Y1 - Y0);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div
          className="segmented"
          role="group"
          aria-label="Direction of the process"
        >
          {MODES.map((m, j) => (
            <button
              key={m}
              type="button"
              className="seg"
              aria-pressed={mode === j}
              onClick={() => setMode(j)}
            >
              {m}
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
        aria-label="Paths of the forward noising SDE and of its time reversal"
      >
        {[-MU, MU].map((m) => (
          <line
            key={m}
            x1={XL}
            y1={sy(m)}
            x2={XR}
            y2={sy(m)}
            stroke="var(--border)"
            strokeDasharray="3 3"
          />
        ))}
        {ps.map((p, i) => (
          <path
            key={i}
            d={p.map((v, k) => `${k ? "L" : "M"}${sx(k)},${sy(v)}`).join(" ")}
            fill="none"
            stroke={mode === 2 ? "var(--danger)" : "var(--accent)"}
            strokeWidth={0.7}
            strokeOpacity={0.6}
          />
        ))}
        {[-1.5, 0, 1.5].map((v) => (
          <text
            key={v}
            x={XL - 4}
            y={sy(v) + 4}
            textAnchor="end"
            className="viz-label"
          >
            {v}
          </text>
        ))}
        <text x={XL} y={H - 6} className="viz-label">
          t = 0 (data)
        </text>
        <text x={XR} y={H - 6} textAnchor="end" className="viz-label">
          t = {T} (noise)
        </text>
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        {near} of {NP} paths end within 0.6 of a data mode at t = 0
      </div>
      <figcaption className="viz-caption">
        The data are two clusters at ±1.5. Forward: the variance-preserving SDE
        turns them into standard Gaussian noise by t = 5. Reverse: paths start
        from fresh noise at t = 5 and run the reverse-time SDE back to t = 0,
        using the exact score of the noised data; they split into the two
        clusters. Without the score term the reversed drift only pushes
        outwards, and the paths fly off the chart with no trace of the clusters.
      </figcaption>
    </figure>
  );
}
