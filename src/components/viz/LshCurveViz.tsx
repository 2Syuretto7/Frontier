"use client";

import { useState } from "react";

const RS = [1, 2, 4, 5, 10, 20, 25, 50];

export function LshCurveViz() {
  const [ri, setRi] = useState(2);
  const r = RS[ri],
    b = 100 / r;
  const P = (s: number) => 1 - (1 - s ** r) ** b;
  const W = 340,
    H = 200,
    x0 = 36,
    x1 = W - 10,
    y0 = 10,
    y1 = H - 30;
  const X = (s: number) => x0 + s * (x1 - x0),
    Y = (p: number) => y1 - p * (y1 - y0);
  const d = Array.from({ length: 101 }, (_, i) => i / 100)
    .map((s, i) => `${i ? "L" : "M"}${X(s).toFixed(1)},${Y(P(s)).toFixed(1)}`)
    .join(" ");
  const t = (1 / b) ** (1 / r);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <label className="viz-label">
          {b} bands of {r} rows{" "}
          <input
            type="range"
            min={0}
            max={RS.length - 1}
            step={1}
            value={ri}
            onChange={(e) => setRi(+e.target.value)}
          />
        </label>
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
        aria-label="Probability that a pair becomes a duplicate candidate against its Jaccard similarity"
      >
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line
              x1={x0}
              x2={x1}
              y1={Y(v)}
              y2={Y(v)}
              stroke="var(--grid-line)"
            />
            <text
              x={x0 - 6}
              y={Y(v) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {v}
            </text>
          </g>
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <text
            key={v}
            x={X(v)}
            y={y1 + 16}
            textAnchor={v === 0 ? "start" : v === 1 ? "end" : "middle"}
            className="viz-label"
          >
            {v}
          </text>
        ))}
        <line
          x1={X(t)}
          x2={X(t)}
          y1={y0}
          y2={y1}
          stroke="var(--text-muted)"
          strokeDasharray="4 3"
        />
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        Jaccard similarity across, chance of becoming a candidate up; the curve
        rises steeply near {t.toFixed(3)}
      </p>
      <figcaption className="viz-caption">
        One hundred MinHash values per document are split into bands. Two
        documents become candidate duplicates if all rows of some band agree.
        More rows per band push the threshold up and make the step sharper; more
        bands push it down. The dashed line marks the approximate threshold
        (1/b)^(1/r), for b bands of r rows.
      </figcaption>
    </figure>
  );
}
