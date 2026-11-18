"use client";

import { useState } from "react";

const X = 3, Y = 4;
const HOOKS = [
  { label: "no hook", f: (g: number) => g },
  { label: "multiply by 2", f: (g: number) => 2 * g },
  { label: "clip to 0.5", f: (g: number) => Math.max(-0.5, Math.min(0.5, g)) },
  { label: "zero it", f: () => 0 },
];

/** z = u + x with u = x * y. A hook on u rewrites the gradient arriving at u before it flows on to x and y. */
export function grads(h: number) {
  const gz = 1, guRaw = gz, gu = HOOKS[h].f(guRaw);
  return { gu, guRaw, gx: gu * Y + gz, gy: gu * X };
}

export function GradHookViz() {
  const [h, setH] = useState(0);
  const g = grads(h);
  const node = (x: number, y: number, name: string, val: string, grad: string, hl = false) => (
    <g>
      <rect x={x - 38} y={y - 20} width={76} height={40} rx={6} fill="none" stroke={hl ? "var(--danger)" : "var(--border)"} strokeWidth={hl ? 2 : 1} />
      <text x={x} y={y - 4} textAnchor="middle" className="viz-label" style={{ fontWeight: 600 }}>{`${name} = ${val}`}</text>
      <text x={x} y={y + 12} textAnchor="middle" className="viz-label" style={{ fill: "var(--accent)" }}>{grad}</text>
    </g>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {HOOKS.map((k, i) => (
          <button key={k.label} type="button" className="seg" aria-pressed={i === h} onClick={() => setH(i)}>{k.label}</button>
        ))}
      </div>
      <svg viewBox="0 0 300 190" style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="A small autograd graph with a gradient hook on the intermediate node">
        <line x1={60} y1={150} x2={150} y2={95} stroke="var(--text-muted)" />
        <line x1={240} y1={150} x2={150} y2={95} stroke="var(--text-muted)" />
        <line x1={150} y1={95} x2={150} y2={45} stroke="var(--text-muted)" />
        <path d="M60,130 C40,80 90,40 112,40" fill="none" stroke="var(--text-muted)" />
        {node(150, 30, "z", "u + x", "grad 1")}
        {node(150, 95, "u", "x·y", h === 0 ? `grad ${g.gu}` : `${g.guRaw} → ${g.gu}`, h > 0)}
        {node(60, 160, "x", String(X), `x.grad ${g.gx}`)}
        {node(240, 160, "y", String(Y), `y.grad ${g.gy}`)}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        z = x·y + x with x = 3 and y = 4. Backward starts with gradient 1 at z, sends 1 to u and 1 straight to x, then u sends
        its gradient times y to x and times x to y. A hook registered on u with u.register_hook(fn) sees the gradient
        arriving at u and may return a replacement, which is what flows on: the leaves&apos; .grad values change, while the
        direct path from z to x is untouched.
      </figcaption>
    </figure>
  );
}
