"use client";

import { useState } from "react";

/** Data uniform on [0, w]; generator uniform on [theta, theta + w]. */
export const jsd = (theta: number, w: number) => Math.min(Math.abs(theta) / w, 1) * Math.log(2);
export const w1 = (theta: number) => Math.abs(theta);

const THETAS = [0.1, 0.5, 1, 1.5], WIDTHS = [0.2, 1];

export function WassersteinViz() {
  const [ti, setTi] = useState(2), [wi, setWi] = useState(0);
  const th = THETAS[ti], w = WIDTHS[wi];
  const W = 330, H = 190, X0 = 34, PW = W - 44, Y0 = 70, PH = 80, TL = -2, TH = 2, YM = 2;
  const sx = (t: number) => X0 + ((t - TL) / (TH - TL)) * PW, sy = (v: number) => Y0 + PH - (v / YM) * PH;
  const grid = Array.from({ length: 401 }, (_, i) => TL + (i * (TH - TL)) / 400);
  const curve = (f: (t: number) => number) => grid.map((t, i) => `${i ? "L" : "M"}${sx(t).toFixed(1)},${sy(f(t)).toFixed(1)}`).join(" ");
  const bx = (x: number) => X0 + ((x - TL) / (TH - TL)) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">shift θ</span>
        <div className="segmented" role="group" aria-label="Generator shift">
          {THETAS.map((t, i) => <button key={t} type="button" className="seg" aria-pressed={ti === i} onClick={() => setTi(i)}>{t}</button>)}
        </div>
        <span className="viz-label">width</span>
        <div className="segmented" role="group" aria-label="Width of both distributions">
          {WIDTHS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={wi === i} onClick={() => setWi(i)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Wasserstein distance and Jensen-Shannon divergence against shift">
        <rect x={bx(0)} y={14} width={bx(w) - bx(0)} height={14} fill="var(--text-muted)" fillOpacity={0.5} />
        <rect x={bx(th)} y={32} width={bx(th + w) - bx(th)} height={14} fill="var(--accent)" fillOpacity={0.6} />
        <text x={X0 - 4} y={25} textAnchor="end" className="viz-label">data</text>
        <text x={X0 - 4} y={43} textAnchor="end" className="viz-label">gen.</text>
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border-strong)" />
        <path d={curve(w1)} fill="none" stroke="var(--code-function)" strokeWidth={2} />
        <path d={curve((t) => jsd(t, w))} fill="none" stroke="var(--danger)" strokeWidth={2} />
        <line x1={sx(th)} x2={sx(th)} y1={Y0} y2={Y0 + PH} stroke="var(--text-muted)" strokeDasharray="3 3" />
        {[-2, -1, 0, 1, 2].map((t) => <text key={t} x={sx(t)} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{t}</text>)}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">shift θ of the generator</text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--code-function)" }}>●</span> Wasserstein-1 distance</span>
        <span><span style={{ color: "var(--danger)" }}>●</span> Jensen-Shannon divergence</span>
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`θ = ${th}: W1 ${w1(th).toFixed(3)} (slope 1), JSD ${jsd(th, w).toFixed(3)} (slope ${Math.abs(th) < w ? (Math.log(2) / w).toFixed(3) : "0"})`}
      </div>
      <figcaption className="viz-caption">
        Two uniform distributions of the same width, one shifted by θ. Once they stop overlapping, at θ equal to the width,
        the Jensen-Shannon divergence is stuck at log 2 ≈ 0.693 and its slope is zero, so a generator trained on it learns
        nothing about which way to move. The Wasserstein distance is the shift itself, with slope 1 however far apart the
        distributions are.
      </figcaption>
    </figure>
  );
}
