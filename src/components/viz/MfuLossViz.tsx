"use client";

import { useState } from "react";

const MICRO = 16;

/** Step time in units of the ideal (all FLOPs at peak), split by cause, and the resulting MFU. */
export function stepTime(kernelEff: number, otherPct: number, commPct: number, stages: number) {
  const matmul = 1 / kernelEff;
  const other = (matmul * otherPct) / 100;
  const comm = (matmul * commPct) / 100;
  const busy = matmul + other + comm;
  const bubble = (busy * (stages - 1)) / MICRO;
  const parts: [string, number][] = [
    ["ideal", 1],
    ["matmul below peak", matmul - 1],
    ["non-matmul ops", other],
    ["exposed communication", comm],
    ["pipeline bubble", bubble],
  ];
  const total = busy + bubble;
  return { parts, total, mfu: 1 / total };
}

const COLORS = ["var(--success)", "var(--accent)", "var(--accent-soft)", "var(--danger)", "var(--text-muted)"];

export function MfuLossViz() {
  const [eff, setEff] = useState(75);
  const [other, setOther] = useState(15);
  const [comm, setComm] = useState(10);
  const [stages, setStages] = useState(4);
  const { parts, total, mfu } = stepTime(eff / 100, other, comm, stages);
  const W = 330, H = 40, X0 = 4, PW = W - 8;
  const sliders: [string, number, number, number, (v: number) => void][] = [
    ["matmul kernels, % of peak", eff, 40, 95, setEff],
    ["non-matmul ops, % of matmul time", other, 0, 50, setOther],
    ["exposed communication, %", comm, 0, 50, setComm],
    ["pipeline stages (16 microbatches)", stages, 1, 16, setStages],
  ];
  let x = X0;
  return (
    <figure className="viz">
      <div style={{ display: "grid", gap: 6 }}>
        {sliders.map(([label, v, lo, hi, set], i) => (
          <div key={label} className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
            <label className="viz-label" htmlFor={`mfu-${i}`} style={{ minWidth: 220 }}>{`${label}: ${v}`}</label>
            <input id={`mfu-${i}`} type="range" min={lo} max={hi} step={1} value={v} onChange={(e) => set(Number(e.target.value))} style={{ flex: 1, minWidth: 100 }} />
          </div>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "8px auto 0" }} role="img" aria-label="Step time split into ideal compute and losses">
        {parts.map(([name, t], k) => {
          const w = (t / total) * PW;
          const r = <rect key={name} x={x} y={6} width={Math.max(w, 0)} height={26} fill={COLORS[k]} stroke="var(--bg)" />;
          x += w;
          return r;
        })}
      </svg>
      <div className="viz-label" style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", fontSize: 12 }}>
        {parts.map(([name, t], k) => (
          <span key={name}><span style={{ display: "inline-block", width: 10, height: 10, background: COLORS[k], marginRight: 4 }} />{`${name} ${((t / total) * 100).toFixed(0)}%`}</span>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">{`MFU ${(mfu * 100).toFixed(1)}%`}</div>
      <figcaption className="viz-caption">
        One training step, drawn as a bar whose green part is the time the model&apos;s FLOPs would take at peak. Matrix
        kernels below peak, normalisations and activations, communication that is not hidden behind compute, and the idle
        stages at the start and end of a pipeline each add time, and MFU is the green share. With the starting values the
        losses compound to an MFU of about 51%, typical of a large run; no single fix brings it near 100%.
      </figcaption>
    </figure>
  );
}
