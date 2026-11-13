"use client";

import { useState } from "react";

function logL(p: number, h: number, n: number) {
  let s = 0;
  if (h > 0) s += p <= 0 ? -Infinity : h * Math.log(p);
  if (n - h > 0) s += p >= 1 ? -Infinity : (n - h) * Math.log(1 - p);
  return s;
}

/** The likelihood of a coin's bias p after h heads in n flips, scaled so its peak is 1: it peaks at h/n and narrows as n grows. */
export function LogLikViz() {
  const [n, setN] = useState(10);
  const [h, setH] = useState(7);
  const hh = Math.min(h, n);
  const ph = hh / n;
  const top = logL(ph, hh, n);
  const ps = Array.from({ length: 401 }, (_, i) => i / 400);
  const rel = ps.map((p) => Math.exp(logL(p, hh, n) - top));
  const cut = Math.exp(-1.92);
  const inside = ps.filter((_, i) => rel[i] >= cut);
  const lo = Math.min(...inside), hi = Math.max(...inside);
  const W = 330, H = 150;
  const X = (p: number) => 16 + p * (W - 32);
  const Y = (y: number) => H - 16 - y * (H - 30);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          flips n = {n}
          <input type="range" min={1} max={200} value={n} onChange={(e) => { const v = Number(e.target.value); setN(v); if (h > v) setH(v); }} aria-label="number of flips" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          heads h = {hh}
          <input type="range" min={0} max={n} value={hh} onChange={(e) => setH(Number(e.target.value))} aria-label="number of heads" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Relative likelihood of the coin bias p">
        <rect x={X(lo)} y={10} width={Math.max(X(hi) - X(lo), 1)} height={Y(0) - 10} fill="var(--accent)" opacity={0.12} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={ps.map((p, i) => `${X(p).toFixed(1)},${Y(rel[i]).toFixed(1)}`).join(" ")} />
        <line x1={X(0)} x2={X(1)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(0)} x2={X(1)} y1={Y(cut)} y2={Y(cut)} stroke="var(--text-muted)" strokeDasharray="2 3" />
        <line x1={X(ph)} x2={X(ph)} y1={10} y2={Y(0)} stroke="var(--danger)" strokeDasharray="3 3" />
        <text x={X(0)} y={H - 2} className="viz-label">0</text>
        <text x={X(1)} y={H - 2} textAnchor="end" className="viz-label">1</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        p̂ = h/n = {ph.toFixed(3)}; plausible range {lo.toFixed(3)} to {hi.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The curve is the likelihood p^h(1 − p)^(n − h), divided by its maximum so the peak has height 1. The peak, the
        maximum likelihood estimate, sits at h/n (dashed line). The shaded band is where the likelihood is at least e^(−1.92)
        of its peak, a range of values the data do not rule out. Keep h/n fixed and raise n: the peak stays put while the
        band narrows like 1/√n.
      </figcaption>
    </figure>
  );
}
