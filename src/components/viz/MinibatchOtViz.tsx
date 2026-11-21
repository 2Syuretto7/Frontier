"use client";

import { useEffect, useState } from "react";
import { rand } from "./RandomWalkMcViz";

/** Minimum-cost perfect matching (Hungarian algorithm, O(n^3)); returns col[i] matched to row i. */
export function hungarian(c: number[][]) {
  const n = c.length,
    INF = 1e18;
  const u = new Array(n + 1).fill(0),
    v = new Array(n + 1).fill(0),
    p = new Array(n + 1).fill(0),
    way = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(INF),
      used = new Array(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = INF,
        j1 = 0;
      for (let j = 1; j <= n; j++)
        if (!used[j]) {
          const cur = c[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else minv[j] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0);
  }
  const col = new Array(n).fill(0);
  for (let j = 1; j <= n; j++) col[p[j] - 1] = j - 1;
  return col;
}

/** Excess cost of minibatch OT pairs, as a fraction of the excess of independent pairs, for N(0, I) to N(2 e_1, I). */
export function excessFraction(
  d: number,
  n: number,
  total: number,
  seed: number,
) {
  const r = rand(seed);
  const nrm = () =>
    Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  let sum = 0;
  const reps = Math.max(1, Math.round(total / n));
  for (let k = 0; k < reps; k++) {
    const x = Array.from({ length: n }, () => Array.from({ length: d }, nrm));
    const y = Array.from({ length: n }, () =>
      Array.from({ length: d }, (_, j) => nrm() + (j === 0 ? 2 : 0)),
    );
    const c = x.map((a) =>
      y.map((b) => a.reduce((s, ai, j) => s + (ai - b[j]) ** 2, 0)),
    );
    const col =
      d === 1
        ? (() => {
            const xi = x.map((_, i) => i).sort((a, b) => x[a][0] - x[b][0]);
            const yi = y.map((_, i) => i).sort((a, b) => y[a][0] - y[b][0]);
            const out = new Array(n).fill(0);
            xi.forEach((i, k) => (out[i] = yi[k]));
            return out;
          })()
        : hungarian(c); // in one dimension the optimal pairing is the sorted one
    sum += col.reduce((s, j, i) => s + c[i][j], 0) / n;
  }
  return (sum / reps - 4) / (2 * d);
}

const DS = [1, 8, 32, 256],
  NS = [2, 4, 8, 16, 32, 64, 128];
const COLS = [
  "var(--accent)",
  "var(--success)",
  "var(--danger)",
  "var(--text-muted)",
];

export function MinibatchOtViz() {
  const [curves, setCurves] = useState<number[][] | null>(null);
  useEffect(() => {
    const id = setTimeout(
      () =>
        setCurves(
          DS.map((d, k) =>
            NS.map((n) =>
              excessFraction(
                d,
                n,
                d === 1 ? 32768 : d === 8 ? 1024 : 512,
                7 + k,
              ),
            ),
          ),
        ),
      20,
    );
    return () => clearTimeout(id);
  }, []);
  const W = 330,
    H = 210,
    X0 = 36,
    PW = 280,
    Y0 = 10,
    PH = 160;
  const sx = (n: number) => X0 + ((Math.log2(n) - 1) / 6) * PW,
    sy = (f: number) => Y0 + (1 - Math.max(0, Math.min(1, f))) * PH;
  return (
    <figure className="viz">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 440,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Excess transport cost of minibatch couplings against batch size"
      >
        <rect
          x={X0}
          y={Y0}
          width={PW}
          height={PH}
          fill="none"
          stroke="var(--border)"
        />
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line
              x1={X0}
              x2={X0 + PW}
              y1={sy(f)}
              y2={sy(f)}
              stroke="var(--grid-line)"
            />
            <text
              x={X0 - 4}
              y={sy(f) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {f}
            </text>
          </g>
        ))}
        {NS.map((n) => (
          <text
            key={n}
            x={sx(n)}
            y={Y0 + PH + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {n}
          </text>
        ))}
        <text
          x={X0 + PW / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          batch size
        </text>
        {curves === null && (
          <text
            x={X0 + PW / 2}
            y={Y0 + PH / 2}
            textAnchor="middle"
            className="viz-label"
          >
            computing…
          </text>
        )}
        {(curves ?? []).map((c, k) => (
          <g key={k}>
            <path
              d={c
                .map(
                  (f, i) =>
                    `${i ? "L" : "M"}${sx(NS[i]).toFixed(1)},${sy(f).toFixed(1)}`,
                )
                .join(" ")}
              fill="none"
              stroke={COLS[k]}
              strokeWidth={2}
            />
            {c.map((f, i) => (
              <circle
                key={i}
                cx={sx(NS[i])}
                cy={sy(f)}
                r={2.5}
                fill={COLS[k]}
              />
            ))}
          </g>
        ))}
      </svg>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 14px",
          justifyContent: "center",
          fontSize: 13,
        }}
      >
        {DS.map((d, k) => (
          <span key={d}>
            <span style={{ color: COLS[k] }}>●</span> dimension {d}
          </span>
        ))}
      </div>
      <figcaption className="viz-caption">
        Noise N(0, I) is paired with data N(2e₁, I) by exact optimal transport
        within each minibatch. The vertical axis is the excess squared distance
        of these pairs over the true optimal transport cost, as a fraction of
        the excess of independent pairs: 1 means no better than independent, 0
        means optimal. In one dimension a batch of 32 removes 90% of the excess;
        in 256 dimensions a batch of 128 removes less than a fifth.
      </figcaption>
    </figure>
  );
}
