"use client";

import { useMemo, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const T = 1000, LR = 0.8, Y = 1;

/** Noisy gradient descent on ½(uv − y)² from (4, 0.1) with linear warmup to LR; loss and top Hessian eigenvalue per step. */
export function warmupRun(warm: number) {
  const normal = makeNormal(makeRng(4));
  let u = 4, v = 0.1;
  const loss: number[] = [], sharp: number[] = [], lrs: number[] = [];
  for (let t = 0; t < T; t++) {
    const lr = LR * Math.min(1, (t + 1) / warm);
    const r = u * v - (Y + 0.05 * normal());
    [u, v] = [u - lr * r * v, v - lr * r * u];
    if (!(Math.abs(u * v) < 1e6)) return { loss, sharp, lrs, diverged: t };
    const a = v * v, b = 2 * u * v - Y, c = u * u;
    loss.push(0.5 * (u * v - Y) ** 2);
    sharp.push((a + c) / 2 + Math.sqrt(((a - c) / 2) ** 2 + b * b));
    lrs.push(lr);
  }
  return { loss, sharp, lrs, diverged: null as number | null };
}

export function WarmupCatapultViz() {
  const [warm, setWarm] = useState(200);
  const r = useMemo(() => warmupRun(warm), [warm]);
  const W = 300, H = 120, X0 = 34, PW = W - 42, PH = 100;
  const sx = (t: number) => X0 + (t / T) * PW;
  const ly = (f: number) => 8 + ((2 - Math.max(-4, Math.min(2, Math.log10(Math.max(f, 1e-9))))) / 6) * PH;
  const sy = (s: number) => 8 + (1 - Math.min(s, 20) / 20) * PH;
  const pts = (a: number[], f: (v: number) => number) => a.map((v, t) => `${sx(t)},${f(v)}`).join(" ");
  const peak = r.loss.length ? Math.max(...r.loss) : Infinity;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">warmup steps (η_max = 0.8)</span>
        {[1, 50, 200, 500].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={warm === v} onClick={() => setWarm(v)}>{v}</button>
        ))}
      </div>
      <div className="viz-label" style={{ textAlign: "center" }}>loss (log scale)</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Loss over training for the chosen warmup length">
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.5} points={pts(r.loss, ly)} />
        {[100, 0.01, 0.0001].map((v) => (
          <text key={v} x={X0 - 4} y={ly(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="viz-label" style={{ textAlign: "center" }}>sharpness (black) against the stability limit 2/η (red)</div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Sharpness and the stability limit over training">
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.5} strokeDasharray="4 3" points={pts(r.lrs.map((l) => 2 / l), sy)} />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.5} points={pts(r.sharp, sy)} />
        {[0, 500, 1000].map((t) => (
          <text key={t} x={sx(t)} y={H + 12} textAnchor="middle" className="viz-label">{t}</text>
        ))}
        {[0, 10, 20].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {r.diverged !== null
          ? `diverged at step ${r.diverged}`
          : `peak loss ${peak.toFixed(2)}; final sharpness ${r.sharp[T - 1].toFixed(2)} < 2/η = ${(2 / LR).toFixed(2)}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Gradient descent with slightly noisy targets on ½(uv − 1)², starting at the sharp, unbalanced point (4, 0.1),
        with the learning rate raised linearly to 0.8. Whenever the sharpness exceeds 2/η the iterate is briefly unstable,
        the loss spikes, and the large residual shrinks the imbalance u² − v², moving the run to a flatter minimum. With
        no warmup the instability is too violent and the run diverges within a few steps; a short warmup survives a large
        spike; longer warmups reach the same flat minimum through smaller and smaller spikes.
      </figcaption>
    </figure>
  );
}
