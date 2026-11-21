"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

type P = [number, number];
const C: P[] = [
    [2.4, 1.6],
    [2.4, -1.6],
    [-2.4, 1.6],
    [-2.4, -1.6],
  ],
  S0 = 0.3;

/** Exact marginal velocity of the straight path with independent noise and data (four Gaussian bumps). */
export function indepVelocity(x: P, t: number): P {
  const s = Math.max(1 - t, 1e-3),
    v = t * t * S0 * S0 + s * s;
  const l = C.map(
      (c) => -((x[0] - t * c[0]) ** 2 + (x[1] - t * c[1]) ** 2) / (2 * v),
    ),
    mx = Math.max(...l);
  const w = l.map((u) => Math.exp(u - mx)),
    z = w.reduce((a, b) => a + b, 0);
  const m: P = [0, 0];
  C.forEach((c, k) => {
    for (let d = 0; d < 2; d++)
      m[d] += (w[k] / z) * (c[d] + ((t * S0 * S0) / v) * (x[d] - t * c[d]));
  });
  return [(m[0] - x[0]) / s, (m[1] - x[1]) / s];
}

/** Kernel regression of x1 - x0 on the straight-line position, for a coupling given by pairs. */
export function pairVelocity(pairs: [P, P][], h: number) {
  return (x: P, t: number): P => {
    let a = 0,
      b = 0,
      z = 0,
      mx = -Infinity;
    const l = pairs.map(([p, q]) => {
      const u =
        -(
          ((1 - t) * p[0] + t * q[0] - x[0]) ** 2 +
          ((1 - t) * p[1] + t * q[1] - x[1]) ** 2
        ) /
        (2 * h * h);
      mx = Math.max(mx, u);
      return u;
    });
    pairs.forEach(([p, q], i) => {
      const w = Math.exp(l[i] - mx);
      a += w * (q[0] - p[0]);
      b += w * (q[1] - p[1]);
      z += w;
    });
    return [a / z, b / z];
  };
}

/** Euler path with n steps; returns all points. */
export function flowPath(x: P, vf: (x: P, t: number) => P, n: number) {
  const out: P[] = [x];
  for (let i = 0; i < n; i++) {
    const v = vf(x, i / n);
    x = [x[0] + v[0] / n, x[1] + v[1] / n];
    out.push(x);
  }
  return out;
}

/** The three couplings with their mean squared displacement and the mean error of a single Euler step. */
export function reflowStages(m: number, seed: number) {
  const r = rand(seed);
  const nrm = () =>
    Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const z0: P[] = Array.from({ length: m }, () => [nrm(), nrm()]);
  const indep: [P, P][] = z0.map((p) => {
    const c = C[Math.floor(r() * 4)];
    return [p, [c[0] + S0 * nrm(), c[1] + S0 * nrm()]];
  });
  const rf1: [P, P][] = z0.map((p) => [
    p,
    flowPath(p, indepVelocity, 100)[100],
  ]);
  const v2 = pairVelocity(rf1, 0.15);
  const show = z0.slice(0, 50);
  const cost = (ps: [P, P][]) =>
    ps.reduce((s, [p, q]) => s + (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2, 0) /
    ps.length;
  const one = (vf: (x: P, t: number) => P, paths: P[][]) =>
    paths.reduce((s, path) => {
      const v = vf(path[0], 0),
        e = path[path.length - 1];
      return s + Math.hypot(path[0][0] + v[0] - e[0], path[0][1] + v[1] - e[1]);
    }, 0) / paths.length;
  const p1 = show.map((p) => flowPath(p, indepVelocity, 100));
  const all2 = z0.map((p) => flowPath(p, v2, 40));
  const p2 = all2.slice(0, 50);
  return {
    indep: {
      lines: indep.slice(0, 50),
      paths: [] as P[][],
      cost: cost(indep),
      err: NaN,
    },
    rf1: {
      lines: [] as [P, P][],
      paths: p1,
      cost: cost(rf1),
      err: one(indepVelocity, p1),
    },
    rf2: {
      lines: [] as [P, P][],
      paths: p2,
      cost: cost(all2.map((p) => [p[0], p[40]] as [P, P])),
      err: one(v2, p2),
    },
  };
}

const MODES = [
  ["indep", "independent pairs"],
  ["rf1", "rectified flow"],
  ["rf2", "after reflow"],
] as const;

export function ReflowViz() {
  const [mode, setMode] = useState<"indep" | "rf1" | "rf2">("indep");
  const st = useMemo(() => reflowStages(400, 2), []);
  const cur = st[mode];
  const W = 320,
    H = 220,
    sx = (x: number) => W / 2 + x * 42,
    sy = (y: number) => H / 2 - y * 42;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}
      >
        <div className="segmented" role="group" aria-label="Coupling">
          {MODES.map(([k, lab]) => (
            <button
              key={k}
              type="button"
              className="seg"
              aria-pressed={mode === k}
              onClick={() => setMode(k)}
            >
              {lab}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 440,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Paths from noise to data"
      >
        <rect
          x={0.5}
          y={0.5}
          width={W - 1}
          height={H - 1}
          fill="none"
          stroke="var(--border)"
        />
        {C.map((c, i) => (
          <circle
            key={i}
            cx={sx(c[0])}
            cy={sy(c[1])}
            r={S0 * 42 * 2}
            fill="var(--success)"
            fillOpacity={0.15}
          />
        ))}
        <circle
          cx={sx(0)}
          cy={sy(0)}
          r={42 * 2}
          fill="none"
          stroke="var(--text-faint)"
          strokeDasharray="3 3"
        />
        {cur.lines.map(([p, q], i) => (
          <line
            key={i}
            x1={sx(p[0])}
            y1={sy(p[1])}
            x2={sx(q[0])}
            y2={sy(q[1])}
            stroke="var(--accent)"
            strokeOpacity={0.5}
          />
        ))}
        {cur.paths.map((p, i) => (
          <path
            key={i}
            d={p
              .map(
                (q, k) =>
                  `${k ? "L" : "M"}${sx(q[0]).toFixed(1)},${sy(q[1]).toFixed(1)}`,
              )
              .join(" ")}
            fill="none"
            stroke="var(--accent)"
            strokeOpacity={0.6}
          />
        ))}
        {(cur.lines.length
          ? cur.lines.map((l) => l[0])
          : cur.paths.map((p) => p[0])
        ).map((p, i) => (
          <circle
            key={`s${i}`}
            cx={sx(p[0])}
            cy={sy(p[1])}
            r={1.6}
            fill="var(--text)"
          />
        ))}
      </svg>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 16px",
          justifyContent: "center",
          fontSize: 13,
        }}
      >
        <span>
          mean squared displacement: <strong>{cur.cost.toFixed(2)}</strong>
        </span>
        <span>
          error of one Euler step:{" "}
          <strong>
            {Number.isNaN(cur.err) ? "not a flow" : cur.err.toFixed(2)}
          </strong>
        </span>
      </div>
      <figcaption className="viz-caption">
        Black dots are noise samples (dashed circle: two standard deviations);
        the green discs are the four data bumps. Independent pairs join each
        noise sample to a random data point, and the lines cross. The rectified
        flow follows the marginal velocity: its paths never cross but they bend,
        so one Euler step lands far from where the flow ends. Reflow retrains on
        the flow&apos;s own pairs, here by kernel regression on 400 of them, and
        the new paths are nearly straight.
      </figcaption>
    </figure>
  );
}
