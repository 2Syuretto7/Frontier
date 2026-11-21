"use client";

import { useState } from "react";

const D = 1152,
  L = 28,
  F = 8;

/** Multiply-adds of a DiT forward pass: per layer 12 n d^2 for linear maps and 2 n^2 d for attention. */
export function ditMacs(res: number, p: number) {
  const n = (res / F / p) ** 2;
  return { n, linear: L * 12 * n * D * D, attn: L * 2 * n * n * D };
}

const RES = [256, 512, 1024],
  PS = [8, 4, 2, 1];

function fmt(x: number) {
  return x >= 1e12
    ? `${(x / 1e12).toFixed(1)} T`
    : `${(x / 1e9).toFixed(x >= 1e10 ? 0 : 1)} G`;
}

export function DitCostViz() {
  const [ri, setRi] = useState(0);
  const res = RES[ri];
  const rows = PS.map((p) => ({ p, ...ditMacs(res, p) }));
  const mx = Math.max(...rows.map((r) => r.linear + r.attn));
  const W = 330,
    H = 200,
    X0 = 40,
    PW = 280,
    Y0 = 18,
    PH = 140,
    bw = 44;
  const sx = (i: number) => X0 + 16 + i * (PW / 4);
  const sy = (v: number) => Y0 + PH - (v / mx) * PH;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}
      >
        <span className="viz-label">image size</span>
        <div className="segmented" role="group" aria-label="Image size">
          {RES.map((v, i) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={ri === i}
              onClick={() => setRi(i)}
            >
              {v}
            </button>
          ))}
        </div>
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
        aria-label="Compute of a diffusion transformer by patch size"
      >
        <line
          x1={X0}
          x2={X0 + PW}
          y1={Y0 + PH}
          y2={Y0 + PH}
          stroke="var(--border-strong)"
        />
        {rows.map((r, i) => (
          <g key={r.p}>
            <rect
              x={sx(i)}
              y={sy(r.linear)}
              width={bw}
              height={Y0 + PH - sy(r.linear)}
              fill="var(--accent)"
              fillOpacity={0.75}
            />
            <rect
              x={sx(i)}
              y={sy(r.linear + r.attn)}
              width={bw}
              height={sy(r.linear) - sy(r.linear + r.attn)}
              fill="var(--danger)"
              fillOpacity={0.75}
            />
            <text
              x={sx(i) + bw / 2}
              y={sy(r.linear + r.attn) - 4}
              textAnchor="middle"
              className="viz-label"
            >
              {fmt(r.linear + r.attn)}
            </text>
            <text
              x={sx(i) + bw / 2}
              y={Y0 + PH + 14}
              textAnchor="middle"
              className="viz-label"
            >
              p = {r.p}
            </text>
            <text
              x={sx(i) + bw / 2}
              y={Y0 + PH + 28}
              textAnchor="middle"
              className="viz-label"
            >
              {r.n} tokens
            </text>
          </g>
        ))}
      </svg>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 14px",
          justifyContent: "center",
          fontSize: 13,
        }}
      >
        <span>
          <span style={{ color: "var(--accent)" }}>●</span> linear maps
        </span>
        <span>
          <span style={{ color: "var(--danger)" }}>●</span> attention scores and
          mixing
        </span>
      </div>
      <figcaption className="viz-caption">
        Multiply-adds of one forward pass of a DiT-XL-sized transformer (width
        1152, 28 layers) on a latent downsampled by 8, for patch sizes p. At 256
        pixels with p = 2 the count is 118 G, matching the 118.6 Gflops reported
        for DiT-XL/2. Halving p quadruples the tokens; the linear maps grow
        fourfold and attention sixteenfold, so at high resolution and small
        patches attention dominates.
      </figcaption>
    </figure>
  );
}
