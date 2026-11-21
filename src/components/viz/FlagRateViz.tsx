"use client";

import { useState } from "react";

/** Expected share of transcripts a classifier flags, given true prevalence p, sensitivity and specificity. */
export function flagged(p: number, sens: number, spec: number) {
  return sens * p + (1 - spec) * (1 - p);
}

export function FlagRateViz() {
  const [si, setSi] = useState(90);
  const [ci, setCi] = useState(95);
  const sens = si / 100,
    spec = ci / 100;
  const W = 330,
    H = 200,
    x0 = 34,
    y0 = 10,
    pw = 280,
    ph = 150,
    xmax = 0.3;
  const sx = (p: number) => x0 + (p / xmax) * pw;
  const sy = (v: number) => y0 + (1 - Math.min(v, xmax) / xmax) * ph;
  const ps = Array.from({ length: 31 }, (_, i) => (i * xmax) / 30);
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          sensitivity: {sens.toFixed(2)}{" "}
          <input
            type="range"
            min={50}
            max={100}
            value={si}
            onChange={(e) => setSi(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          specificity: {spec.toFixed(2)}{" "}
          <input
            type="range"
            min={80}
            max={100}
            value={ci}
            onChange={(e) => setCi(+e.target.value)}
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
        aria-label="Flagged rate against true rate for an imperfect classifier"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {[0, 0.1, 0.2, 0.3].map((v) => (
          <g key={v}>
            <line
              x1={x0}
              x2={x0 + pw}
              y1={sy(v)}
              y2={sy(v)}
              stroke="var(--grid-line)"
            />
            <text
              x={x0 - 4}
              y={sy(v) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {v}
            </text>
            <text
              x={sx(v)}
              y={y0 + ph + 14}
              textAnchor="middle"
              className="viz-label"
            >
              {v}
            </text>
          </g>
        ))}
        <line
          x1={sx(0)}
          y1={sy(0)}
          x2={sx(xmax)}
          y2={sy(xmax)}
          stroke="var(--text-muted)"
          strokeDasharray="5 3"
        />
        <path
          d={ps
            .map(
              (p, i) =>
                `${i ? "L" : "M"}${sx(p).toFixed(1)},${sy(flagged(p, sens, spec)).toFixed(1)}`,
            )
            .join(" ")}
          fill="none"
          stroke="var(--danger)"
          strokeWidth={2}
        />
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          true share of transcripts with alignment-faking reasoning
        </text>
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
        <span style={{ color: "var(--danger)" }}>
          share flagged by the classifier
        </span>
        <span style={{ color: "var(--text-muted)" }}>flagged = true</span>
      </div>
      <figcaption className="viz-caption">
        Studies of alignment faking count transcripts whose reasoning a
        classifier labels as faking. The flagged share is a straight line in the
        true share, with intercept one minus the specificity and slope
        sensitivity plus specificity minus one. When the behaviour is rare,
        false alarms can outnumber real cases, so the raw count must be
        corrected by inverting the line.
      </figcaption>
    </figure>
  );
}
