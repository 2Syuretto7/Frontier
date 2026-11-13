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
const NAMES = ["sun", "cloud", "rain"];
const P = [[0.7, 0.2, 0.1], [0.3, 0.4, 0.3], [0.2, 0.3, 0.5]];
const HUES = ["var(--accent)", "var(--text-muted)", "var(--danger)"];
const step = (d: number[]) => [0, 1, 2].map((j) => d[0] * P[0][j] + d[1] * P[1][j] + d[2] * P[2][j]);

/** A three-state weather chain: the distribution after n steps is the start row times Pⁿ, and one simulated path shows the randomness behind it. */
export function TransitionStepViz() {
  const [start, setStart] = useState(0);
  const [n, setN] = useState(1);
  const dists = useMemo(() => {
    const out: number[][] = [[0, 1, 2].map((i) => (i === start ? 1 : 0))];
    for (let k = 0; k < 12; k++) out.push(step(out[out.length - 1]));
    return out;
  }, [start]);
  const path = useMemo(() => {
    const r = makeRng(5 + start);
    const p = [start];
    for (let k = 0; k < 24; k++) {
      const u = r(), row = P[p[p.length - 1]];
      p.push(u < row[0] ? 0 : u < row[0] + row[1] ? 1 : 2);
    }
    return p;
  }, [start]);
  const W = 320, H = 150, bw = (W - 20) / 13;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {NAMES.map((nm, i) => (
          <button key={nm} type="button" className="seg" aria-pressed={start === i} onClick={() => setStart(i)}>start: {nm}</button>
        ))}
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          n = {n}
          <input type="range" min={0} max={12} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="number of steps" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Stacked bars of the distribution after each step">
        {dists.map((d, k) => {
          let y = 10;
          return (
            <g key={k} opacity={k === n ? 1 : 0.35}>
              {d.map((v, i) => {
                const h = v * (H - 30);
                const rect = <rect key={i} x={10 + k * bw + 1} y={y} width={bw - 2} height={h} fill={HUES[i]} />;
                y += h;
                return rect;
              })}
              <text x={10 + k * bw + bw / 2} y={H - 6} textAnchor="middle" className="viz-label">{k}</text>
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        after {n} steps: {NAMES.map((nm, i) => `${nm} ${dists[n][i].toFixed(3)}`).join(", ")}
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0", overflowX: "auto", whiteSpace: "nowrap" }}>
        one path: {path.map((s) => NAMES[s][0].toUpperCase()).join(" ")}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Row i of P = [[0.7, 0.2, 0.1], [0.3, 0.4, 0.3], [0.2, 0.3, 0.5]] gives tomorrow&apos;s probabilities when today is
        state i. Each bar is the distribution of the weather n days ahead, the starting row times Pⁿ. Whatever the start, the
        bars soon look alike: the chain forgets where it began. A single simulated path (S, C, R) jumps around; the bars
        describe where many such paths would be.
      </figcaption>
    </figure>
  );
}
