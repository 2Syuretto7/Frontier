"use client";

import { useMemo, useState } from "react";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fit(pts: number[][]) {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
  let sxy = 0, sxx = 0;
  pts.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) * (x - mx); });
  const b1 = sxy / sxx;
  return { b0: my - b1 * mx, b1, mx, sxx, n };
}

/** One movable point added to twelve fixed ones: its leverage h = 1/n + (x − x̄)²/Sxx grows with its distance from x̄, and so does its pull on the fitted line. */
export function LeverageViz() {
  const [px10, setPx10] = useState(80);
  const [py10, setPy10] = useState(10);
  const base = useMemo(() => {
    const r = makeRng(404);
    return Array.from({ length: 12 }, (_, i) => { const x = (4 * i) / 11; return [x, 1 + 0.5 * x + 0.4 * (r() + r() - 1)]; });
  }, []);
  const p = [px10 / 10, py10 / 10];
  const without = fit(base);
  const all = fit([...base, p]);
  const h = 1 / all.n + ((p[0] - all.mx) * (p[0] - all.mx)) / all.sxx;
  const W = 330, H = 160;
  const X = (x: number) => 16 + (x / 10) * (W - 32);
  const Y = (y: number) => H - 14 - ((y + 1) / 8) * (H - 24);
  const line = (f: { b0: number; b1: number }, stroke: string, dash?: string) => (
    <line x1={X(0)} y1={Y(f.b0)} x2={X(10)} y2={Y(f.b0 + 10 * f.b1)} stroke={stroke} strokeWidth={1.6} strokeDasharray={dash} />
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          x = {p[0].toFixed(1)}
          <input type="range" min={0} max={100} value={px10} onChange={(e) => setPx10(Number(e.target.value))} aria-label="x position of the extra point" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          y = {p[1].toFixed(1)}
          <input type="range" min={-10} max={70} value={py10} onChange={(e) => setPy10(Number(e.target.value))} aria-label="y position of the extra point" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Fitted lines with and without a movable point">
        {line(without, "var(--text-muted)", "4 3")}
        {line(all, "var(--accent)")}
        {base.map(([x, y], i) => <circle key={i} cx={X(x)} cy={Y(y)} r={2.8} fill="var(--text)" opacity={0.6} />)}
        <circle cx={X(p[0])} cy={Y(p[1])} r={4.5} fill="var(--danger)" />
        <line x1={X(0)} x2={X(10)} y1={Y(-1)} y2={Y(-1)} stroke="var(--border)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        leverage h = {h.toFixed(3)}; slope {all.b1.toFixed(3)} (without the point {without.b1.toFixed(3)})
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The dashed line fits the twelve fixed points; the solid line also includes the movable point (danger colour). Its
        leverage h, the diagonal entry of the hat matrix, is near 1/13 when x is near the others and approaches 1 as x
        moves away. A high-leverage point drags the line towards itself: the fitted value at that x follows y almost
        one for one.
      </figcaption>
    </figure>
  );
}
