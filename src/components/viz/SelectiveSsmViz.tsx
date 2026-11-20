"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const T = 40, MARK = 8;

type Mode = "slow" | "fast" | "selective";

/** Inputs: noise in [−0.6, 0.6] except a marked token of value 1 at step MARK. */
export function inputs(seed = 13) {
  const r = rand(seed);
  return Array.from({ length: T }, (_, t) => (t === MARK ? 1 : (r() * 2 - 1) * 0.6));
}

/** One-state SSM with a = −1, b = c = 1, discretised by zero-order hold with step Δ_t. */
export function run(xs: number[], mode: Mode) {
  let h = 0;
  return xs.map((x, t) => {
    const d = mode === "slow" ? 0.1 : mode === "fast" ? 1 : t === MARK ? 3 : 0.002;
    const abar = Math.exp(-d);
    h = abar * h + (1 - abar) * x;
    return { h, d };
  });
}

const LABEL: Record<Mode, string> = { slow: "fixed Δ = 0.1", fast: "fixed Δ = 1", selective: "selective Δ" };

export function SelectiveSsmViz() {
  const [mode, setMode] = useState<Mode>("selective");
  const xs = useMemo(() => inputs(), []);
  const out = useMemo(() => run(xs, mode), [xs, mode]);
  const W = 330, H = 200, X0 = 30, PW = 290, Y0 = 8, PH = 150;
  const bw = PW / T;
  const px = (t: number) => X0 + t * bw + bw / 2;
  const py = (v: number) => Y0 + PH / 2 - v * (PH / 2) * 0.9;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Step size">
          {(Object.keys(LABEL) as Mode[]).map((m) => (
            <button key={m} className="seg" aria-pressed={mode === m} onClick={() => setMode(m)}>{LABEL[m]}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Inputs and the state of a one-dimensional state space model">
        <line x1={X0} x2={X0 + PW} y1={py(0)} y2={py(0)} stroke="var(--border)" />
        {[1, -1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(v) + 3} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        {xs.map((x, t) => (
          <rect key={t} x={X0 + t * bw + 1} y={Math.min(py(0), py(x))} width={bw - 2} height={Math.abs(py(x) - py(0))} style={{ fill: t === MARK ? "var(--code-string)" : "var(--text-muted)" }} opacity={t === MARK ? 0.9 : 0.35} />
        ))}
        <polyline points={out.map((o, t) => `${px(t).toFixed(1)},${py(o.h).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <text x={px(MARK)} y={py(1) - 3} textAnchor="middle" className="viz-label" style={{ fill: "var(--code-string)" }}>marked</text>
        <text x={X0} y={H - 18} className="viz-label">bars: inputs over 40 steps; line: state h</text>
        <text x={X0} y={H - 4} className="viz-label">the task: report the marked value at the end</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {LABEL[mode]}: final state {out[T - 1].h.toFixed(3)}; marked value 1
      </div>
      <figcaption className="viz-caption">
        With a fixed step the model weighs every input by its position alone: a small Δ averages recent noise, a large Δ tracks
        only the latest input, and neither keeps the marked value. When Δ depends on the input, as in Mamba, a large Δ at the
        marked token overwrites the state with it, and a tiny Δ elsewhere holds the state almost unchanged.
      </figcaption>
    </figure>
  );
}
