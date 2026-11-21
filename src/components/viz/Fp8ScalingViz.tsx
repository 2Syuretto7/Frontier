"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

type Mode = "tensor" | "block";
const N = 1024;
const B = 128;
const FMAX = 448;
const TINY = 2 ** -9;
const OUT = [3, 50, 101, 390, 400, 451];
const LO = -16,
  HI = 10;

export function Fp8ScalingViz() {
  const [mode, setMode] = useState<Mode>("tensor");
  const [lgOut, setLgOut] = useState(8);
  const base = useMemo(() => {
    const r = rand(3);
    return Array.from({ length: N }, () => {
      const u = Math.max(1e-9, r()),
        v = r();
      const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      return 2 ** (-5 + 3 * g);
    });
  }, []);
  const xs = base.map((x, i) => (OUT.includes(i) ? x * 2 ** lgOut + 1 : x));
  const scales: number[] = [];
  if (mode === "tensor") {
    const m = Math.max(...xs);
    for (let i = 0; i < N / B; i++) scales.push(FMAX / m);
  } else {
    for (let i = 0; i < N; i += B)
      scales.push(FMAX / Math.max(...xs.slice(i, i + B)));
  }
  const scaled = xs.map((x, i) => Math.log2(x * scales[Math.floor(i / B)]));
  const bins = new Array(HI - LO).fill(0);
  let flushed = 0;
  scaled.forEach((l) => {
    if (l < -9) flushed++;
    const j = Math.min(HI - LO - 1, Math.max(0, Math.floor(l - LO)));
    bins[j]++;
  });
  const top = Math.max(...bins);
  const W = 330,
    H = 170,
    x0 = 10,
    y0 = 10,
    pw = 310,
    ph = 120;
  const sx = (l: number) => x0 + ((l - LO) / (HI - LO)) * pw;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          outliers: 2^{lgOut} times larger{" "}
          <input
            type="range"
            min={0}
            max={12}
            step={1}
            value={lgOut}
            onChange={(e) => setLgOut(+e.target.value)}
          />
        </label>
        <div
          role="group"
          aria-label="Scaling"
          style={{ display: "flex", gap: 6 }}
        >
          {(
            [
              ["tensor", "per tensor"],
              ["block", "per block of 128"],
            ] as [Mode, string][]
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              className={m === mode ? "btn btn-primary" : "btn"}
              aria-pressed={m === mode}
              onClick={() => setMode(m)}
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
        aria-label="Histogram of scaled magnitudes against the FP8 range"
      >
        <rect
          x={sx(-9)}
          y={y0}
          width={sx(Math.log2(FMAX)) - sx(-9)}
          height={ph}
          fill="var(--success)"
          opacity={0.1}
        />
        {bins.map((c, j) => {
          const h = (c / top) * ph;
          return (
            <rect
              key={j}
              x={sx(LO + j) + 0.5}
              y={y0 + ph - h}
              width={pw / (HI - LO) - 1}
              height={h}
              fill={LO + j < -9 ? "var(--danger)" : "var(--accent)"}
            />
          );
        })}
        <line
          x1={x0}
          x2={x0 + pw}
          y1={y0 + ph}
          y2={y0 + ph}
          stroke="var(--border)"
        />
        {[-15, -9, 0, 8].map((l) => (
          <text
            key={l}
            x={sx(l)}
            y={y0 + ph + 14}
            textAnchor="middle"
            className="viz-label"
          >
            2^{l}
          </text>
        ))}
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        values flushed to zero: {flushed} of {N} (
        {((100 * flushed) / N).toFixed(1)}%)
      </p>
      <figcaption className="viz-caption">
        Magnitudes of a 1024-value tensor after scaling, on a log scale; the
        shaded band is what E4M3 represents, from its smallest subnormal up to
        448. Six outliers set the largest value. With one scale per tensor, a
        large outlier pushes the whole distribution left and small values fall
        off the bottom; with one scale per block of 128, only the blocks that
        contain outliers pay.
      </figcaption>
    </figure>
  );
}
