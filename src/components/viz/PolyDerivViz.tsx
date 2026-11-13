"use client";

import { useState } from "react";

const D = [
  [0, 1, 0, 0],
  [0, 0, 2, 0],
  [0, 0, 0, 3],
  [0, 0, 0, 0],
];

/** Differentiation on cubic polynomials as a 4 × 4 matrix acting on coefficient vectors. */
export function PolyDerivViz() {
  const [a, setA] = useState([0.5, -1, -0.5, 0.5]);
  const da = D.map((row) => row.reduce((s, v, j) => s + v * a[j], 0));
  const ev = (c: number[], x: number) => c.reduce((s, v, k) => s + v * x ** k, 0);
  const W = 320, H = 160;
  const px = (x: number) => 20 + ((x + 2) / 4) * (W - 30);
  const py = (y: number) => H / 2 - Math.max(-6, Math.min(6, y)) * ((H - 20) / 12);
  const curve = (c: number[]) => {
    const pts: string[] = [];
    for (let x = -2; x <= 2.0001; x += 0.04) pts.push(`${px(x).toFixed(1)},${py(ev(c, x)).toFixed(1)}`);
    return pts.join(" ");
  };
  const fmt = (v: number) => (Math.abs(v) < 1e-9 ? "0" : v.toFixed(1));
  return (
    <figure className="viz">
      {a.map((v, k) => (
        <label key={k} className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: k ? 2 : 0 }}>
          <span className="mono" style={{ minWidth: 76 }}>a{k} (x{k ? <sup>{k}</sup> : <sup>0</sup>}) = {v.toFixed(1)}</span>
          <input type="range" min={-2} max={2} step={0.1} value={v} onChange={(e) => setA(a.map((w, j) => (j === k ? Number(e.target.value) : w)))} aria-label={`coefficient of x to the ${k}`} style={{ flex: 1, minWidth: 0 }} />
        </label>
      ))}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="A cubic and its derivative">
        <line x1={20} x2={W - 10} y1={py(0)} y2={py(0)} stroke="var(--border)" />
        <line x1={px(0)} x2={px(0)} y1={6} y2={H - 6} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text)" strokeWidth={2} points={curve(a)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={curve(da)} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto", whiteSpace: "pre" }}>
        {D.map((row, i) => `[${row.join(" ")}]  ${i === 1 ? "·" : " "} ${fmt(a[i]).padStart(5)}  ${i === 1 ? "=" : " "} ${fmt(da[i]).padStart(5)}`).join("\n")}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A cubic a0 + a1x + a2x² + a3x³ (black) is the vector (a0, a1, a2, a3), and its derivative (blue) is that vector times
        the matrix D. Column k of D is the coefficient vector of the derivative of x^k. D is not invertible (constants go to
        0) and D⁴ = 0, since four derivatives kill any cubic.
      </figcaption>
    </figure>
  );
}
