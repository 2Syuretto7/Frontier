"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const MUS = [-1, 1.5],
  S0 = 0.3;
type Kind = "straight" | "cosine";

/** alpha, sigma and their time derivatives for x_t = alpha x_1 + sigma x_0. */
export function pathCoeffs(t: number, kind: Kind) {
  if (kind === "straight") return [t, 1 - t, 1, -1];
  const h = (Math.PI * t) / 2;
  return [
    Math.sin(h),
    Math.cos(h),
    (Math.PI / 2) * Math.cos(h),
    (-Math.PI / 2) * Math.sin(h),
  ];
}

/** Exact marginal velocity for data made of two equal bumps N(-1, 0.3^2) and N(1.5, 0.3^2). */
export function velocity(x: number, t: number, kind: Kind) {
  const [a, s, da, ds] = pathCoeffs(Math.min(t, 1 - 1e-9), kind);
  const v = a * a * S0 * S0 + s * s;
  const l = MUS.map((m) => -((x - a * m) ** 2) / (2 * v)),
    mx = Math.max(...l);
  const w = l.map((u) => Math.exp(u - mx)),
    z = w[0] + w[1];
  const x1 = MUS.reduce(
    (acc, m, k) => acc + (w[k] / z) * (m + ((a * S0 * S0) / v) * (x - a * m)),
    0,
  );
  return da * x1 + ds * ((x - a * x1) / s);
}

/** Euler paths with N uniform steps in t, and the Wasserstein-1 distance of their end points from the data. */
export function eulerPaths(N: number, kind: Kind, n: number, seed: number) {
  const r = rand(seed);
  const nrm = () =>
    Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const paths = Array.from({ length: n }, () => {
    let x = nrm();
    const p = [x];
    for (let i = 0; i < N; i++) {
      x += (1 / N) * velocity(x, i / N, kind);
      p.push(x);
    }
    return p;
  });
  const h = rand(seed + 500);
  const ref = Array.from(
    { length: n },
    () =>
      MUS[h() < 0.5 ? 0 : 1] +
      S0 * Math.sqrt(-2 * Math.log(1 - h())) * Math.cos(2 * Math.PI * h()),
  ).sort((u, v) => u - v);
  const ends = paths.map((p) => p[N]).sort((u, v) => u - v);
  return {
    paths,
    w1: ends.reduce((s, x, i) => s + Math.abs(x - ref[i]), 0) / n,
  };
}

const NS = [1, 2, 4, 8, 16];

export function FlowPathViz() {
  const [kind, setKind] = useState<Kind>("straight");
  const [ni, setNi] = useState(2);
  const N = NS[ni];
  const run = useMemo(() => eulerPaths(N, kind, 3000, 1), [N, kind]);
  const fine = useMemo(() => eulerPaths(200, kind, 40, 1).paths, [kind]);
  const W = 330,
    H = 200,
    X0 = 28,
    PW = 290,
    Y0 = 8,
    PH = 166,
    YM = 3;
  const sx = (t: number) => X0 + t * PW;
  const sy = (y: number) =>
    Y0 + PH / 2 - (Math.max(-YM, Math.min(YM, y)) / YM) * (PH / 2);
  const line = (p: number[]) =>
    p
      .map(
        (y, k) =>
          `${k ? "L" : "M"}${sx(k / (p.length - 1)).toFixed(1)},${sy(y).toFixed(1)}`,
      )
      .join(" ");
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}
      >
        <div className="segmented" role="group" aria-label="Path">
          {(["straight", "cosine"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={kind === v}
              onClick={() => setKind(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <span className="viz-label">Euler steps</span>
        <div className="segmented" role="group" aria-label="Euler steps">
          {NS.map((v, i) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={ni === i}
              onClick={() => setNi(i)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Exact and Euler flow paths from noise to data"
      >
        <rect
          x={X0}
          y={Y0}
          width={PW}
          height={PH}
          fill="none"
          stroke="var(--border)"
        />
        {[-2, 0, 2].map((t) => (
          <g key={t}>
            <line
              x1={X0}
              x2={X0 + PW}
              y1={sy(t)}
              y2={sy(t)}
              stroke="var(--grid-line)"
            />
            <text
              x={X0 - 4}
              y={sy(t) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {t}
            </text>
          </g>
        ))}
        {fine.map((p, i) => (
          <path
            key={i}
            d={line(p)}
            fill="none"
            stroke="var(--text-muted)"
            strokeOpacity={0.5}
            strokeWidth={0.8}
          />
        ))}
        {run.paths.slice(0, 40).map((p, i) => (
          <path
            key={i}
            d={line(p)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1.3}
            strokeOpacity={0.8}
          />
        ))}
        <text x={X0} y={H - 6} className="viz-label">
          t = 0 (noise)
        </text>
        <text x={X0 + PW} y={H - 6} textAnchor="end" className="viz-label">
          t = 1 (data)
        </text>
      </svg>
      <div style={{ textAlign: "center", fontSize: 13 }}>
        Wasserstein-1 distance of the Euler samples from the data:{" "}
        <strong>{run.w1.toFixed(3)}</strong>
      </div>
      <figcaption className="viz-caption">
        Grey: exact flow paths with the exact velocity, for data in two bumps at
        −1 and 1.5. Colour: the same starting points integrated with a few
        uniform Euler steps. Each conditional path is a straight line from noise
        to one data point, yet the marginal paths still bend where they must
        choose a bump, so a straight path does not mean one step is enough. The
        cosine path describes the same distributions in other coordinates and
        with another clock, and here it happens to need fewer uniform steps.
      </figcaption>
    </figure>
  );
}
