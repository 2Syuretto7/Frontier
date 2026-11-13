"use client";

import { useState } from "react";

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

const HS = Array.from({ length: 5 }, (_, k) => {
  const a = Math.PI / 2 + (2 * Math.PI * k) / 5;
  return { n: [Math.cos(a), Math.sin(a)], b: 0.55 };
});

/** Halfspaces combined by intersection, which always gives a convex polyhedron, or by union, which usually does not. */
export function HalfspaceViz() {
  const [on, setOn] = useState([true, true, true, false, false]);
  const [mode, setMode] = useState<"and" | "or">("and");
  const active = HS.filter((_, i) => on[i]);
  const inside = (x: number, y: number) => {
    if (!active.length) return true;
    const t = active.map((h) => h.n[0] * x + h.n[1] * y <= h.b);
    return mode === "and" ? t.every(Boolean) : t.some(Boolean);
  };
  const G = 56;
  const cells: [number, number][] = [];
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    const x = -1.2 + (2.4 * (i + 0.5)) / G, y = -1.2 + (2.4 * (j + 0.5)) / G;
    if (inside(x, y)) cells.push([x, y]);
  }
  const witness = (() => {
    const r = makeRng(3);
    for (let tries = 0; tries < 600 && cells.length > 1; tries++) {
      const a = cells[Math.floor(r() * cells.length)], b = cells[Math.floor(r() * cells.length)];
      for (let t = 1; t < 40; t++) {
        const th = t / 40, x = th * a[0] + (1 - th) * b[0], y = th * a[1] + (1 - th) * b[1];
        if (!inside(x, y)) return [a, b];
      }
    }
    return null;
  })();
  const W = 240;
  const P = (v: number) => 120 + v * 95;
  const Q = (v: number) => 120 - v * 95;
  const cw = (2.4 / G) * 95;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {HS.map((_, i) => (
          <button key={i} type="button" className="seg" aria-pressed={on[i]} onClick={() => setOn(on.map((v, j) => (j === i ? !v : v)))}>H{i + 1}</button>
        ))}
        <button type="button" className="seg" aria-pressed={mode === "and"} onClick={() => setMode("and")}>intersection</button>
        <button type="button" className="seg" aria-pressed={mode === "or"} onClick={() => setMode("or")}>union</button>
      </div>
      <svg viewBox={`0 0 ${W} ${W}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "0 auto" }} role="img" aria-label="Region formed from halfspaces in the plane">
        {cells.map(([x, y], i) => (
          <rect key={i} x={P(x) - cw / 2} y={Q(y) - cw / 2} width={cw + 0.3} height={cw + 0.3} fill="var(--accent)" opacity={0.22} />
        ))}
        {HS.map((h, i) => {
          const p0 = [h.n[0] * h.b, h.n[1] * h.b], d = [-h.n[1], h.n[0]];
          return (
            <g key={i} opacity={on[i] ? 1 : 0.25}>
              <line x1={P(p0[0] - 2 * d[0])} y1={Q(p0[1] - 2 * d[1])} x2={P(p0[0] + 2 * d[0])} y2={Q(p0[1] + 2 * d[1])} stroke="var(--text-muted)" strokeWidth={1.2} />
              <text x={P(p0[0] + 0.2 * h.n[0])} y={Q(p0[1] + 0.2 * h.n[1]) + 4} textAnchor="middle" className="viz-label">H{i + 1}</text>
            </g>
          );
        })}
        {witness && <line x1={P(witness[0][0])} y1={Q(witness[0][1])} x2={P(witness[1][0])} y2={Q(witness[1][1])} stroke="var(--danger)" strokeWidth={2} />}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {witness ? "not convex: the red segment leaves the region" : "no segment found that leaves the region"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each Hᵢ is a halfspace aᵢᵀx ≤ bᵢ, the side of its line containing the centre. Their intersection, a polyhedron, is
        convex however many you switch on, because each is convex and intersection preserves convexity. Their union is
        usually not, and the red segment is a witness: it joins two points of the region but passes outside it.
      </figcaption>
    </figure>
  );
}
