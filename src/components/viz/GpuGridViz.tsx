"use client";

import { useState } from "react";

const N = 20;

/** Threads in blocks: each thread computes i = blockIdx * blockDim + threadIdx; threads with i >= n must do nothing. */
export function GpuGridViz() {
  const [bd, setBd] = useState(8);
  const [mode, setMode] = useState<"map" | "coalesce">("map");
  const [stride, setStride] = useState(1);
  const grid = Math.ceil(N / bd);
  const warp = 8; // a small warp so it fits on screen; real warps have 32 threads
  const seg = 8;
  const addrs = Array.from({ length: warp }, (_, t) => t * stride);
  const segs = new Set(addrs.map((a) => Math.floor(a / seg)));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={mode === "map"} onClick={() => setMode("map")}>threads to elements</button>
        <button type="button" className="seg" aria-pressed={mode === "coalesce"} onClick={() => setMode("coalesce")}>memory access of one warp</button>
      </div>
      {mode === "map" ? (
        <>
          <div className="viz-controls" style={{ flexWrap: "wrap" }}>
            {[4, 8, 16].map((b) => (
              <button key={b} type="button" className="seg" aria-pressed={bd === b} onClick={() => setBd(b)}>blockDim {b}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "8px 0" }}>
            {Array.from({ length: grid }, (_, b) => (
              <div key={b} style={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap" }}>
                <span className="mono" style={{ fontSize: 12, width: 58 }}>block {b}</span>
                {Array.from({ length: bd }, (_, t) => {
                  const i = b * bd + t;
                  const live = i < N;
                  return (
                    <span key={t} className="mono" title={`thread ${t}: i = ${b}·${bd} + ${t} = ${i}`} style={{ width: 24, textAlign: "center", fontSize: 12, padding: "3px 0", borderRadius: 4, border: `1px solid ${live ? "var(--accent)" : "var(--border)"}`, background: live ? "var(--accent-soft)" : "transparent", color: live ? "var(--text)" : "var(--text-faint)" }}>
                      {i}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
          <figcaption className="viz-caption" aria-live="polite">
            n = {N} elements, {grid} blocks of {bd} threads = {grid * bd} threads. Each number is the element a thread handles, i =
            blockIdx·blockDim + threadIdx. {grid * bd > N ? `The last ${grid * bd - N} threads have i ≥ n; without the check if (i < n) they would read and write past the end of the arrays.` : "Here the threads exactly cover the array, but the check is still needed for other n."}
          </figcaption>
        </>
      ) : (
        <>
          <div className="viz-controls" style={{ flexWrap: "wrap" }}>
            {[1, 2, 8].map((s) => (
              <button key={s} type="button" className="seg" aria-pressed={stride === s} onClick={() => setStride(s)}>stride {s}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 2, flexWrap: "wrap", margin: "8px 0" }}>
            {Array.from({ length: 64 }, (_, a) => {
              const hit = addrs.includes(a);
              const inSeg = segs.has(Math.floor(a / seg));
              return (
                <span key={a} style={{ width: 14, height: 18, borderRadius: 2, border: "1px solid var(--border)", background: hit ? "var(--accent)" : inSeg ? "var(--accent-soft)" : "transparent", marginRight: a % seg === seg - 1 ? 6 : 0 }} />
              );
            })}
          </div>
          <figcaption className="viz-caption" aria-live="polite">
            A warp (here 8 threads; on real GPUs 32) issues its loads together, and memory is fetched in whole segments (here 8
            floats, the groups above). With stride {stride}, the warp touches {segs.size} segment{segs.size > 1 ? "s" : ""} and
            uses {warp} of the {segs.size * seg} floats fetched.{" "}
            {stride === 1 ? "Consecutive threads reading consecutive addresses is called coalesced access: one transaction serves the whole warp." : "Strided access wastes most of each fetched segment, which is why GPU kernels prefer contiguous layouts."}
          </figcaption>
        </>
      )}
    </figure>
  );
}
