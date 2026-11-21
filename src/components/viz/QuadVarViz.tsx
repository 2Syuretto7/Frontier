"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const NF = 4096; // finest grid on [0, 1]
const r0 = rand(1912);
const PATH = [0];
for (let i = 0; i < NF; i++) {
  const u = Math.max(r0(), 1e-12),
    v = r0();
  PATH.push(
    PATH[i] +
      Math.sqrt(-2 * Math.log(u)) *
        Math.cos(2 * Math.PI * v) *
        Math.sqrt(1 / NF),
  );
}
const NS = [4, 16, 64, 256, 4096];

/** Running sums of squared and absolute increments of the path sampled on n equal steps. */
export function variations(n: number) {
  const step = NF / n;
  const qv = [0],
    tv = [0];
  for (let k = 1; k <= n; k++) {
    const d = PATH[k * step] - PATH[(k - 1) * step];
    qv.push(qv[k - 1] + d * d);
    tv.push(tv[k - 1] + Math.abs(d));
  }
  return { qv, tv };
}

export function QuadVarViz() {
  const [ni, setNi] = useState(1);
  const n = NS[ni];
  const { qv, tv } = variations(n);
  const W = 340,
    H = 190,
    X0 = 30,
    X1 = W - 10,
    Y0 = 8,
    Y1 = H - 22,
    YMAX = 2.5;
  const sx = (t: number) => X0 + t * (X1 - X0);
  const sy = (v: number) => Y1 - (Math.min(v, YMAX) / YMAX) * (Y1 - Y0);
  const d = qv.map((v, k) => `${k ? "L" : "M"}${sx(k / n)},${sy(v)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div
          className="segmented"
          role="group"
          aria-label="Number of steps in the partition"
        >
          {NS.map((m, j) => (
            <button
              key={m}
              type="button"
              className="seg"
              aria-pressed={ni === j}
              onClick={() => setNi(j)}
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
        aria-label="Running sum of squared increments of a Brownian path compared with elapsed time"
      >
        <line x1={X0} y1={Y1} x2={X1} y2={Y1} stroke="var(--border-strong)" />
        <line x1={X0} y1={Y0} x2={X0} y2={Y1} stroke="var(--border-strong)" />
        <line
          x1={sx(0)}
          y1={sy(0)}
          x2={sx(1)}
          y2={sy(1)}
          stroke="var(--text-muted)"
          strokeDasharray="4 3"
        />
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth={1.8} />
        {[0, 1, 2].map((v) => (
          <text
            key={v}
            x={X0 - 4}
            y={sy(v) + 4}
            textAnchor="end"
            className="viz-label"
          >
            {v}
          </text>
        ))}
        {[0, 0.5, 1].map((t) => (
          <text
            key={t}
            x={sx(t)}
            y={H - 6}
            textAnchor={t === 1 ? "end" : "middle"}
            className="viz-label"
          >
            {t}
          </text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        {n} steps: sum of squares {qv[n].toFixed(3)}, sum of absolute values{" "}
        {tv[n].toFixed(1)}
      </div>
      <figcaption className="viz-caption">
        One Brownian path on [0, 1], sampled on partitions of 4 to 4,096 equal
        steps. The curve is the running sum of squared increments; the dashed
        line is elapsed time. As the steps shrink, the curve hugs the line: the
        quadratic variation up to time t is t. The sum of absolute increments,
        the length of the path, keeps growing, roughly doubling each time the
        number of steps is multiplied by four.
      </figcaption>
    </figure>
  );
}
