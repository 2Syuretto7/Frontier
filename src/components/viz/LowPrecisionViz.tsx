"use client";

import { useState } from "react";

const FMTS = [
  { name: "FP32", m: 23, bias: 127, emax: 127, max: 3.4028234663852886e38, inf: true },
  { name: "BF16", m: 7, bias: 127, emax: 127, max: 3.3895313892515355e38, inf: true },
  { name: "FP16", m: 10, bias: 15, emax: 15, max: 65504, inf: true },
  { name: "FP8 E5M2", m: 2, bias: 15, emax: 15, max: 57344, inf: true },
  { name: "FP8 E4M3", m: 3, bias: 7, emax: 8, max: 448, inf: false },
  { name: "FP4 E2M1", m: 1, bias: 1, emax: 2, max: 6, inf: false },
];

function roundTo(x: number, f: (typeof FMTS)[number]) {
  if (x === 0) return 0;
  const e = Math.max(Math.floor(Math.log2(x)), 1 - f.bias);
  const q = 2 ** (e - f.m);
  const r = x / q;
  const fl = Math.floor(r), d = r - fl;
  const n = d > 0.5 || (d === 0.5 && fl % 2 === 1) ? fl + 1 : fl;
  const v = n * q;
  if (v > f.max) return f.inf ? Infinity : f.max;
  return v;
}

/** Low-precision formats compared: dynamic range (smallest subnormal to largest finite, in powers of two) against precision, and how one value rounds in each. */
export function LowPrecisionViz() {
  const [lx, setLx] = useState(-0.5);
  const x = 10 ** lx;
  const W = 330, H = 200;
  const lo = -150, hi = 130;
  const X = (l: number) => 92 + ((l - lo) / (hi - lo)) * (W - 100);
  const lgx = Math.log2(x);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          x = {x.toPrecision(6)}
          <input type="range" min={-9} max={6} step={0.01} value={lx} onChange={(e) => setLx(Number(e.target.value))} aria-label="value on a log scale" style={{ width: 160 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 480, display: "block", margin: "0 auto" }} role="img" aria-label="Dynamic range bars for six number formats with the chosen value marked">
        {FMTS.map((f, i) => {
          const y = 12 + i * 30;
          const sub = 1 - f.bias - f.m;
          const top = Math.log2(f.max);
          return (
            <g key={f.name}>
              <text x={4} y={y + 10} className="viz-label">{f.name}</text>
              <rect x={X(sub)} y={y} width={X(1 - f.bias) - X(sub)} height={12} fill="var(--danger)" opacity={0.35} />
              <rect x={X(1 - f.bias)} y={y} width={Math.max(X(top) - X(1 - f.bias), 1)} height={12} fill="var(--accent)" opacity={0.6} />
            </g>
          );
        })}
        <line x1={X(lgx)} x2={X(lgx)} y1={6} y2={H - 14} stroke="var(--text)" strokeDasharray="3 3" />
        {[-128, -64, 0, 64, 128].map((t) => (
          <text key={t} x={X(t)} y={H - 2} textAnchor="middle" className="viz-label">2^{t}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0", display: "grid", gridTemplateColumns: "auto auto auto", gap: "2px 12px" }}>
        {FMTS.map((f) => {
          const v = roundTo(x, f);
          const rel = Math.abs(v - x) / x;
          return (
            <span key={f.name} style={{ display: "contents" }}>
              <span>{f.name}</span>
              <span>{Number.isFinite(v) ? v.toPrecision(6) : "inf"}</span>
              <span>rel. error {Number.isFinite(rel) ? rel.toExponential(1) : "inf"}</span>
            </span>
          );
        })}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each bar spans the format&apos;s range on a log₂ axis: normal numbers in the accent colour, subnormals in red. BF16
        keeps FP32&apos;s 8 exponent bits and so its full range, at the cost of only 8 significant bits. FP16 has three more
        bits of precision but overflows above 65504 and goes subnormal below 6 × 10⁻⁵. The FP8 and FP4 bars are tiny:
        their ranges are a few dozen binades or fewer, which is why they are used with scale factors. Slide x and compare the
        rounded values.
      </figcaption>
    </figure>
  );
}
