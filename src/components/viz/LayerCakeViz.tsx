"use client";

import { useMemo, useState } from "react";

const f = (x: number) => 0.6 + 0.9 * x * Math.sin(9 * x) + 1.4 * x * x;
const FINE = Array.from({ length: 20000 }, (_, i) => f((i + 0.5) / 20000));
export const EXACT = FINE.reduce((a, b) => a + b, 0) / FINE.length;
export const KS = [4, 8, 16, 64];

/** Riemann lower sum with k equal pieces of the domain, and Lebesgue lower sum with k equal slices of the range [0, 2.6]. */
export function sums(k: number) {
  const m = FINE.length / k;
  const riemann = Array.from({ length: k }, (_, i) => Math.min(...FINE.slice(i * m, (i + 1) * m))).reduce((a, b) => a + b, 0) / k;
  const h = 2.6 / k;
  const lebesgue = FINE.reduce((a, y) => a + Math.floor(y / h) * h, 0) / FINE.length;
  return { riemann, lebesgue };
}

export function LayerCakeViz() {
  const [mode, setMode] = useState<"Riemann" | "Lebesgue">("Lebesgue");
  const [ki, setKi] = useState(1);
  const k = KS[ki];
  const all = useMemo(() => KS.map(sums), []);
  const W = 330, H = 160, X0 = 24, PW = 298, Y0 = 6, PH = 140, YH = 2.6;
  const sx = (x: number) => X0 + x * PW, sy = (y: number) => Y0 + PH - (y / YH) * PH;
  const h = 2.6 / k, N = 400;
  const xs = Array.from({ length: N + 1 }, (_, i) => i / N);
  const step = mode === "Lebesgue"
    ? xs.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(Math.floor(f(x) / h) * h).toFixed(1)}`).join(" ")
    : Array.from({ length: k }, (_, i) => { const lo = Math.min(...FINE.slice((i * FINE.length) / k, ((i + 1) * FINE.length) / k)); return `M${sx(i / k).toFixed(1)},${sy(lo).toFixed(1)} L${sx((i + 1) / k).toFixed(1)},${sy(lo).toFixed(1)}`; }).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Way of slicing">
          {(["Riemann", "Lebesgue"] as const).map((m) => <button key={m} type="button" className="seg" aria-pressed={mode === m} onClick={() => setMode(m)}>{m}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Number of slices">
          {KS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={ki === i} onClick={() => setKi(i)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Lower approximations to an integral by slicing the domain or the range">
        {mode === "Lebesgue" && Array.from({ length: k + 1 }, (_, i) => <line key={i} x1={X0} x2={X0 + PW} y1={sy(i * h)} y2={sy(i * h)} stroke="var(--border)" strokeWidth={0.6} />)}
        {mode === "Riemann" && Array.from({ length: k + 1 }, (_, i) => <line key={i} x1={sx(i / k)} x2={sx(i / k)} y1={Y0} y2={Y0 + PH} stroke="var(--border)" strokeWidth={0.6} />)}
        {[0, 1, 2].map((v) => <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        <path d={xs.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(f(x)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text)" strokeWidth={1.2} strokeDasharray="4 3" />
        <path d={step} fill="none" stroke="var(--accent)" strokeWidth={2} />
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        integral {EXACT.toFixed(4)}; with {k} slices: Riemann {all[ki].riemann.toFixed(4)}, Lebesgue {all[ki].lebesgue.toFixed(4)}
      </div>
      <figcaption className="viz-caption">
        Two lower approximations to the same integral, 1.1624. Riemann cuts the domain into k pieces and uses the lowest
        value on each; Lebesgue cuts the range [0, 2.6] into k levels and rounds f down to the level below, then weighs each
        level by the length of the set where f sits there. Both sums rise to the integral: with 4 slices 0.8275 and 0.8173,
        with 64 slices 1.1403 and 1.1422. The difference is that the Lebesgue sum only ever asks for the measure of a level
        set, so it works for any measurable f, however badly it jumps about.
      </figcaption>
    </figure>
  );
}
