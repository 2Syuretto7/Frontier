"use client";

import { useState } from "react";

const N = 100,
  T1 = 1 / 6,
  T2 = 1,
  T3 = 4;

export function PaperTriageViz() {
  const [ri, setR] = useState(10);
  const [si, setS] = useState(80);
  const [fi, setF] = useState(25);
  const r = ri / 100,
    s = si / 100,
    f = fi / 100;
  const relevant = N * r;
  const second = N * (r * s + (1 - r) * f);
  const found = N * r * s;
  const hours = N * T1 + second * T2 + found * T3;
  const perFound = found > 0 ? hours / found : Infinity;
  const allHours = N * T3;
  const perAll = allHours / relevant;
  const rows = [
    { label: "first pass (10 min)", value: N, color: "var(--text-muted)" },
    { label: "second pass (1 h)", value: second, color: "var(--accent)" },
    { label: "third pass (4 h)", value: found, color: "var(--success)" },
    {
      label: "relevant missed",
      value: relevant - found,
      color: "var(--danger)",
    },
  ];
  const W = 330,
    H = 150,
    x0 = 110,
    pw = 200,
    bh = 24;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          relevant papers: {ri}%{" "}
          <input
            type="range"
            min={2}
            max={50}
            value={ri}
            onChange={(e) => setR(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          first pass keeps relevant: {s.toFixed(2)}{" "}
          <input
            type="range"
            min={50}
            max={100}
            value={si}
            onChange={(e) => setS(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          first pass keeps irrelevant: {f.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={60}
            value={fi}
            onChange={(e) => setF(+e.target.value)}
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
        aria-label="Number of papers reaching each pass of reading"
      >
        {rows.map((row, i) => {
          const y = 10 + i * (bh + 10);
          return (
            <g key={row.label}>
              <text
                x={x0 - 6}
                y={y + bh / 2 + 4}
                textAnchor="end"
                className="viz-label"
                style={{ fontSize: 11 }}
              >
                {row.label}
              </text>
              <rect
                x={x0}
                y={y}
                width={(row.value / N) * pw}
                height={bh}
                fill={row.color}
                opacity={0.8}
              />
              <text
                x={x0 + (row.value / N) * pw + 4}
                y={y + bh / 2 + 4}
                className="viz-label"
                style={{ fontSize: 11 }}
              >
                {row.value.toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>
      <p style={{ textAlign: "center", fontSize: 13, margin: "6px 0 0" }}>
        Three passes: {hours.toFixed(0)} hours, {perFound.toFixed(2)} per
        relevant paper read in full. Reading all 100 in full: {allHours} hours,{" "}
        {perAll.toFixed(2)} per relevant paper.
      </p>
      <figcaption className="viz-caption">
        A hundred papers enter the first pass. Those that look relevant get a
        second pass, and those that still look relevant after it get a full
        third pass. Screening saves most of the time when relevant papers are
        rare; the price is the relevant papers the quick first pass throws away.
      </figcaption>
    </figure>
  );
}
