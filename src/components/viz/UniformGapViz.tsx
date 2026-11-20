"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const K = 51, T = 0.4, NOISE = 0.2, DELTA = 0.05, TRIALS = 400;
const TS = Array.from({ length: K }, (_, i) => i / (K - 1));
const trueRisk = (t: number) => NOISE + (1 - 2 * NOISE) * Math.abs(t - T);

function sample(m: number, r: () => number) {
  return Array.from({ length: m }, () => { const x = r(); return { x, y: (x >= T ? 1 : 0) ^ (r() < NOISE ? 1 : 0) }; });
}
const empRisk = (s: { x: number; y: number }[], t: number) => s.reduce((a, p) => a + ((p.x >= t ? 1 : 0) !== p.y ? 1 : 0), 0) / s.length;

/** One sample's empirical risks, its largest gap, and the fraction of trials whose largest gap exceeds the union-bound radius. */
export function experiment(m: number, seed: number) {
  const r = rand(seed);
  const radius = Math.sqrt(Math.log((2 * K) / DELTA) / (2 * m));
  const first = sample(m, r);
  const emp = TS.map((t) => empRisk(first, t));
  const gap = Math.max(...TS.map((t, i) => Math.abs(emp[i] - trueRisk(t))));
  let exceed = 0, gapSum = 0;
  for (let k = 0; k < TRIALS; k++) {
    const s = sample(m, r), g = Math.max(...TS.map((t) => Math.abs(empRisk(s, t) - trueRisk(t))));
    gapSum += g; if (g > radius) exceed++;
  }
  return { emp, gap, radius, exceed: exceed / TRIALS, meanGap: gapSum / TRIALS };
}

const MS = [50, 200, 1000];

export function UniformGapViz() {
  const [mi, setMi] = useState(0);
  const e = useMemo(() => experiment(MS[mi], 2), [mi]);
  const W = 320, H = 180, X0 = 30, PW = 280, Y0 = 8, PH = 140, YMAX = 0.7;
  const sx = (t: number) => X0 + t * PW, sy = (v: number) => Y0 + PH - (Math.min(v, YMAX) / YMAX) * PH;
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${sx(TS[i]).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
  const tr = TS.map(trueRisk);
  const band = TS.map((t, i) => `${i ? "L" : "M"}${sx(t).toFixed(1)},${sy(tr[i] + e.radius).toFixed(1)}`).join(" ") + " " + [...TS].reverse().map((t) => `L${sx(t).toFixed(1)},${sy(Math.max(0, trueRisk(t) - e.radius)).toFixed(1)}`).join(" ") + "Z";
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">sample size m</span>
        <div className="segmented" role="group" aria-label="Sample size">
          {MS.map((m, i) => <button key={m} type="button" className="seg" aria-pressed={mi === i} onClick={() => setMi(i)}>{m}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 16}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Empirical and true risk of every threshold">
        <path d={band} fill="var(--accent)" fillOpacity={0.15} />
        <path d={path(tr)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <path d={path(e.emp)} fill="none" stroke="var(--code-function)" strokeWidth={1.5} />
        {[0, 0.2, 0.4, 0.6].map((v) => <text key={v} x={X0 - 5} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        {[0, 0.4, 1].map((t) => <text key={t} x={sx(t)} y={H + 2} textAnchor="middle" className="viz-label">{t}</text>)}
        <text x={X0 + PW / 2} y={H + 14} textAnchor="middle" className="viz-label">threshold t (51 hypotheses)</text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--accent)" }}>━</span> true risk, with the union-bound band</span>
        <span><span style={{ color: "var(--code-function)" }}>━</span> empirical risk</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        radius {e.radius.toFixed(3)}; largest gap here {e.gap.toFixed(3)}; mean largest gap {e.meanGap.toFixed(3)}; trials outside {(e.exceed * 100).toFixed(1)}%
      </div>
      <figcaption className="viz-caption">
        All 51 thresholds are scored on one noisy sample. The band has half-width √(ln(2|H|/δ)/2m) with δ = 0.05, and the
        union bound promises that the whole empirical curve lies inside it in at least 95% of samples. Over 400 samples it
        left the band at most once at each size shown, and the typical largest gap is less than half the radius: the union bound
        treats the 51 thresholds as unrelated, though neighbouring ones make nearly the same mistakes.
      </figcaption>
    </figure>
  );
}
