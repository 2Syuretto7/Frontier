"use client";

import { useState } from "react";

type P = [number, number];
const GAMMA = 0.3;
/** Update rules for min_x max_y of f = x y (the last adds a penalty -gamma/2 y^2 to the ascent player). */
export const METHODS: [string, (p: P, h: number) => P][] = [
  ["simultaneous", ([x, y], h) => [x - h * y, y + h * x]],
  ["alternating", ([x, y], h) => { const x2 = x - h * y; return [x2, y + h * x2]; }],
  ["extragradient", ([x, y], h) => { const xh = x - h * y, yh = y + h * x; return [x - h * yh, y + h * xh]; }],
  ["penalised", ([x, y], h) => [x - h * y, y + h * (x - GAMMA * y)]],
];

export function run(mi: number, h: number, steps: number): P[] {
  const out: P[] = [[1, 0]];
  for (let i = 0; i < steps; i++) out.push(METHODS[mi][1](out[out.length - 1], h));
  return out;
}

const LRS = [0.1, 0.3], STEPS = 150;

export function GameDynamicsViz() {
  const [mi, setMi] = useState(0), [li, setLi] = useState(0);
  const path = run(mi, LRS[li], STEPS);
  const end = path[path.length - 1], dist = Math.hypot(end[0], end[1]);
  const W = 260, c = W / 2, s = W / 6;
  const clip = (v: number) => Math.max(-2.9, Math.min(2.9, v));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Update rule" style={{ flexWrap: "wrap" }}>
          {METHODS.map(([n], i) => <button key={n} type="button" className="seg" aria-pressed={mi === i} onClick={() => setMi(i)}>{n}</button>)}
        </div>
        <span className="viz-label">step size</span>
        <div className="segmented" role="group" aria-label="Step size">
          {LRS.map((l, i) => <button key={l} type="button" className="seg" aria-pressed={li === i} onClick={() => setLi(i)}>{l}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${W}`} style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }} role="img" aria-label="Trajectory of gradient play">
        <rect x={0} y={0} width={W} height={W} fill="var(--bg-subtle)" />
        <line x1={0} x2={W} y1={c} y2={c} stroke="var(--border)" />
        <line x1={c} x2={c} y1={0} y2={W} stroke="var(--border)" />
        <path d={path.map((p, i) => `${i ? "L" : "M"}${(c + s * clip(p[0])).toFixed(1)},${(c - s * clip(p[1])).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={1.4} />
        <circle cx={c + s} cy={c} r={4} fill="var(--text-muted)" />
        <circle cx={c} cy={c} r={4} fill="var(--success)" />
        <text x={c + 6} y={c - 6} className="viz-label">equilibrium</text>
        <text x={W - 4} y={c + 14} textAnchor="end" className="viz-label">x (generator)</text>
        <text x={c + 6} y={12} className="viz-label">y (discriminator)</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`distance from equilibrium after ${STEPS} steps: ${dist.toFixed(3)} (started at 1)`}
      </div>
      <figcaption className="viz-caption">
        The simplest adversarial game, min over x and max over y of xy, has its only equilibrium at the origin. With step 0.1,
        simultaneous gradient steps spiral outwards to distance 2.11 after 150 steps, alternating steps circle at about 1,
        extragradient, which steps from a look-ahead point, spirals in to 0.47, and a penalty of 0.3 that pulls the
        discriminator towards zero, the role a gradient penalty plays in real GANs, spirals in to 0.21. With step 0.3
        simultaneous play explodes to 641, and the same penalty no longer helps: the step&apos;s outward push exactly cancels it.
      </figcaption>
    </figure>
  );
}
