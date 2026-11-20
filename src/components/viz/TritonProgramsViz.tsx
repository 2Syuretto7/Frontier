"use client";

import { useState } from "react";

const N = 300;
const BLOCKS = [64, 128, 256];
const WARPS = [1, 2, 4];

/**
 * A vector of N elements processed by a Triton kernel with BLOCK elements per program. Returns the number of programs, the masked
 * lanes, and, for a typical blocked layout, how many consecutive elements of a block each of the 32 * numWarps threads owns (a block
 * smaller than the thread count is replicated, so several threads hold copies of the same element).
 */
export function tritonPrograms(block: number, numWarps: number) {
  const programs = Math.ceil(N / block);
  const threads = 32 * numWarps;
  const perThread = Math.max(1, block / threads);
  const replicas = Math.max(1, threads / block);
  return { programs, masked: programs * block - N, threads, perThread, replicas };
}

export function TritonProgramsViz() {
  const [b, setB] = useState(1);
  const [w, setW] = useState(1);
  const block = BLOCKS[b], nw = WARPS[w];
  const res = tritonPrograms(block, nw);
  const W = 340, H = 118, X0 = 10, PW = 320;
  const total = res.programs * block;
  const ex = PW / total;
  const owner = (i: number) => Math.floor(i / res.perThread);
  const sample = Math.min(block, 64);
  const bx = PW / sample;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Block size">
          {BLOCKS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={b === i} onClick={() => setB(i)}>BLOCK {v}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Warps per program">
          {WARPS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={w === i} onClick={() => setW(i)}>{v} warp{v > 1 ? "s" : ""}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 480, display: "block", margin: "0 auto" }} role="img" aria-label="Programs covering a vector, and threads within the first program">
        <text x={X0} y={12} className="viz-label">the vector, {N} elements, split into programs</text>
        {Array.from({ length: res.programs }, (_, p) => {
          const x = X0 + p * block * ex, live = Math.min(block, N - p * block);
          return (
            <g key={p}>
              <rect x={x} y={18} width={live * ex} height={18} style={{ fill: p % 2 ? "var(--accent)" : "var(--text-muted)" }} opacity={p % 2 ? 0.8 : 0.5} />
              {live < block && <rect x={x + live * ex} y={18} width={(block - live) * ex} height={18} style={{ fill: "none", stroke: "var(--text-faint)" }} strokeDasharray="3 2" />}
              <text x={x + (block * ex) / 2} y={31} textAnchor="middle" className="viz-label">pid {p}</text>
            </g>
          );
        })}
        <text x={X0} y={58} className="viz-label">first {sample} elements of program 0, shaded by owning thread</text>
        {Array.from({ length: sample }, (_, i) => {
          const t = owner(i);
          return <rect key={i} x={X0 + i * bx} y={64} width={Math.max(bx - 0.6, 0.6)} height={18} style={{ fill: t % 2 ? "var(--accent)" : "var(--text-muted)" }} opacity={0.35 + 0.6 * ((t % 4) / 3)} />;
        })}
        <text x={X0} y={100} className="viz-label">{`threads 0, 1, 2, ... own ${res.perThread} element${res.perThread > 1 ? "s" : ""} each`}</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {res.programs} programs, {res.masked} masked lanes; {res.threads} threads per program{res.replicas > 1 ? `, each element held by ${res.replicas} threads` : ""}
      </div>
      <figcaption className="viz-caption">
        In Triton you write what one program does to one block of data; the grid launches one program per block, and a mask switches off
        the lanes past the end. How a block is spread over the program&apos;s threads is chosen by the compiler; the lower strip shows a
        typical choice, in which each thread owns a run of consecutive elements so its loads can be vectorised.
      </figcaption>
    </figure>
  );
}
