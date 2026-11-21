"use client";

import { useState } from "react";

export function ReproVerdictViz() {
  const [di, setD] = useState(30);
  const [si, setS] = useState(20);
  const [mi, setM] = useState(80);
  const d = di / 100,
    se = si / 100,
    m = mi / 100;
  const lo90 = d - 1.645 * se,
    hi90 = d + 1.645 * se;
  const equivalent = Math.abs(d) + 1.645 * se < m;
  const different = !equivalent && Math.abs(d) > 1.96 * se;
  const verdict = equivalent
    ? "reproduced: the whole 90% interval lies inside the margin"
    : different
      ? "different: the gap is more than 1.96 standard errors from zero"
      : "inconclusive: neither test is decisive, so more seeds are needed";
  const W = 330,
    H = 110,
    x0 = 15,
    pw = 300,
    xmax = 3;
  const sx = (v: number) =>
    x0 + ((Math.max(-xmax, Math.min(xmax, v)) + xmax) / (2 * xmax)) * pw;
  const y = 50;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          your result minus reported: {d.toFixed(2)}{" "}
          <input
            type="range"
            min={-200}
            max={200}
            value={di}
            onChange={(e) => setD(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          standard error: {se.toFixed(2)}{" "}
          <input
            type="range"
            min={5}
            max={100}
            value={si}
            onChange={(e) => setS(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          margin: {m.toFixed(2)}{" "}
          <input
            type="range"
            min={10}
            max={200}
            value={mi}
            onChange={(e) => setM(+e.target.value)}
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
        aria-label="The difference from the reported result with its interval and the equivalence margin"
      >
        <rect
          x={sx(-m)}
          y={20}
          width={sx(m) - sx(-m)}
          height={60}
          fill="var(--success)"
          opacity={0.15}
        />
        <line x1={x0} x2={x0 + pw} y1={y} y2={y} stroke="var(--border)" />
        {[-3, -2, -1, 0, 1, 2, 3].map((v) => (
          <g key={v}>
            <line
              x1={sx(v)}
              x2={sx(v)}
              y1={y - 4}
              y2={y + 4}
              stroke="var(--border)"
            />
            <text
              x={sx(v)}
              y={y + 42}
              textAnchor="middle"
              className="viz-label"
              style={{ fontSize: 10 }}
            >
              {v}
            </text>
          </g>
        ))}
        <line
          x1={sx(lo90)}
          x2={sx(hi90)}
          y1={y}
          y2={y}
          stroke="var(--accent)"
          strokeWidth={4}
        />
        <circle cx={sx(d)} cy={y} r={5} fill="var(--accent)" />
        <line
          x1={sx(0)}
          x2={sx(0)}
          y1={16}
          y2={84}
          stroke="var(--text-muted)"
          strokeDasharray="3 3"
        />
      </svg>
      <p
        style={{
          textAlign: "center",
          fontSize: 13,
          margin: "6px 0 0",
          color: equivalent
            ? "var(--success)"
            : different
              ? "var(--danger)"
              : "var(--text)",
        }}
      >
        {verdict}
      </p>
      <figcaption className="viz-caption">
        The shaded band is the margin within which you would call the result
        reproduced; the dashed line is the reported value. The bar is the 90%
        interval for the true difference. A reproduction succeeds only when the
        interval fits inside the band, so a noisy run near the reported value is
        inconclusive, not a success.
      </figcaption>
    </figure>
  );
}
