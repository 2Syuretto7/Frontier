"use client";

import { useState } from "react";

const STEPS = 8, LAUNCH = 5;

type Block = { start: number; end: number };

/** Simulate a CPU that enqueues kernels (LAUNCH microseconds each) for a GPU that runs them in order. */
export function simulate(kernel: number, sync: boolean) {
  let cpu = 0, gpu = 0;
  const c: Block[] = [], g: Block[] = [], waits: Block[] = [];
  for (let s = 0; s < STEPS; s++) {
    c.push({ start: cpu, end: cpu + LAUNCH });
    cpu += LAUNCH;
    const start = Math.max(gpu, cpu);
    g.push({ start, end: start + kernel });
    gpu = start + kernel;
    if (sync && gpu > cpu) {
      waits.push({ start: cpu, end: gpu });
      cpu = gpu;
    }
  }
  const total = Math.max(cpu, gpu), busy = STEPS * kernel;
  return { c, g, waits, total, util: busy / total };
}

export function LaunchQueueViz() {
  const [big, setBig] = useState(true);
  const [sync, setSync] = useState(false);
  const r = simulate(big ? 20 : 1, sync);
  const W = 300, X0 = 44, PW = W - 52, T = 260;
  const sx = (t: number) => X0 + (t / T) * PW;
  const lane = (blocks: Block[], y: number, fill: string) =>
    blocks.map((b, i) => <rect key={i} x={sx(b.start)} y={y} width={Math.max(1, sx(b.end) - sx(b.start) - 0.8)} height={18} fill={fill} />);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" aria-pressed={big} onClick={() => setBig(true)}>20 µs kernels</button>
        <button type="button" className="seg" aria-pressed={!big} onClick={() => setBig(false)}>1 µs kernels</button>
        <button type="button" className="seg" aria-pressed={sync} onClick={() => setSync(!sync)}>sync every step</button>
      </div>
      <svg viewBox={`0 0 ${W} 86`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="CPU launch timeline and GPU execution timeline">
        <text x={X0 - 6} y={23} textAnchor="end" className="viz-label">CPU</text>
        <text x={X0 - 6} y={53} textAnchor="end" className="viz-label">GPU</text>
        {lane(r.c, 10, "var(--text-muted)")}
        {lane(r.waits, 10, "var(--danger)")}
        {lane(r.g, 40, "var(--accent)")}
        <line x1={X0} y1={70} x2={X0 + PW} y2={70} stroke="var(--border)" />
        {[0, 100, 200].map((t) => (
          <text key={t} x={sx(t)} y={82} textAnchor="middle" className="viz-label">{t} µs</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`8 steps take ${r.total} µs; the GPU is busy ${(100 * r.util).toFixed(0)}% of the time`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Grey blocks are the CPU launching kernels (5 µs each); colour blocks are the GPU running them in order. Launches are
        asynchronous, so with long kernels the CPU races ahead and the GPU never waits. A synchronisation each step, such as
        reading a loss with .item(), makes the CPU wait (red) until the GPU finishes, so the next launch cannot overlap. With
        tiny kernels the GPU idles between launches whatever you do: the work is launch-bound.
      </figcaption>
    </figure>
  );
}
