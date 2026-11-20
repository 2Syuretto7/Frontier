"use client";

import { useState } from "react";

export const HORIZONS = [10, 40, 160, 640];

/** Exact law of S_{T∧n} for the simple random walk from 0, T = first hit of +1 (or of the floor). */
export function stopped(n: number, floor: number | null) {
  const off = n + 2, size = 2 * n + 5;
  let d = new Float64Array(size);
  d[off] = 1;
  for (let t = 0; t < n; t++) {
    const nd = new Float64Array(size);
    for (let i = 0; i < size; i++) {
      const p = d[i];
      if (!p) continue;
      const s = i - off;
      if (s === 1 || s === floor) nd[i] += p;
      else { nd[i + 1] += p / 2; nd[i - 1] += p / 2; }
    }
    d = nd;
  }
  let mean = 0, below = 0;
  for (let i = 0; i < size; i++) { mean += (i - off) * d[i]; if (i - off < 1) below += (i - off) * d[i]; }
  return { d, off, mean, hit: d[off + 1], below };
}

export function StoppedWalkViz() {
  const [hi, setHi] = useState(1);
  const [floorOn, setFloorOn] = useState(false);
  const n = HORIZONS[hi], floor = floorOn ? -9 : null;
  const r = stopped(n, floor);
  const W = 330, H = 140, X0 = 10, PW = 310, Y0 = 8, PH = 110;
  const lo = floorOn ? -10 : -Math.min(n, 60);
  const span = 1 - lo + 1;
  const bars: { s: number; p: number }[] = [];
  for (let s = lo; s <= 1; s++) {
    let p = r.d[r.off + s] ?? 0;
    if (s === lo && !floorOn) for (let t = -n - 1; t < lo; t++) p += r.d[r.off + t] ?? 0;
    bars.push({ s, p });
  }
  const pmax = Math.max(...bars.filter((b) => b.s !== 1).map((b) => b.p), 1e-9);
  const sx = (s: number) => X0 + ((s - lo) / span) * PW, bw = PW / span;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Time horizon n">
          {HORIZONS.map((h, i) => (
            <button key={h} type="button" className="seg" aria-pressed={hi === i} onClick={() => setHi(i)}>n = {h}</button>
          ))}
        </div>
        <button type="button" className="btn" aria-pressed={floorOn} onClick={() => setFloorOn((v) => !v)}>
          {floorOn ? "Remove floor" : "Add floor at −9"}
        </button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Law of the stopped random walk at time n">
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border)" />
        {bars.map(({ s, p }) => {
          const h = s === 1 ? Math.min(1, p) * PH : (p / pmax) * PH * 0.6;
          return <rect key={s} x={sx(s) + 0.5} y={Y0 + PH - h} width={Math.max(0.8, bw - 1)} height={h} fill={s === 1 ? "var(--accent)" : "var(--code-function)"} />;
        })}
        <text x={sx(1) + bw / 2} y={H - 2} textAnchor="middle" className="viz-label">+1</text>
        <text x={X0} y={H - 2} className="viz-label">{floorOn ? "−9" : `≤ ${lo}`}</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        P(stopped at +1) = {r.hit.toFixed(3)}; E[S at time T∧n] = {Math.abs(r.mean) < 5e-10 ? "0.000" : r.mean.toFixed(3)}; contribution of the rest = {r.below.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        The simple random walk from 0, stopped when it first reaches +1 or at time n, whichever is first. The mass at +1
        (tall bar, to scale with 1) grows towards 1 as n grows, yet the mean stays exactly 0: the paths that have not yet
        stopped sit far below and carry −P(stopped at +1). In the limit the walk always reaches +1, so the stopped value is 1 and its mean is not 0: T has infinite mean and
        the walk is unbounded below. With a floor at −9 the stopped walk is bounded, optional stopping applies, and
        the probability of reaching +1 first tends to 9/10.
      </figcaption>
    </figure>
  );
}
