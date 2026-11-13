"use client";

import { useMemo, useState } from "react";

const STEPS = 600, P = 300, LAM = 1, SIGMA = 1, X0 = 4;
type Kind = "high" | "low" | "cosine" | "step";
const LR: Record<Kind, (t: number) => number> = {
  high: () => 0.5,
  low: () => 0.02,
  cosine: (t) => 0.5 * 0.5 * (1 + Math.cos((Math.PI * t) / STEPS)),
  step: (t) => 0.5 * 0.1 ** Math.floor(t / 200),
};
const NAMES: Record<Kind, string> = { high: "constant 0.5", low: "constant 0.02", cosine: "cosine from 0.5", step: "step decay ×0.1" };

function gauss(seed: number) {
  let a = seed >>> 0;
  const u = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(u() + 1e-12)) * Math.cos(2 * Math.PI * u());
}

/** Average loss of noisy SGD on a quadratic under four learning-rate schedules. */
export function LrScheduleViz() {
  const [kind, setKind] = useState<Kind>("cosine");
  const curves = useMemo(() => {
    const out = {} as Record<Kind, number[]>;
    (Object.keys(LR) as Kind[]).forEach((k) => {
      const r = gauss(21);
      const xs = new Array(P).fill(X0);
      const loss: number[] = [];
      for (let t = 0; t < STEPS; t++) {
        loss.push(xs.reduce((s, x) => s + 0.5 * LAM * x * x, 0) / P);
        const lr = LR[k](t);
        for (let i = 0; i < P; i++) xs[i] -= lr * (LAM * xs[i] + SIGMA * r());
      }
      out[k] = loss;
    });
    return out;
  }, []);
  const W = 320, H = 170;
  const px = (t: number) => 34 + (t / STEPS) * (W - 44);
  const py = (l: number) => 10 + ((1 - Math.max(-4, Math.min(1, Math.log10(l)))) / 5) * (H - 34);
  const line = (k: Kind) => curves[k].filter((_, t) => t % 3 === 0).map((l, i) => `${px(i * 3).toFixed(1)},${py(l).toFixed(1)}`).join(" ");
  const fin = curves[kind][STEPS - 1];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(Object.keys(LR) as Kind[]).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={kind === k} onClick={() => setKind(k)}>{NAMES[k]}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Average loss against step, log scale">
        {[1, 0, -1, -2, -3, -4].map((e) => (
          <g key={e}>
            <line x1={34} x2={W - 10} y1={py(10 ** e)} y2={py(10 ** e)} stroke="var(--border)" />
            <text x={30} y={py(10 ** e) + 4} textAnchor="end" className="viz-label">1e{e}</text>
          </g>
        ))}
        {[0, 200, 400, 600].map((t) => <text key={t} x={px(t)} y={H - 8} textAnchor="middle" className="viz-label">{t}</text>)}
        {(Object.keys(LR) as Kind[]).filter((k) => k !== kind).map((k) => (
          <polyline key={k} fill="none" stroke="var(--border)" strokeWidth={1.5} points={line(k)} />
        ))}
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2.2} points={line(kind)} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {NAMES[kind]}: final average loss {fin.toFixed(4)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        SGD on ½x² with gradient noise of standard deviation 1, averaged over {P} runs. A high constant learning rate gets
        close fast and then hovers at a noise floor proportional to the learning rate. A low one has a lower floor but takes
        hundreds of steps to get there. Decaying the learning rate, smoothly or in steps, gets the speed of the first and the
        floor of the second; each step drop shows as a sudden fall in the loss.
      </figcaption>
    </figure>
  );
}
