"use client";

import { useMemo, useState } from "react";

const S = [3, 1, 0.3];
const LR = 0.02, T = 2500;

/** Gradient descent on a two-layer linear network, one balanced scalar per singular mode: a ← a + η(s − a²)a, starting at a₀. */
export function modeRuns(a0: number) {
  const modes = S.map((s) => {
    let a = a0;
    const out: number[] = [];
    for (let t = 0; t < T; t++) {
      a = a + LR * (s - a * a) * a;
      out.push(a * a);
    }
    return out;
  });
  const loss = Array.from({ length: T }, (_, t) => 0.5 * S.reduce((acc, s, k) => acc + (s - modes[k][t]) ** 2, 0));
  return { modes, loss };
}

export function PlateauModesViz() {
  const [a0, setA0] = useState(1e-3);
  const r = useMemo(() => modeRuns(a0), [a0]);
  const W = 300, H = 160, X0 = 34, PW = W - 42, PH = 136;
  const sx = (t: number) => X0 + (t / T) * PW;
  const sy = (v: number) => 8 + (1 - Math.min(v, 5) / 5) * PH;
  const line = (a: number[]) => a.filter((_, t) => t % 5 === 4).map((v, j) => `${sx(5 * j + 5)},${sy(v)}`).join(" ");
  const cols = ["var(--accent)", "var(--danger)", "var(--text-muted)"];
  const halves = S.map((s) => Math.log(s / (a0 * a0) - 1) / (2 * s) / LR);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">initial scale a₀</span>
        {[1e-2, 1e-3, 1e-5].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={a0 === v} onClick={() => setA0(v)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Loss and learned strength of three modes over training, showing plateaus">
        <polyline fill="none" stroke="var(--text)" strokeWidth={2} points={line(r.loss)} />
        {r.modes.map((m, k) => (
          <polyline key={k} fill="none" stroke={cols[k]} strokeWidth={1.5} strokeDasharray="4 3" points={line(m)} />
        ))}
        {[0, 500, 1000, 1500, 2000, 2500].map((t) => (
          <text key={t} x={sx(t)} y={H + 12} textAnchor="middle" className="viz-label">{t}</text>
        ))}
        {[0, 1, 3, 5].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`predicted half-way steps: ${halves.map((h, k) => `s = ${S[k]}: ${h > T ? "> " + T : h.toFixed(0)}`).join(", ")}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A two-layer linear network learning a target with singular values 3, 1 and 0.3, from a small balanced
        initialisation. Dashed: the strength a² learned in each mode (blue, red, grey); solid: the loss. Each mode stays
        near zero, then rises along a sigmoid to its singular value, the stronger modes first, so the loss falls in
        stages separated by plateaus. Shrinking the initial scale lengthens every plateau, but only logarithmically.
      </figcaption>
    </figure>
  );
}
