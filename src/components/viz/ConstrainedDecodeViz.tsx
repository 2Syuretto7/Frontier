"use client";

import { useState } from "react";

/** Probability of starting with A: exact conditional on validity versus token-by-token masking. */
export function branchProbs(q: number, v: number) {
  return { cond: (q * v) / (q * v + (1 - q)), masked: q };
}

export function ConstrainedDecodeViz() {
  const [vi, setVi] = useState(5);
  const q = 0.5,
    v = vi / 100;
  const { cond, masked } = branchProbs(q, v);
  const rows: [string, number, number][] = [
    ["starts with A", cond, masked],
    ["starts with B", 1 - cond, 1 - masked],
  ];
  const W = 330,
    x0 = 92,
    pw = 200,
    H = 108;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="viz-label">
          P(valid continuation after A) = {v.toFixed(2)}{" "}
          <input
            type="range"
            min={1}
            max={100}
            value={vi}
            onChange={(e) => setVi(+e.target.value)}
          />
        </label>
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
        aria-label="Exact and masked probabilities of each branch"
      >
        {rows.map(([name, c, m], i) => (
          <g key={name}>
            <text
              x={x0 - 6}
              y={14 + i * 52 + 18}
              textAnchor="end"
              className="viz-label"
            >
              {name}
            </text>
            <rect
              x={x0}
              y={14 + i * 52}
              width={Math.max(1, c * pw)}
              height={16}
              fill="var(--success)"
              fillOpacity={0.75}
            />
            <rect
              x={x0}
              y={14 + i * 52 + 20}
              width={Math.max(1, m * pw)}
              height={16}
              fill="var(--danger)"
              fillOpacity={0.75}
            />
            <text
              x={x0 + c * pw + 4}
              y={14 + i * 52 + 12}
              className="viz-label"
            >
              {c.toFixed(3)}
            </text>
            <text
              x={x0 + m * pw + 4}
              y={14 + i * 52 + 32}
              className="viz-label"
            >
              {m.toFixed(3)}
            </text>
          </g>
        ))}
      </svg>
      <div
        style={{
          display: "flex",
          gap: "4px 16px",
          justifyContent: "center",
          fontSize: 13,
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "var(--success)" }}>
          model conditioned on valid output
        </span>
        <span style={{ color: "var(--danger)" }}>masking token by token</span>
        <span>
          distance: <strong>{Math.abs(cond - masked).toFixed(3)}</strong>
        </span>
      </div>
      <figcaption className="viz-caption">
        A model starts with A or B equally often. After B every continuation is
        valid; after A only a fraction is. Conditioning on validity should make
        A rare, but masking invalid tokens one step at a time keeps A at one
        half and then forces the rare valid continuation, so outputs the model
        considers unlikely become common.
      </figcaption>
    </figure>
  );
}
