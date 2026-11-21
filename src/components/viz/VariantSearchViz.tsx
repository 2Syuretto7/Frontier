"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";
import { phi } from "./RobustFeatureViz";

const SE = 0.5;

function zFor(p: number) {
  let lo = -8,
    hi = 8;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (phi(mid) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function gains(k: number, seed: number) {
  const r = rand(seed);
  return Array.from({ length: k }, () => {
    const u = Math.max(r(), 1e-12),
      v = r();
    return SE * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  });
}

export function VariantSearchViz() {
  const [k, setK] = useState(10);
  const [seed, setSeed] = useState(8);
  const g = gains(k, seed);
  const naive = zFor(0.95) * SE;
  const bonf = zFor(1 - 0.05 / k) * SE;
  const passNaive = g.filter((x) => x > naive).length;
  const passBonf = g.filter((x) => x > bonf).length;
  const W = 330,
    H = 180,
    x0 = 30,
    pw = 290,
    yMid = 100,
    scale = 40;
  const bw = pw / k;
  const sy = (v: number) => yMid - v * scale;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          variants tried: {k}{" "}
          <input
            type="range"
            min={1}
            max={40}
            value={k}
            onChange={(e) => setK(+e.target.value)}
          />
        </label>
        <button type="button" className="btn" onClick={() => setSeed(seed + 1)}>
          new experiment
        </button>
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
        aria-label="Measured gains of variants that are truly no better than the baseline, with two significance thresholds"
      >
        <line
          x1={x0}
          x2={x0 + pw}
          y1={sy(0)}
          y2={sy(0)}
          stroke="var(--border)"
        />
        {g.map((v, i) => (
          <rect
            key={i}
            x={x0 + i * bw + 1}
            y={Math.min(sy(v), sy(0))}
            width={Math.max(bw - 2, 1)}
            height={Math.abs(sy(v) - sy(0))}
            fill={v > naive ? "var(--danger)" : "var(--accent)"}
            opacity={0.75}
          />
        ))}
        <line
          x1={x0}
          x2={x0 + pw}
          y1={sy(naive)}
          y2={sy(naive)}
          stroke="var(--danger)"
          strokeDasharray="4 3"
        />
        <line
          x1={x0}
          x2={x0 + pw}
          y1={sy(bonf)}
          y2={sy(bonf)}
          stroke="var(--success)"
          strokeDasharray="4 3"
        />
        <text x={x0 - 4} y={sy(0) + 4} textAnchor="end" className="viz-label">
          0
        </text>
      </svg>
      <p style={{ textAlign: "center", fontSize: 13, margin: "6px 0 0" }}>
        None of these variants is truly better. {passNaive} of {k} pass the
        single-test threshold (red); {passBonf} pass the Bonferroni threshold
        (green).
      </p>
      <figcaption className="viz-caption">
        Each bar is the measured gain of one variant over the baseline, with a
        standard error of 0.5 and a true gain of zero. Trying many variants and
        reporting the best one turns noise into apparent improvements; a
        threshold corrected for the number of tries keeps the chance of any
        false claim near 5%.
      </figcaption>
    </figure>
  );
}
