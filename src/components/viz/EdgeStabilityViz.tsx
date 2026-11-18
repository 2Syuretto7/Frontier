"use client";

import { useMemo, useState } from "react";

const A = 0.005, S_STAR = 30, X0 = 0.05, S0 = 15, T = 2000;

/** Gradient descent on L(x, s) = ½sx² + ½a(s − s*)²; s is the sharpness along x. Without feedback the ½x² term is dropped from the s-gradient. */
export function edgeRun(lr: number, feedback: boolean) {
  let x = X0, s = S0;
  const sharp: number[] = [s], loss: number[] = [0.5 * s * x * x + 0.5 * A * (s - S_STAR) ** 2];
  let diverged = -1;
  for (let t = 1; t <= T; t++) {
    const gx = s * x, gs = (feedback ? 0.5 * x * x : 0) + A * (s - S_STAR);
    [x, s] = [x - lr * gx, s - lr * gs];
    if (!(Math.abs(x) < 1e3)) { diverged = t; break; }
    sharp.push(s);
    loss.push(0.5 * s * x * x + 0.5 * A * (s - S_STAR) ** 2);
  }
  const cross = sharp.findIndex((v) => v > 2 / lr);
  const after = cross >= 0 ? sharp.slice(cross) : [];
  const meanAfter = after.length ? after.reduce((p, q) => p + q, 0) / after.length : NaN;
  const maxLoss = cross >= 0 ? Math.max(...loss.slice(cross)) : NaN;
  return { sharp, loss, cross, meanAfter, maxLoss, diverged };
}

export function EdgeStabilityViz() {
  const [lr, setLr] = useState(0.1);
  const [feedback, setFeedback] = useState(true);
  const run = useMemo(() => edgeRun(lr, feedback), [lr, feedback]);
  const W = 320, PH = 110, X1 = 34, PW = W - X1 - 8;
  const sx = (t: number) => X1 + (t / T) * PW;
  const sy = (v: number) => 8 + (1 - Math.min(Math.max(v, 0), 45) / 45) * PH;
  const ly = (v: number) => {
    const l = Math.min(Math.max(Math.log10(Math.max(v, 1e-12)), -3), 3);
    return PH + 40 + (1 - (l + 3) / 6) * PH;
  };
  const step = 4;
  const sharpPts = run.sharp.filter((_, t) => t % step === 0).map((v, i) => `${sx(i * step)},${sy(v)}`).join(" ");
  const lossPts = run.loss.filter((_, t) => t % step === 0).map((v, i) => `${sx(i * step)},${ly(v)}`).join(" ");
  const H = 2 * PH + 64;
  let summary: string;
  if (run.diverged >= 0) summary = `sharpness first passes 2/η = ${(2 / lr).toFixed(1)} at step ${run.cross}; |x| blows up at step ${run.diverged}`;
  else if (run.cross < 0) summary = `2/η = ${(2 / lr).toFixed(1)} is never reached; sharpness after ${T} steps ${run.sharp[T].toFixed(1)}, still rising towards s* = ${S_STAR}`;
  else summary = `sharpness first passes 2/η = ${(2 / lr).toFixed(1)} at step ${run.cross}; mean sharpness after that ${run.meanAfter.toFixed(1)}; largest loss after that ${run.maxLoss.toFixed(0)}`;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">learning rate η</span>
        {[0.05, 0.1, 0.12].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={lr === v} onClick={() => setLr(v)}>{v}</button>
        ))}
        <button type="button" className="seg" aria-pressed={!feedback} onClick={() => setFeedback(!feedback)}>remove the ½x² feedback</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Sharpness and loss of gradient descent on a model with a sharpening direction">
        <line x1={X1} y1={sy(0)} x2={X1 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={X1} y1={sy(0)} x2={X1} y2={sy(45)} stroke="var(--border)" />
        <line x1={X1} y1={sy(2 / lr)} x2={X1 + PW} y2={sy(2 / lr)} stroke="var(--danger)" strokeDasharray="4 3" />
        <text x={X1 + PW} y={sy(2 / lr) - 3} textAnchor="end" className="viz-label">2/η</text>
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.5} points={sharpPts} />
        {[0, 20, 40].map((v) => (
          <text key={v} x={X1 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
        <text x={X1 + 4} y={16} className="viz-label">sharpness s</text>
        <line x1={X1} y1={ly(1e-3)} x2={X1 + PW} y2={ly(1e-3)} stroke="var(--border)" />
        <line x1={X1} y1={ly(1e-3)} x2={X1} y2={ly(1e3)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.2} points={lossPts} />
        {[-3, 0, 3].map((p) => (
          <text key={p} x={X1 - 4} y={ly(10 ** p) + 4} textAnchor="end" className="viz-label">{`1e${p}`}</text>
        ))}
        <text x={X1 + 4} y={ly(1e3) + 10} className="viz-label">loss (log scale)</text>
        {[0, 1000, 2000].map((t) => (
          <text key={t} x={sx(t)} y={H - 4} textAnchor="middle" className="viz-label">{t}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>{summary}</div>
      <figcaption className="viz-caption" aria-live="polite">
        Gradient descent on ½sx² + ½a(s − 30)² from x = 0.05, s = 15, with a = 0.005. The pull towards s = 30 makes the
        sharpness rise. With η = 0.05 the threshold 2/η = 40 is above 30, so nothing goes wrong. With η = 0.1 or 0.12 the
        sharpness reaches 2/η, x starts to oscillate and grow, and the ½x² term in the gradient for s pushes the sharpness
        back down: it then cycles around 2/η, with loss spikes at each cycle but no divergence. Remove that feedback and
        the sharpness stays above 2/η while x grows without limit, until the run blows up.
      </figcaption>
    </figure>
  );
}
