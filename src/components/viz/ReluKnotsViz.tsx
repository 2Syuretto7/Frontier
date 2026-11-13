"use client";

import { useState } from "react";

const f = (x: number) => Math.sin(3 * x);

/** A continuous function, its piecewise-linear interpolant, and the ReLU hinges whose sum is exactly that interpolant. */
export function ReluKnotsViz() {
  const [n, setN] = useState(5);
  const [show, setShow] = useState(true);
  const ts = Array.from({ length: n + 1 }, (_, i) => (2 * i) / n);
  const vs = ts.map(f);
  const s = ts.slice(0, -1).map((t, i) => (vs[i + 1] - vs[i]) / (ts[i + 1] - t));
  const terms = s.map((si, i) => ({ w: i === 0 ? si : si - s[i - 1], t: ts[i] }));
  const net = (x: number) => vs[0] + terms.reduce((acc, { w, t }) => acc + w * Math.max(0, x - t), 0);
  const xs = Array.from({ length: 401 }, (_, i) => (2 * i) / 400);
  const err = Math.max(...xs.map((x) => Math.abs(net(x) - f(x))));
  const W = 330, H = 170, ylo = -1.6, yhi = 1.6;
  const X = (x: number) => 14 + (x / 2) * (W - 28);
  const Y = (y: number) => 8 + ((yhi - y) / (yhi - ylo)) * (H - 16);
  const line = (g: (x: number) => number) => xs.map((x) => `${X(x).toFixed(1)},${Y(g(x)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          hidden units {n}
          <input type="range" min={1} max={24} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="number of hidden units" style={{ width: 140 }} />
        </label>
        <button type="button" className="seg" aria-pressed={show} onClick={() => setShow(!show)}>show hinges</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Target function, the ReLU network approximation and its individual hinge terms">
        <line x1={14} x2={W - 14} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        {show && terms.map(({ w, t }, i) => (
          <polyline key={i} fill="none" stroke="var(--text-muted)" strokeWidth={0.8} opacity={0.6} points={line((x) => w * Math.max(0, x - t))} />
        ))}
        <polyline fill="none" stroke="var(--text)" strokeWidth={2} points={line(f)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} strokeDasharray="5 3" points={line(net)} />
        {ts.map((t, i) => <circle key={i} cx={X(t)} cy={Y(vs[i])} r={2.6} fill="var(--danger)" />)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        sup error {err.toFixed(4)} with {n} ReLU units
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The solid curve is sin 3x on [0, 2] and the dashed curve the network c + Σ wᵢ ReLU(x − tᵢ), with one unit per knot.
        The faint lines are the individual terms wᵢ ReLU(x − tᵢ): each switches on at its knot and changes the slope by wᵢ.
        Uniform continuity guarantees that enough knots bring the sup error below any ε.
      </figcaption>
    </figure>
  );
}
