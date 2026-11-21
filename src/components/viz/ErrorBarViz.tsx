"use client";

import { useState } from "react";

type Kind = "sd" | "se" | "ci";

const SD = 1.5;

export function ErrorBarViz() {
  const [gi, setG] = useState(100);
  const [n, setN] = useState(10);
  const [kind, setKind] = useState<Kind>("ci");
  const gap = gi / 100;
  const se = SD / Math.sqrt(n);
  const half = kind === "sd" ? SD : kind === "se" ? se : 1.96 * se;
  const m1 = 5,
    m2 = 5 + gap;
  const overlaps = m1 + half >= m2 - half;
  const z = gap / (se * Math.SQRT2);
  const sig = z > 1.96;
  const W = 330,
    H = 200,
    y0 = 10,
    ph = 160,
    vmin = 0,
    vmax = 12;
  const sy = (v: number) =>
    y0 + (1 - (Math.max(vmin, Math.min(vmax, v)) - vmin) / (vmax - vmin)) * ph;
  const bars = [
    { x: 120, m: m1, label: "baseline" },
    { x: 210, m: m2, label: "new method" },
  ];
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          gap between means: {gap.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={400}
            value={gi}
            onChange={(e) => setG(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          runs per method: {n}{" "}
          <input
            type="range"
            min={2}
            max={50}
            value={n}
            onChange={(e) => setN(+e.target.value)}
          />
        </label>
        <div
          role="group"
          aria-label="Error bar type"
          style={{ display: "flex", gap: 6 }}
        >
          {(
            [
              ["sd", "± sd"],
              ["se", "± se"],
              ["ci", "95% CI"],
            ] as [Kind, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={k === kind ? "btn btn-primary" : "btn"}
              aria-pressed={k === kind}
              onClick={() => setKind(k)}
            >
              {label}
            </button>
          ))}
        </div>
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
        aria-label="Two means with error bars"
      >
        <line x1={60} x2={270} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        {bars.map((b) => (
          <g key={b.label}>
            <rect
              x={b.x - 22}
              y={sy(b.m)}
              width={44}
              height={sy(0) - sy(b.m)}
              fill="var(--accent)"
              opacity={0.35}
            />
            <line
              x1={b.x}
              x2={b.x}
              y1={sy(b.m - half)}
              y2={sy(b.m + half)}
              stroke="var(--text)"
              strokeWidth={2}
            />
            {[b.m - half, b.m + half].map((v, i) => (
              <line
                key={i}
                x1={b.x - 8}
                x2={b.x + 8}
                y1={sy(v)}
                y2={sy(v)}
                stroke="var(--text)"
                strokeWidth={2}
              />
            ))}
            <text x={b.x} y={H - 8} textAnchor="middle" className="viz-label">
              {b.label}
            </text>
          </g>
        ))}
      </svg>
      <p style={{ textAlign: "center", fontSize: 13, margin: "6px 0 0" }}>
        Bars {overlaps ? "overlap" : "do not overlap"}; the difference is{" "}
        <span style={{ color: sig ? "var(--success)" : "var(--danger)" }}>
          {sig ? "significant" : "not significant"}
        </span>{" "}
        at the 5% level (z = {z.toFixed(2)}).
      </p>
      <figcaption className="viz-caption">
        Each method has a seed standard deviation of 1.5. Standard-deviation
        bars describe the spread of single runs and do not shrink with more
        runs; standard-error and confidence-interval bars describe the
        uncertainty of the mean. Even 95% intervals can overlap when the
        difference is significant, so a caption must say which bars are shown
        and a claim must rest on a test of the difference.
      </figcaption>
    </figure>
  );
}
