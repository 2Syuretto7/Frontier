"use client";

import { useState } from "react";

const DOMAINS = ["web", "code", "books", "wiki"];
const REF = [2.25, 0.95, 1.95, 1.58], E = [2.0, 0.8, 1.8, 1.5], K = [3, 6, 2, 1];
const ETAS = [0.3, 1, 3];
const STEPS = 200;

/** Toy DoReMi: the proxy's loss on each domain falls with the weight it has received; weights grow where it lags the reference. */
export function doremi(eta: number, c = 1e-3) {
  let alpha = DOMAINS.map(() => 1 / DOMAINS.length);
  const seen = DOMAINS.map(() => 0);
  const hist: number[][] = [];
  for (let s = 0; s < STEPS; s++) {
    alpha.forEach((a, i) => (seen[i] += a));
    const ex = DOMAINS.map((_, i) => Math.max(E[i] + K[i] / (1 + seen[i]) - REF[i], 0));
    let a2 = alpha.map((a, i) => a * Math.exp(eta * ex[i]));
    const z = a2.reduce((x, y) => x + y, 0);
    a2 = a2.map((a) => (1 - c) * (a / z) + c / DOMAINS.length);
    alpha = a2;
    hist.push(alpha);
  }
  const avg = DOMAINS.map((_, i) => hist.reduce((t, h) => t + h[i], 0) / STEPS);
  return { hist, avg };
}

export function DoremiViz() {
  const [ei, setEi] = useState(1);
  const { hist, avg } = doremi(ETAS[ei]);
  const W = 330, X0 = 28, Y0 = 8, PW = 290, PH = 120;
  const x = (s: number) => X0 + (s / (STEPS - 1)) * PW;
  const y = (a: number) => Y0 + PH - a * PH;
  const styles = [{ stroke: "var(--accent)" }, { stroke: "var(--text)" }, { stroke: "var(--text-muted)" }, { stroke: "var(--text-muted)", dash: "4 3" }];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">step size η</span>
        <div className="segmented" role="group" aria-label="Step size">
          {ETAS.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={ei === j} onClick={() => setEi(j)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + PH + 18}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Domain weights over proxy training steps">
        <line x1={X0} x2={X0 + PW} y1={y(0)} y2={y(0)} stroke="var(--border)" />
        {DOMAINS.map((d, i) => (
          <polyline key={d} points={hist.map((h, s) => `${x(s)},${y(h[i])}`).join(" ")} fill="none" stroke={styles[i].stroke} strokeDasharray={styles[i].dash} strokeWidth={1.8} />
        ))}
        {[0, 0.5, 1].map((v) => <text key={v} x={X0 - 5} y={y(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        <text x={X0 + PW} y={Y0 + PH + 13} textAnchor="end" className="viz-label">proxy training step</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        averaged weights: {DOMAINS.map((d, i) => `${d} ${avg[i].toFixed(2)}`).join(", ")}
      </div>
      <figcaption className="viz-caption">
        Domain weights during a toy DoReMi run: web in colour, code dark, books grey, wiki dashed. Each step raises the weight of
        domains where the proxy model&apos;s loss is furthest above a reference model&apos;s, multiplicatively; as the proxy catches up
        the weights settle. The weights used for the real run are the average over all steps. Larger η reacts faster and swings more.
      </figcaption>
    </figure>
  );
}
