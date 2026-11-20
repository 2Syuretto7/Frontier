"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 3000;

/** Underlying expected loss at step s (1-based). */
export function trueLoss(s: number) {
  return 2 + 6 * Math.pow(s + 50, -0.35);
}

/** Noisy per-step training losses with a fixed seed. */
export function noisyLosses(seed = 11, sd = 0.08) {
  const r = rand(seed);
  const out: number[] = [];
  for (let s = 1; s <= N; s++) {
    const u = Math.max(1e-12, r()), v = r();
    out.push(trueLoss(s) + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v));
  }
  return out;
}

/** Exponential moving average, optionally divided by 1 − β^t to remove the bias towards the zero start. */
export function emaTs(xs: number[], beta: number, debias: boolean) {
  let m = 0;
  return xs.map((x, i) => {
    m = beta * m + (1 - beta) * x;
    return debias ? m / (1 - Math.pow(beta, i + 1)) : m;
  });
}

export function TrainingCurveViz() {
  const [beta, setBeta] = useState(0.9);
  const [debias, setDebias] = useState(true);
  const [logx, setLogx] = useState(false);
  const raw = useMemo(() => noisyLosses(), []);
  const sm = useMemo(() => (beta === 0 ? raw : emaTs(raw, beta, debias)), [raw, beta, debias]);
  const W = 330, H = 212, X0 = 34, PW = 286, Y0 = 8, PH = 160, LMIN = 2.1, LMAX = 3.6;
  const px = (s: number) => X0 + (logx ? Math.log10(s) / Math.log10(N) : s / N) * PW;
  const py = (v: number) => Y0 + PH - ((Math.min(LMAX, Math.max(LMIN, v)) - LMIN) / (LMAX - LMIN)) * PH;
  const idx = Array.from({ length: N }, (_, i) => i).filter((i) => (logx ? i < 60 || i % 10 === 0 : i % 6 === 0) || i === N - 1);
  const line = (ys: number[]) => idx.map((i) => `${px(i + 1).toFixed(1)},${py(ys[i]).toFixed(1)}`).join(" ");
  const truth = Array.from({ length: N }, (_, i) => trueLoss(i + 1));
  const lag = sm[N - 1] - truth[N - 1];
  const early = sm[49] - truth[49];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Smoothing">
          {[0, 0.9, 0.99].map((b) => (
            <button key={b} className="seg" aria-pressed={beta === b} onClick={() => setBeta(b)}>{b === 0 ? "raw" : `β = ${b}`}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Bias correction">
          {[true, false].map((d) => (
            <button key={String(d)} className="seg" aria-pressed={debias === d} onClick={() => setDebias(d)}>{d ? "debiased" : "no correction"}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Step axis">
          {[false, true].map((l) => (
            <button key={String(l)} className="seg" aria-pressed={logx === l} onClick={() => setLogx(l)}>{l ? "log steps" : "linear steps"}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Noisy training loss with a smoothed curve">
        {[2.2, 2.6, 3.0, 3.4].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(v) + 3} textAnchor="end" className="viz-label">{v.toFixed(1)}</text>
          </g>
        ))}
        {beta !== 0 && <polyline points={line(raw)} fill="none" stroke="var(--text-muted)" strokeWidth={0.5} opacity={0.5} />}
        <polyline points={line(sm)} fill="none" stroke="var(--accent)" strokeWidth={beta === 0 ? 0.6 : 2} />
        <polyline points={line(truth)} fill="none" stroke="var(--code-function)" strokeDasharray="4 3" strokeWidth={1.4} />
        <text x={X0} y={H - 14} className="viz-label">{logx ? "steps 1 to 3,000, log scale" : "steps 1 to 3,000"}</text>
        <text x={X0} y={H - 2} className="viz-label">dashed: expected loss; grey: raw per-step loss</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {beta === 0
          ? "raw per-step losses: noise of about 0.08 hides the trend"
          : `smoothed minus expected: ${early >= 0 ? "+" : ""}${early.toFixed(3)} at step 50, ${lag >= 0 ? "+" : ""}${lag.toFixed(3)} at step 3,000`}
      </div>
      <figcaption className="viz-caption">
        Per-step training loss is noisy because each batch is a different sample of text. An exponential moving average shows the
        trend, at a price: while the loss is falling, the average lags behind and sits above the expected loss, more so for larger
        β. Without bias correction the average starts from zero and is far too low early on. On a log step axis the early part
        of training, where most of the change happens, becomes readable.
      </figcaption>
    </figure>
  );
}
