"use client";

import { useMemo, useState } from "react";

const T = 400;
type Case = "healthy" | "overfit" | "underfit" | "high" | "low";
const NAMES: Record<Case, string> = { healthy: "healthy", overfit: "overfitting", underfit: "underfitting", high: "lr too high", low: "lr too low" };
const TEXT: Record<Case, string> = {
  healthy: "Both curves fall and level off together with a small gap: keep going, or scale up.",
  overfit: "Training keeps falling while validation turns upwards after a minimum: the model is memorising. Stop at the minimum, add regularisation or data.",
  underfit: "Both curves level off high and close together: the model cannot fit even the training data. Make it bigger or train longer before regularising.",
  high: "Fast early drop, then a noisy plateau with spikes well above where it could be: lower the learning rate or decay it.",
  low: "Smooth but slow, still falling steadily at the end: raise the learning rate.",
};

function uni(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function curves(c: Case) {
  const u = uni(3);
  const train: number[] = [], val: number[] = [];
  for (let t = 0; t < T; t++) {
    const s = t / T;
    let tr: number, va: number, noise = 0.08;
    if (c === "healthy") { tr = 0.25 + 1.9 * Math.exp(-6 * s); va = tr + 0.06; }
    else if (c === "overfit") { tr = 0.05 + 2.0 * Math.exp(-7 * s); va = 0.45 + 1.7 * Math.exp(-9 * s) + 0.9 * Math.max(0, s - 0.3) ** 1.5; }
    else if (c === "underfit") { tr = 1.1 + 1.0 * Math.exp(-8 * s); va = tr + 0.03; }
    else if (c === "high") { tr = 0.8 + 1.4 * Math.exp(-25 * s); va = tr + 0.08; noise = 0.35; if (u() < 0.02) tr += 1.2; }
    else { tr = 2.15 - 1.1 * s; va = tr + 0.05; noise = 0.05; }
    train.push(Math.max(0.01, tr * (1 + noise * (u() - 0.5))));
    val.push(va);
  }
  return { train, val };
}

/** Synthetic training and validation curves for five common situations, with adjustable smoothing. */
export function LossDiagnosisViz() {
  const [c, setC] = useState<Case>("overfit");
  const [beta, setBeta] = useState(0.9);
  const { train, val } = useMemo(() => curves(c), [c]);
  const smooth = useMemo(() => {
    let m = 0;
    return train.map((x, i) => { m = beta * m + (1 - beta) * x; return m / (1 - beta ** (i + 1)); });
  }, [train, beta]);
  const W = 320, H = 170, yMax = 3.2;
  const px = (t: number) => 30 + (t / T) * (W - 40);
  const py = (l: number) => 10 + (1 - Math.min(l, yMax) / yMax) * (H - 34);
  const line = (xs: number[]) => xs.map((v, t) => `${px(t).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
  const valPts = val.filter((_, t) => t % 20 === 19).map((v, k) => [px(k * 20 + 19), py(v)]);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(Object.keys(NAMES) as Case[]).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={c === k} onClick={() => setC(k)}>{NAMES[k]}</button>
        ))}
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          smoothing β = {beta.toFixed(2)}
          <input type="range" min={0} max={0.99} step={0.01} value={beta} onChange={(e) => setBeta(Number(e.target.value))} aria-label="smoothing" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Training and validation loss curves">
        {[0, 1, 2, 3].map((l) => (
          <g key={l}>
            <line x1={30} x2={W - 10} y1={py(l)} y2={py(l)} stroke="var(--border)" />
            <text x={26} y={py(l) + 4} textAnchor="end" className="viz-label">{l}</text>
          </g>
        ))}
        <text x={W - 10} y={H - 8} textAnchor="end" className="viz-label">steps</text>
        <polyline fill="none" stroke="var(--accent)" strokeOpacity={0.25} strokeWidth={1} points={line(train)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={line(smooth)} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.5} points={valPts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} />
        {valPts.map(([x, y], k) => <circle key={k} cx={x} cy={y} r={2.5} fill="var(--danger)" />)}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Blue: training loss per step (faint) and its bias-corrected moving average (bold). Red: validation loss, measured
        every 20 steps. {TEXT[c]}
      </figcaption>
    </figure>
  );
}
