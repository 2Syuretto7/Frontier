"use client";

import { useMemo, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const T = 3000, H = 1, X0 = 5, BURN = 200;

/** Constant-rate SGD on ½hx² with unit gradient noise: |last iterate|, |average of iterates after BURN|, and |schedule-free x| with β = 0.5. */
export function averagingRuns(lr: number) {
  const normal = makeNormal(makeRng(21));
  let x = X0, sum = 0, z = X0, sf = X0;
  const last: number[] = [], avg: number[] = [], free: number[] = [];
  for (let t = 1; t <= T; t++) {
    const xi = normal();
    x = x - lr * (H * x + xi);
    if (t > BURN) sum += x;
    const y = 0.5 * z + 0.5 * sf;
    z = z - lr * (H * y + xi);
    sf = (1 - 1 / (t + 1)) * sf + z / (t + 1);
    last.push(Math.abs(x));
    avg.push(t > BURN ? Math.abs(sum / (t - BURN)) : Math.abs(x));
    free.push(Math.abs(sf));
  }
  return { last, avg, free };
}

export function IterateAverageViz() {
  const [lr, setLr] = useState(0.2);
  const r = useMemo(() => averagingRuns(lr), [lr]);
  const W = 300, HT = 160, PX = 34, PW = W - 42, PH = 136;
  const sx = (t: number) => PX + (t / T) * PW;
  const sy = (v: number) => 8 + ((1 - Math.max(-4, Math.min(1, Math.log10(Math.max(v, 1e-6))))) / 5) * PH;
  const line = (a: number[]) => a.filter((_, t) => t % 6 === 5).map((v, j) => `${sx(6 * j + 6)},${sy(v)}`).join(" ");
  const floor = Math.sqrt(lr / (H * (2 - lr * H)));
  const rms = (a: number[]) => Math.sqrt(a.slice(-500).reduce((s, v) => s + v * v, 0) / 500);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">constant rate η</span>
        {[0.05, 0.2, 0.8].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={lr === v} onClick={() => setLr(v)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${HT + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Distance from the minimum for the last iterate, the tail average and the schedule-free iterate">
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1} points={line(r.last)} />
        <line x1={PX} y1={sy(floor)} x2={PX + PW} y2={sy(floor)} stroke="var(--danger)" strokeDasharray="4 3" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={line(r.avg)} />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.5} strokeDasharray="5 3" points={line(r.free)} />
        {[0, 1000, 2000, 3000].map((t) => (
          <text key={t} x={sx(t)} y={HT + 12} textAnchor="middle" className="viz-label">{t}</text>
        ))}
        {[10, 0.1, 0.001].map((v) => (
          <text key={v} x={PX - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`last 500 steps, RMS distance: last iterate ${rms(r.last).toFixed(3)} (floor ${floor.toFixed(3)}); average ${rms(r.avg).toFixed(3)}; schedule-free ${rms(r.free).toFixed(3)}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        SGD with a constant rate on ½x² with unit gradient noise, from x = 5. The last iterate (grey) settles at a noise
        floor of size √(η/(2 − η)) (red). The average of the iterates after step {BURN} (blue) keeps shrinking like
        1/√t, at a rate that hardly depends on η. Schedule-free SGD with β = 0.5 (dashed) maintains such an average as it goes and
        evaluates gradients near it.
      </figcaption>
    </figure>
  );
}
