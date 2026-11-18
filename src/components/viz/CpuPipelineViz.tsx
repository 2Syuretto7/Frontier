"use client";

import { useState } from "react";

const STAGES = ["IF", "ID", "EX", "MEM", "WB"];
const N = 8;
const MODES = ["no hazards", "load-use stall", "mispredicted branch"];

/** Start cycle of each instruction in a 5-stage pipeline, plus squashed instructions for a misprediction. */
export function schedule(mode: number) {
  const start: number[] = [];
  const squashed: { row: string; start: number }[] = [];
  let next = 0;
  for (let i = 0; i < N; i++) {
    start.push(next);
    next += 1;
    if (mode === 1 && i === 2) next += 1;
    if (mode === 2 && i === 3) {
      for (let s = 0; s < 2; s++) squashed.push({ row: `wrong path ${s + 1}`, start: next + s });
      next += 2;
    }
  }
  const cycles = start[N - 1] + STAGES.length;
  return { start, squashed, cycles };
}

export function CpuPipelineViz() {
  const [mode, setMode] = useState(0);
  const { start, squashed, cycles } = schedule(mode);
  const rows: { label: string; s: number; bad: boolean }[] = [];
  start.forEach((s, i) => {
    rows.push({ label: `i${i + 1}${mode === 2 && i === 3 ? " (branch)" : mode === 1 && i === 2 ? " (load)" : ""}`, s, bad: false });
    if (mode === 2 && i === 3) squashed.forEach((q) => rows.push({ label: q.row, s: q.start, bad: true }));
  });
  const maxC = 16, W = 340, X0 = 92, cw = (W - X0 - 4) / maxC, rh = 18, H = rows.length * rh + 24;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {MODES.map((m, i) => (
          <button key={m} type="button" className="seg" aria-pressed={mode === i} onClick={() => setMode(i)}>{m}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Pipeline diagram of eight instructions over clock cycles">
        {Array.from({ length: maxC }, (_, c) => (
          <text key={c} x={X0 + c * cw + cw / 2} y={12} textAnchor="middle" className="viz-label" style={{ fontSize: 9 }}>{c + 1}</text>
        ))}
        {rows.map((r, k) => {
          const y = 18 + k * rh;
          const n = r.bad ? 2 : STAGES.length;
          return (
            <g key={k}>
              <text x={X0 - 4} y={y + 12} textAnchor="end" className="viz-label" style={{ fontSize: 10 }}>{r.label}</text>
              {Array.from({ length: n }, (_, s) => {
                const stall = mode === 1 && k === 3 && s === 0;
                return (
                  <g key={s}>
                    <rect x={X0 + (r.s + s) * cw + 0.5} y={y} width={cw - 1} height={rh - 2}
                      fill={r.bad ? "var(--danger)" : "var(--accent-soft)"} stroke="var(--border)" />
                    <text x={X0 + (r.s + s) * cw + cw / 2} y={y + 12} textAnchor="middle" style={{ fontSize: 7, fill: "var(--text)" }}>{STAGES[s]}</text>
                    {stall && <rect x={X0 + (r.s - 1) * cw + 0.5} y={y} width={cw - 1} height={rh - 2} fill="none" stroke="var(--danger)" strokeDasharray="2 2" />}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`${N} instructions finish in ${cycles} cycles (ideal ${N + STAGES.length - 1})`}
      </div>
      <figcaption className="viz-caption">
        A five-stage pipeline: fetch, decode, execute, memory and write-back. Once full it finishes one instruction per
        cycle, so eight instructions take 8 + 5 − 1 = 12 cycles instead of 40. When an instruction needs a value that a
        load produces in its memory stage, it waits a cycle (dashed bubble). When a branch turns out to have gone the other
        way, the instructions fetched after it from the wrong path (red) are thrown away and their cycles are lost; deeper
        pipelines lose more.
      </figcaption>
    </figure>
  );
}
