"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const K = 400,
  N = 2000,
  STEP = 50;

/** Zipf weights over K failure types with exponent s, normalised. */
export function zipf(s: number) {
  const w = Array.from({ length: K }, (_, i) => 1 / (i + 1) ** s);
  const t = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / t);
}

/** Simulate a red-team campaign: at each checkpoint, the true unseen probability mass and the Good–Turing estimate. */
export function campaign(s: number, seed: number) {
  const p = zipf(s);
  const cdf: number[] = [];
  p.reduce((a, x, i) => (cdf[i] = a + x), 0);
  const r = rand(seed);
  const counts = new Array(K).fill(0);
  const out: { n: number; missing: number; gt: number }[] = [];
  for (let n = 1; n <= N; n++) {
    const u = r();
    let i = cdf.findIndex((c) => c >= u);
    if (i < 0) i = K - 1;
    counts[i]++;
    if (n % STEP === 0) {
      const missing = p.reduce((a, x, j) => a + (counts[j] === 0 ? x : 0), 0);
      const ones = counts.filter((c) => c === 1).length;
      out.push({ n, missing, gt: ones / n });
    }
  }
  return out;
}

export function MissingMassViz() {
  const [si, setSi] = useState(110);
  const s = si / 100;
  const data = useMemo(() => campaign(s, 3), [s]);
  const W = 330,
    H = 200,
    x0 = 34,
    y0 = 10,
    pw = 280,
    ph = 150,
    ymax = 0.5;
  const sx = (n: number) => x0 + (n / N) * pw;
  const sy = (v: number) => y0 + (1 - Math.min(v, ymax) / ymax) * ph;
  const path = (key: "missing" | "gt") =>
    data
      .map(
        (d, i) =>
          `${i ? "L" : "M"}${sx(d.n).toFixed(1)},${sy(d[key]).toFixed(1)}`,
      )
      .join(" ");
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          how concentrated failures are, s = {s.toFixed(2)}{" "}
          <input
            type="range"
            min={50}
            max={200}
            value={si}
            onChange={(e) => setSi(+e.target.value)}
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
        aria-label="Probability that the next red-team attempt finds a new kind of failure"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {[0, 0.25, 0.5].map((v) => (
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
          </g>
        ))}
        {[0, 1000, 2000].map((n) => (
          <text
            key={n}
            x={sx(n)}
            y={y0 + ph + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {n}
          </text>
        ))}
        <path
          d={path("missing")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        <path
          d={path("gt")}
          fill="none"
          stroke="var(--danger)"
          strokeWidth={2}
          strokeDasharray="5 3"
        />
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          successful red-team findings
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
        <span style={{ color: "var(--accent)" }}>
          true chance the next finding is a new kind
        </span>
        <span style={{ color: "var(--danger)" }}>
          estimate from kinds seen once
        </span>
      </div>
      <figcaption className="viz-caption">
        Failures come in 400 kinds, a few common and many rare, with frequencies
        falling as a power s of their rank. After each batch of findings, the
        share of kinds seen exactly once estimates the chance that the next
        finding is a kind never seen before. When failures are spread out, that
        chance stays high for a long time: a campaign that keeps finding new
        kinds has not finished.
      </figcaption>
    </figure>
  );
}
