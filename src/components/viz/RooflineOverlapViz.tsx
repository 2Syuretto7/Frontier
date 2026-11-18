"use client";

import { useState } from "react";

const BW = 3.35e12;
const PEAKS = [
  { name: "bf16 tensor cores", peak: 989e12 },
  { name: "fp32 without tensor cores", peak: 67e12 },
];
const LO = -1, HI = 4; // log10 intensity

/** Attainable FLOP/s with compute and memory fully overlapped, and with no overlap at all. */
export function perf(I: number, peak: number) {
  return { overlap: Math.min(peak, I * BW), serial: 1 / (1 / peak + 1 / (I * BW)) };
}

export function RooflineOverlapViz() {
  const [li, setLi] = useState(Math.log10(295));
  const [pi, setPi] = useState(0);
  const P = PEAKS[pi].peak;
  const I = 10 ** li;
  const W = 330, H = 210, X0 = 44, Y0 = 8, PW = W - X0 - 10, PH = H - Y0 - 34;
  const YLO = 11, YHI = 15.2;
  const sx = (l: number) => X0 + ((l - LO) / (HI - LO)) * PW;
  const sy = (f: number) => Y0 + PH - ((Math.log10(f) - YLO) / (YHI - YLO)) * PH;
  const ls = Array.from({ length: 101 }, (_, i) => LO + (i * (HI - LO)) / 100);
  const line = (fn: (I: number) => number) => ls.map((l, i) => `${i ? "L" : "M"}${sx(l).toFixed(1)},${sy(fn(10 ** l)).toFixed(1)}`).join("");
  const p = perf(I, P);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Compute peak">
          {PEAKS.map((g, i) => (
            <button key={g.name} type="button" className="seg" aria-pressed={pi === i} onClick={() => setPi(i)}>{g.name}</button>
          ))}
        </div>
        <label className="viz-label" htmlFor="rl-i">intensity: {I >= 10 ? I.toFixed(0) : I.toFixed(2)} FLOP/byte</label>
        <input id="rl-i" type="range" min={LO} max={HI} step={0.02} value={li} onChange={(e) => setLi(Number(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Roofline with and without overlap of compute and memory">
        {[1e11, 1e12, 1e13, 1e14, 1e15].map((f) => (
          <g key={f}>
            <line x1={X0} x2={W - 10} y1={sy(f)} y2={sy(f)} stroke="var(--border)" />
            <text x={X0 - 4} y={sy(f) + 3} textAnchor="end" className="viz-label" style={{ fontSize: 9 }}>{`${f / 1e12} T`}</text>
          </g>
        ))}
        {[-1, 0, 1, 2, 3, 4].map((l) => (
          <text key={l} x={sx(l)} y={Y0 + PH + 13} textAnchor="middle" className="viz-label" style={{ fontSize: 9 }}>{10 ** l}</text>
        ))}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">FLOPs per byte (log)</text>
        <path d={line((x) => perf(x, P).overlap)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <path d={line((x) => perf(x, P).serial)} fill="none" stroke="var(--danger)" strokeWidth={1.5} strokeDasharray="4 3" />
        <line x1={sx(li)} x2={sx(li)} y1={Y0} y2={Y0 + PH} stroke="var(--text-muted)" strokeDasharray="2 3" />
        <circle cx={sx(li)} cy={sy(p.overlap)} r={4} fill="var(--accent)" />
        <circle cx={sx(li)} cy={sy(p.serial)} r={4} fill="var(--danger)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`overlapped ${(p.overlap / 1e12).toFixed(1)} TFLOP/s, serial ${(p.serial / 1e12).toFixed(1)} TFLOP/s (${((p.serial / p.overlap) * 100).toFixed(0)}%)`}
      </div>
      <figcaption className="viz-caption">
        The roofline (solid) assumes a kernel moves data and computes at the same time, so its time is the larger of the
        two. If it did one and then the other, its time would be their sum (dashed). The two agree far from the ridge, but
        at the ridge the serial kernel reaches only half the roof: the corner is where overlap matters most. Without tensor
        cores the roof drops fifteen-fold and the ridge moves left to 20 FLOPs per byte.
      </figcaption>
    </figure>
  );
}
