"use client";

import { useState } from "react";

const GEN: { name: string; f: (t: number) => number; c: string; dash?: string }[] = [
  { name: "KL", f: (t) => (t > 0 ? t * Math.log(t) : 0), c: "var(--accent)" },
  { name: "reverse KL", f: (t) => -Math.log(t), c: "var(--accent)", dash: "5 3" },
  { name: "TV", f: (t) => 0.5 * Math.abs(t - 1), c: "var(--danger)" },
  { name: "Hellinger²", f: (t) => (Math.sqrt(t) - 1) ** 2, c: "var(--text)", dash: "2 2" },
  { name: "χ²", f: (t) => (t - 1) ** 2, c: "var(--text-muted)" },
];

const div = (f: (t: number) => number, p: number, q: number) => q * f(p / q) + (1 - q) * f((1 - p) / (1 - q));

/** Five f-divergences between Bernoulli(p) and Bernoulli(q), as functions of p, with Pinsker's bound on total variation. */
export function FDivViz() {
  const [q, setQ] = useState(0.3);
  const [p, setP] = useState(0.6);
  const W = 330, H = 190, YM = 1.2;
  const X = (x: number) => 30 + x * (W - 46);
  const Y = (y: number) => 170 - (Math.min(Math.max(y, 0), YM) / YM) * 155;
  const ps = Array.from({ length: 197 }, (_, i) => 0.01 + (0.98 * i) / 196);
  const vals = GEN.map((g) => div(g.f, p, q));
  const kl = vals[0];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          q = {q.toFixed(2)}
          <input type="range" min={0.05} max={0.95} step={0.01} value={q} onChange={(e) => setQ(Number(e.target.value))} aria-label="reference probability q" style={{ width: 100 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          p = {p.toFixed(2)}
          <input type="range" min={0.01} max={0.99} step={0.01} value={p} onChange={(e) => setP(Number(e.target.value))} aria-label="probability p" style={{ width: 100 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Five divergences between two Bernoulli distributions as p varies">
        <line x1={X(0)} x2={X(1)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(p)} x2={X(p)} y1={Y(0)} y2={Y(YM)} stroke="var(--border)" strokeDasharray="2 2" />
        {GEN.map((g) => (
          <polyline key={g.name} fill="none" stroke={g.c} strokeWidth={1.6} strokeDasharray={g.dash} points={ps.map((x) => `${X(x).toFixed(1)},${Y(div(g.f, x, q)).toFixed(1)}`).join(" ")} />
        ))}
        <text x={X(q)} y={Y(0) + 13} textAnchor="middle" className="viz-label">p = q</text>
        <text x={X(0)} y={Y(0) + 13} className="viz-label">0</text>
        <text x={X(1)} y={Y(0) + 13} textAnchor="end" className="viz-label">1</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", lineHeight: 1.6 }}>
        {GEN.map((g, i) => `${g.name} ${vals[i].toFixed(3)}`).join(" · ")}
        <br />
        Pinsker: TV {vals[2].toFixed(3)} ≤ √(KL/2) = {Math.sqrt(kl / 2).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each curve is Σ q·f(p/q) for a different convex f with f(1) = 0: KL (solid accent), reverse KL (dashed accent),
        total variation (red), squared Hellinger (dotted) and χ² (grey). All vanish at p = q and grow as p moves away, but
        at different rates: χ² and the two KLs blow up near the edges, while TV and Hellinger stay bounded. Total variation
        is always below √(KL/2), so a small KL forces the distributions to be close in every event.
      </figcaption>
    </figure>
  );
}
