"use client";

import { useMemo, useState } from "react";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LOOKS = 50, STEP = 10, REPS = 1500;

/** Experiments in which the null is true, tested with a z-test after every 10 observations and stopped at the first p below 0.05. */
export function PeekingViz() {
  const [looks, setLooks] = useState(10);
  const [seed, setSeed] = useState(1);
  const curve = useMemo(() => {
    const r = makeRng(seed * 4099);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    const firstHit = Array(LOOKS + 1).fill(0);
    for (let k = 0; k < REPS; k++) {
      let s = 0;
      for (let l = 1; l <= LOOKS; l++) {
        for (let i = 0; i < STEP; i++) s += normal();
        if (Math.abs(s / Math.sqrt(l * STEP)) > 1.96) { firstHit[l]++; break; }
      }
    }
    const out: number[] = [];
    let acc = 0;
    for (let l = 1; l <= LOOKS; l++) { acc += firstHit[l]; out.push(acc / REPS); }
    return out;
  }, [seed]);
  const W = 330, H = 150, ymax = 0.45;
  const X = (l: number) => 20 + ((l - 1) / (LOOKS - 1)) * (W - 36);
  const Y = (y: number) => H - 16 - (Math.min(y, ymax) / ymax) * (H - 26);
  const rate = curve[looks - 1];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          looks = {looks}
          <input type="range" min={1} max={LOOKS} value={looks} onChange={(e) => setLooks(Number(e.target.value))} aria-label="number of looks" style={{ width: 130 }} />
        </label>
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new runs</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="False positive rate against the number of looks at the data">
        <line x1={X(1)} x2={X(LOOKS)} y1={Y(0.05)} y2={Y(0.05)} stroke="var(--text-muted)" strokeDasharray="4 3" />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.8} points={curve.map((v, i) => `${X(i + 1).toFixed(1)},${Y(v).toFixed(1)}`).join(" ")} />
        <circle cx={X(looks)} cy={Y(rate)} r={3.5} fill="var(--danger)" />
        <line x1={X(1)} x2={X(LOOKS)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <text x={X(1)} y={H - 2} className="viz-label">1 look</text>
        <text x={X(LOOKS)} y={H - 2} textAnchor="end" className="viz-label">{LOOKS}</text>
        <text x={X(LOOKS)} y={Y(0.05) - 4} textAnchor="end" className="viz-label">α = 0.05</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        false positive rate with {looks} look{looks === 1 ? "" : "s"}: {rate.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each of {REPS} simulated experiments has no real effect. After every {STEP} observations the experimenter computes a
        z-test and stops, declaring success, as soon as p &lt; 0.05. With one look the false positive rate is 5%; with many
        looks it climbs far higher, because the running statistic gets many chances to wander past ±1.96.
      </figcaption>
    </figure>
  );
}
