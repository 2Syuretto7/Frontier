"use client";

import { useState } from "react";

// upper half-plane with metric (dx^2 + dy^2) / y^2; points (-1, h) and (1, h)
const HS = [0.4, 0.7, 1, 1.6];

/** Hyperbolic length of the straight segment, the distance, and the geodesic semicircle radius. */
export function lengths(h: number) {
  return {
    seg: 2 / h,
    dist: Math.acosh(1 + 2 / (h * h)),
    radius: Math.sqrt(1 + h * h),
  };
}

export function HalfPlaneViz() {
  const [k, setK] = useState(1);
  const h = HS[k];
  const { seg, dist, radius } = lengths(h);
  const ox = 170,
    oy = 175,
    s = 60;
  const X = (x: number) => ox + x * s,
    Y = (y: number) => oy - y * s;
  const a0 = Math.atan2(h, -1),
    a1 = Math.atan2(h, 1);
  const arc = Array.from({ length: 61 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / 60;
    return `${i ? "L" : "M"}${X(radius * Math.cos(a))},${Y(radius * Math.sin(a))}`;
  }).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div
          className="segmented"
          role="group"
          aria-label="Height of the two points"
        >
          {HS.map((v, j) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={k === j}
              onClick={() => setK(j)}
            >
              height {v}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 340 190"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Two points in the hyperbolic upper half-plane, the straight segment between them and the semicircular geodesic"
      >
        <line x1={10} y1={oy} x2={330} y2={oy} stroke="var(--border-strong)" />
        {[0.5, 1, 1.5, 2].map((y) => (
          <line
            key={y}
            x1={10}
            y1={Y(y)}
            x2={330}
            y2={Y(y)}
            stroke="var(--grid-line)"
          />
        ))}
        <path d={arc} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <line
          x1={X(-1)}
          y1={Y(h)}
          x2={X(1)}
          y2={Y(h)}
          stroke="var(--danger)"
          strokeWidth={1.6}
          strokeDasharray="5 3"
        />
        <circle cx={X(-1)} cy={Y(h)} r={4} fill="var(--text)" />
        <circle cx={X(1)} cy={Y(h)} r={4} fill="var(--text)" />
        <text x={330} y={oy - 4} textAnchor="end" className="viz-label">
          y = 0 (infinitely far)
        </text>
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        straight segment {seg.toFixed(3)}, semicircle (distance){" "}
        {dist.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        In the metric (dx² + dy²)/y², a step of fixed Euclidean size is longer
        the closer it is to the bottom edge. The straight segment (dashed)
        between two points at the same height has length 2/height. The shortest
        path bulges upward along an arc of a circle centred on the edge, where
        steps are cheaper, and the saving grows as the points move down.
      </figcaption>
    </figure>
  );
}
