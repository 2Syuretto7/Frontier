"use client";

import { useState } from "react";

const SD = 0.45,
  GAIN = 0.03;

export function PairedTestViz() {
  const [ri, setR] = useState(60);
  const [n, setN] = useState(1000);
  const rho = ri / 100;
  const seUnpaired = SD * Math.sqrt(2 / n);
  const sePaired = SD * Math.sqrt((2 * (1 - rho)) / n);
  const rows = [
    { label: "unpaired", se: seUnpaired },
    { label: "paired", se: sePaired },
  ];
  const maxSe = seUnpaired;
  const W = 330,
    x0 = 70,
    pw = 130,
    H = 90;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          correlation of per-example scores: {rho.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={95}
            value={ri}
            onChange={(e) => setR(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          test examples: {n}{" "}
          <input
            type="range"
            min={100}
            max={5000}
            step={100}
            value={n}
            onChange={(e) => setN(+e.target.value)}
          />
        </label>
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
        aria-label="Standard error of a difference with and without pairing"
      >
        {rows.map((r, i) => {
          const y = 12 + i * 36;
          const z = GAIN / r.se;
          return (
            <g key={r.label}>
              <text
                x={x0 - 6}
                y={y + 14}
                textAnchor="end"
                className="viz-label"
              >
                {r.label}
              </text>
              <rect
                x={x0}
                y={y}
                width={(r.se / maxSe) * pw}
                height={20}
                fill={z > 1.96 ? "var(--success)" : "var(--accent)"}
                opacity={0.75}
              />
              <text
                x={x0 + (r.se / maxSe) * pw + 4}
                y={y + 14}
                className="viz-label"
              >
                se {r.se.toFixed(4)}, z {z.toFixed(2)}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="viz-caption">
        Two systems are scored on the same test examples, each with a
        per-example standard deviation of 0.45, and the new one is better by
        0.03 on average. Some examples are hard for both, so their scores are
        correlated. Comparing the paired differences removes that shared
        difficulty and shrinks the standard error by a factor of the square root
        of one minus the correlation; green bars mark a significant gain.
      </figcaption>
    </figure>
  );
}
