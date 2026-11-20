"use client";

import { useState } from "react";

const GPU_MTBF = 50000, COST = 2 / 60, GPUS = [1024, 4096, 16384];

/** Fraction of time lost to writing checkpoints and redoing lost work, for interval tau hours. */
export const overhead = (tau: number, gpus: number) => COST / tau + tau / (2 * (GPU_MTBF / gpus));
export const youngTau = (gpus: number) => Math.sqrt(2 * COST * (GPU_MTBF / gpus));

export function CheckpointIntervalViz() {
  const [gi, setGi] = useState(1);
  const g = GPUS[gi], M = GPU_MTBF / g, tau = youngTau(g);
  const W = 330, H = 190, X0 = 40, Y0 = 8, PW = W - 48, PH = H - Y0 - 34, XMIN = Math.log10(1 / 12), XMAX = Math.log10(8), YMAX = 0.4;
  const sx = (h: number) => X0 + ((Math.log10(h) - XMIN) / (XMAX - XMIN)) * PW;
  const sy = (f: number) => Y0 + PH - (Math.min(f, YMAX) / YMAX) * PH;
  const grid = Array.from({ length: 81 }, (_, i) => 10 ** (XMIN + ((XMAX - XMIN) * i) / 80));
  const hm = (h: number) => (h >= 1 ? `${h.toFixed(1)} h` : `${(h * 60).toFixed(0)} min`);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">GPUs</span>
        <div className="segmented" role="group" aria-label="Number of GPUs">
          {GPUS.map((x, i) => <button key={x} type="button" className="seg" aria-pressed={gi === i} onClick={() => setGi(i)}>{x}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Time lost against checkpoint interval">
        {[0, 0.1, 0.2, 0.3, 0.4].map((f) => (
          <g key={f}>
            <line x1={X0} x2={X0 + PW} y1={sy(f)} y2={sy(f)} stroke="var(--border)" strokeDasharray={f ? "2 4" : undefined} />
            <text x={X0 - 4} y={sy(f) + 4} textAnchor="end" className="viz-label">{`${f * 100}%`}</text>
          </g>
        ))}
        <path d={grid.map((h, i) => `${i ? "L" : "M"}${sx(h).toFixed(1)},${sy(COST / h).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" />
        <path d={grid.map((h, i) => `${i ? "L" : "M"}${sx(h).toFixed(1)},${sy(h / (2 * M)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--danger)" strokeDasharray="4 3" />
        <path d={grid.map((h, i) => `${i ? "L" : "M"}${sx(h).toFixed(1)},${sy(overhead(h, g)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <circle cx={sx(tau)} cy={sy(overhead(tau, g))} r={4} fill="var(--accent)" />
        {[1 / 12, 0.5, 2, 8].map((h) => <text key={h} x={sx(h)} y={Y0 + PH + 14} textAnchor={h < 0.1 ? "start" : h > 7 ? "end" : "middle"} className="viz-label">{hm(h)}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">checkpoint interval</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`a failure every ${hm(M)}; best interval ${hm(tau)}, losing ${(overhead(tau, g) * 100).toFixed(1)}% of the run`}
      </div>
      <figcaption className="viz-caption">
        Each GPU fails on average once in 50,000 hours, so a job on N GPUs sees a failure every 50,000/N hours. Writing a
        checkpoint takes 2 minutes. Checkpointing every τ hours spends a fraction C/τ of the time writing (grey) and, after each
        failure, loses on average half an interval of work, a fraction τ/2M (red). Their sum (blue) is smallest at Young&apos;s
        interval √(2CM): every 1.8 hours on 1024 GPUs, losing 3.7%, but every 27 minutes on 16384 GPUs, losing 14.8%.
      </figcaption>
    </figure>
  );
}
