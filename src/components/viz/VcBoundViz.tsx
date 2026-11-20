"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const T = 0.4, NOISE = 0.2, MS = [100, 300, 1000, 3000, 10000], DS = [1, 10, 100];

const growthLog = (m: number, d: number) => (m >= d ? d * Math.log((Math.E * m) / d) : m * Math.log(2));
export const vcRadius = (m: number, d: number, delta: number) => Math.sqrt((8 * (growthLog(2 * m, d) + Math.log(4 / delta))) / m);

/** Largest gap between empirical and true risk over all thresholds, for noisy threshold data, averaged over trials. */
export function observedGap(m: number, seed: number, reps = 20) {
  const r = rand(seed), trueRisk = (t: number) => NOISE + (1 - 2 * NOISE) * Math.abs(t - T);
  let sum = 0;
  for (let k = 0; k < reps; k++) {
    const s = Array.from({ length: m }, () => { const x = r(); return { x, y: (x >= T ? 1 : 0) ^ (r() < NOISE ? 1 : 0) }; }).sort((a, b) => a.x - b.x);
    let errs = s.filter((p) => p.y === 0).length, best = Math.abs(errs / m - trueRisk(0));
    for (const p of s) {
      best = Math.max(best, Math.abs(errs / m - trueRisk(p.x)));
      errs += p.y === 1 ? 1 : -1;
      best = Math.max(best, Math.abs(errs / m - trueRisk(p.x)));
    }
    sum += best;
  }
  return sum / reps;
}

export function VcBoundViz() {
  const [delta, setDelta] = useState(0.05);
  const obs = useMemo(() => MS.map((m) => observedGap(m, 3)), []);
  const W = 330, H = 200, X0 = 36, PW = 262, Y0 = 8, PH = 150, LO = -3, HI = 1;
  const sx = (m: number) => X0 + (Math.log10(m / 100) / 2) * PW, sy = (v: number) => Y0 + PH - ((Math.log10(Math.max(v, 1e-3)) - LO) / (HI - LO)) * PH;
  const line = (f: (m: number) => number) => MS.map((m, i) => `${i ? "L" : "M"}${sx(m).toFixed(1)},${sy(f(m)).toFixed(1)}`).join(" ");
  const colours = ["var(--accent)", "var(--code-function)", "var(--text)"];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">δ</span>
        <div className="segmented" role="group" aria-label="Confidence parameter">
          {[0.05, 0.001].map((v) => <button key={v} type="button" className="seg" aria-pressed={delta === v} onClick={() => setDelta(v)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 16}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="VC bound against sample size on log scales">
        {[0.001, 0.01, 0.1, 1, 10].map((v) => <g key={v}><line x1={X0} x2={X0 + PW} y1={sy(v)} y2={sy(v)} stroke="var(--border)" /><text x={X0 - 5} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text></g>)}
        {DS.map((d, i) => <path key={d} d={line((m) => vcRadius(m, d, delta))} fill="none" stroke={colours[i]} strokeWidth={2} />)}
        <path d={MS.map((m, i) => `${i ? "L" : "M"}${sx(m).toFixed(1)},${sy(obs[i]).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeDasharray="4 3" strokeWidth={2} />
        {[100, 1000, 10000].map((m) => <text key={m} x={sx(m)} y={H + 2} textAnchor="middle" className="viz-label">{m}</text>)}
        <text x={X0 + PW / 2} y={H + 14} textAnchor="middle" className="viz-label">sample size m</text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        {DS.map((d, i) => <span key={d}><span style={{ color: colours[i] }}>━</span> bound, d = {d}</span>)}
        <span>- - - observed, thresholds (d = 1)</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        m = 10000: bound d = 1 {vcRadius(10000, 1, delta).toFixed(3)}, d = 100 {vcRadius(10000, 100, delta).toFixed(3)}; observed {obs[4].toFixed(4)}
      </div>
      <figcaption className="viz-caption">
        The VC bound on the largest gap between training and true risk, √(8(ln τ(2m) + ln(4/δ))/m), for three VC dimensions.
        Each falls like √(d log m / m), and shrinking δ a thousandfold barely moves it. The dashed curve is the gap actually
        observed for thresholds: the same slope, but about 12 times smaller at m = 10000, because the constants in the
        symmetrisation argument are loose.
      </figcaption>
    </figure>
  );
}
