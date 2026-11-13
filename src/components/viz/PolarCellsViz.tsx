"use client";

import { useState, type ReactElement } from "react";

const S = 240, P = 16;
const R = 1, TH = Math.PI / 2;
const ux = (r: number) => P + (r / R) * (S - 2 * P);
const uy = (t: number) => S - P - (t / TH) * (S - 2 * P);
const C = P, SC = S - 2 * P;
const xx = (x: number) => C + x * SC;
const yy = (y: number) => S - C - y * SC;

/** Equal cells in (r, θ) map to sectors whose areas grow like r: the factor r in dx dy = r dr dθ. */
export function PolarCellsViz() {
  const [n, setN] = useState(5);
  const [pick, setPick] = useState<[number, number]>([3, 2]);
  const dr = R / n, dt = TH / n;
  const [i, j] = [Math.min(pick[0], n - 1), Math.min(pick[1], n - 1)];
  const left: ReactElement[] = [];
  const right: ReactElement[] = [];
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
    const sel = a === i && b === j;
    const r0 = a * dr, r1 = r0 + dr, t0 = b * dt, t1 = t0 + dt;
    left.push(
      <rect key={`l${a}-${b}`} x={ux(r0)} y={uy(t1)} width={ux(r1) - ux(r0)} height={uy(t0) - uy(t1)} fill={sel ? "var(--danger)" : "var(--accent-soft)"} stroke="var(--bg)" strokeWidth={1.5} onClick={() => setPick([a, b])} style={{ cursor: "pointer" }} />,
    );
    const arc = (r: number, from: number, to: number) => {
      const pts: string[] = [];
      for (let k = 0; k <= 8; k++) {
        const t = from + ((to - from) * k) / 8;
        pts.push(`${xx(r * Math.cos(t)).toFixed(1)},${yy(r * Math.sin(t)).toFixed(1)}`);
      }
      return pts;
    };
    const poly = [...arc(r1, t0, t1), ...arc(r0, t1, t0)].join(" ");
    right.push(<polygon key={`r${a}-${b}`} points={poly} fill={sel ? "var(--danger)" : "var(--accent-soft)"} stroke="var(--bg)" strokeWidth={1.5} onClick={() => setPick([a, b])} style={{ cursor: "pointer" }} />);
  }
  const rc = (i + 0.5) * dr;
  const exact = 0.5 * ((i + 1) ** 2 - i ** 2) * dr * dr * dt;
  return (
    <figure className="viz">
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "46%", minWidth: 150, maxWidth: 260 }} role="img" aria-label="Grid in r and theta">
          {left}
          <text x={S / 2} y={S - 2} textAnchor="middle" className="viz-label">r</text>
          <text x={2} y={S / 2} className="viz-label">θ</text>
        </svg>
        <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "46%", minWidth: 150, maxWidth: 260 }} role="img" aria-label="The same cells in the plane">
          {right}
          <text x={S / 2} y={S - 2} textAnchor="middle" className="viz-label">x</text>
          <text x={2} y={S / 2} className="viz-label">y</text>
        </svg>
      </div>
      <label className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="mono" style={{ minWidth: 70 }}>{n} × {n}</span>
        <input type="range" min={2} max={12} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <div className="mono" style={{ fontSize: 13, textAlign: "center", overflowWrap: "anywhere" }}>
        selected cell: Δr·Δθ = {(dr * dt).toFixed(4)}, area in the plane = {exact.toFixed(4)} = r_mid·Δr·Δθ with r_mid = {rc.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Tap a cell. All cells on the left have the same area, but their images on the right grow with r: a cell at radius r
        becomes a sector of area r·Δr·Δθ (exactly, for the midpoint radius). So integrating in polar coordinates needs the
        factor r, the Jacobian determinant of (r, θ) ↦ (r cos θ, r sin θ).
      </figcaption>
    </figure>
  );
}
