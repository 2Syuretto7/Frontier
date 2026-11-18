"use client";

import { useState } from "react";

type Bar = { lane: number; start: number; end: number; gpu: boolean; i: number };

/**
 * Discrete-event trace of a DataLoader: batch i is loaded by worker i mod W, a worker may run at most
 * W·prefetch batches ahead of the GPU, and the GPU takes batches in order. With no workers the main process
 * loads and then computes, one after the other.
 */
export function trace(n: number, load: number, step: number, workers: number, prefetch = 2) {
  const bars: Bar[] = [];
  let gpu = 0, idle = 0;
  if (workers === 0) {
    for (let i = 0; i < n; i++) {
      bars.push({ lane: 1, start: gpu, end: gpu + load, gpu: false, i });
      bars.push({ lane: 0, start: gpu + load, end: gpu + load + step, gpu: true, i });
      idle += load;
      gpu += load + step;
    }
    return { bars, total: gpu, idle };
  }
  const free = new Array(workers).fill(0);
  const taken: number[] = [];
  for (let i = 0; i < n; i++) {
    const w = i % workers;
    const slot = i >= workers * prefetch ? taken[i - workers * prefetch] : 0;
    const begin = Math.max(free[w], slot);
    free[w] = begin + load;
    bars.push({ lane: w + 1, start: begin, end: free[w], gpu: false, i });
    const start = Math.max(free[w], gpu);
    idle += start - gpu;
    taken.push(start);
    bars.push({ lane: 0, start, end: start + step, gpu: true, i });
    gpu = start + step;
  }
  return { bars, total: gpu, idle };
}

const N = 10, STEP = 1, TMAX = 40;

export function LoaderTimelineViz() {
  const [workers, setWorkers] = useState(2);
  const [load, setLoad] = useState(3);
  const { bars, total, idle } = trace(N, load, STEP, workers);
  const lanes = Math.max(workers, 1) + 1;
  const W = 320, X0 = 54, PW = W - X0 - 6, LH = 22;
  const H = lanes * LH + 22;
  const sx = (t: number) => X0 + (t / TMAX) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">workers</span>
        {[0, 1, 2, 3, 4].map((w) => (
          <button key={w} type="button" className="seg" aria-pressed={workers === w} onClick={() => setWorkers(w)}>{w}</button>
        ))}
        <span className="viz-label">load time</span>
        {[1.5, 3].map((l) => (
          <button key={l} type="button" className="seg" aria-pressed={load === l} onClick={() => setLoad(l)}>{`${l}×`}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Timeline of data loading workers and GPU steps">
        {Array.from({ length: lanes }, (_, l) => (
          <text key={l} x={X0 - 6} y={l * LH + 15} textAnchor="end" className="viz-label">{l === 0 ? "GPU" : workers === 0 ? "main" : `w${l - 1}`}</text>
        ))}
        {bars.map((b, k) => (
          <rect key={k} x={sx(b.start)} y={b.lane * LH + 3} width={Math.max(sx(b.end) - sx(b.start) - 1, 1)} height={LH - 6} rx={2}
            fill={b.gpu ? "var(--accent)" : "var(--text-muted)"} fillOpacity={b.gpu ? 0.85 : 0.35} stroke={b.gpu ? "none" : "var(--text-muted)"} />
        ))}
        <line x1={sx(total)} y1={0} x2={sx(total)} y2={lanes * LH} stroke="var(--danger)" strokeDasharray="3 2" />
        {[0, 10, 20, 30, 40].map((t) => (
          <text key={t} x={sx(t)} y={H - 4} textAnchor="middle" className="viz-label">{t}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`${N} steps in ${total.toFixed(1)}, GPU idle ${idle.toFixed(1)} (${Math.round((100 * idle) / total)}%)`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Ten training steps of length 1 (solid, top lane) fed by batches that take {load} to load (outlined). With no
        workers the main process alternates loading and computing, so the GPU waits for every batch. Each worker adds a
        lane that loads ahead in round-robin order, up to prefetch_factor = 2 batches each; once the workers together
        load faster than the GPU computes, which needs at least the load time divided by the step time, the GPU only
        waits for the very first batch.
      </figcaption>
    </figure>
  );
}
