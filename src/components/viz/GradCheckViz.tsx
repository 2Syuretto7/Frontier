"use client";

import { useState } from "react";

const X = 1;
const TRUE = Math.cos(X);
const fwd = (h: number) => (Math.sin(X + h) - Math.sin(X)) / h;
const cen = (h: number) => (Math.sin(X + h) - Math.sin(X - h)) / (2 * h);
const err = (v: number) => Math.max(Math.abs(v - TRUE), 1e-17);

const W = 520, H = 260, PAD = 40;
const LH0 = -14, LH1 = 0, LE0 = -13, LE1 = 0;
const px = (lh: number) => PAD + ((lh - LH0) / (LH1 - LH0)) * (W - PAD - 10);
const py = (le: number) => 10 + ((LE1 - Math.max(LE0, Math.min(LE1, le))) / (LE1 - LE0)) * (H - 10 - PAD);
const curve = (g: (h: number) => number) => {
  const pts: string[] = [];
  for (let lh = LH0; lh <= LH1 + 1e-9; lh += 0.1) pts.push(`${px(lh).toFixed(1)},${py(Math.log10(err(g(10 ** lh)))).toFixed(1)}`);
  return pts.join(" ");
};
const FWD = curve(fwd);
const CEN = curve(cen);

/** Error of forward and central differences for d/dx sin x at x = 1, as the step h shrinks. */
export function GradCheckViz() {
  const [lh, setLh] = useState(-4);
  const h = 10 ** lh;
  const ef = err(fwd(h));
  const ec = err(cen(h));
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Error against step size, both on log scales">
        <line x1={PAD} y1={H - PAD} x2={W - 10} y2={H - PAD} stroke="var(--border)" />
        <line x1={PAD} y1={10} x2={PAD} y2={H - PAD} stroke="var(--border)" />
        {[-14, -12, -10, -8, -6, -4, -2, 0].map((t) => (
          <text key={`x${t}`} x={px(t)} y={H - PAD + 16} textAnchor="middle" className="viz-label">1e{t}</text>
        ))}
        {[-12, -9, -6, -3, 0].map((t) => (
          <text key={`y${t}`} x={PAD - 4} y={py(t) + 4} textAnchor="end" className="viz-label">1e{t}</text>
        ))}
        <text x={(W + PAD) / 2} y={H - 4} textAnchor="middle" className="viz-label">step h</text>
        <polyline points={FWD} fill="none" stroke="var(--danger)" strokeWidth={2} />
        <polyline points={CEN} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <line x1={px(lh)} y1={10} x2={px(lh)} y2={H - PAD} stroke="var(--text-faint)" strokeDasharray="4 4" />
        <circle cx={px(lh)} cy={py(Math.log10(ef))} r={5} fill="var(--danger)" />
        <circle cx={px(lh)} cy={py(Math.log10(ec))} r={5} fill="var(--accent)" />
      </svg>
      <label className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="mono">h = 1e{lh.toFixed(1)}</span>
        <input type="range" min={LH0} max={-0.5} step={0.1} value={lh} onChange={(e) => setLh(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <figcaption className="viz-caption" aria-live="polite">
        Error of the <span style={{ color: "var(--danger)" }}>forward difference</span>{" "}
        <span className="mono">{ef.toExponential(1)}</span>, of the <span style={{ color: "var(--accent)" }}>central difference</span>{" "}
        <span className="mono">{ec.toExponential(1)}</span>.{" "}
        {lh > -3
          ? "Large steps: the error is the truncation of the Taylor series, falling as h shrinks."
          : lh < -9
            ? "Tiny steps: f(x + h) and f(x) agree in almost every digit, and rounding error divided by h takes over."
            : "Near the bottom of the V. Smaller is not always better."}
      </figcaption>
    </figure>
  );
}
