"use client";

import { useState } from "react";

const L = 8, LIMIT = 16, W = 520, H = 220, PAD = 34;

function timeline(batch: number, ckpt: boolean, leak: boolean) {
  const a = 0.25 * (batch / 8); // GB of activations per layer
  const stored = (l: number) => (ckpt ? Math.ceil(l / 4) : l); // layers' worth kept after forward through layer l
  const pts: number[] = [];
  let adam = 0;
  let leaked = 0;
  for (let s = 0; s < 3; s++) {
    const base = 1 + adam + leaked;
    pts.push(base);
    for (let l = 1; l <= L; l++) pts.push(base + stored(l) * a);
    for (let l = L; l >= 1; l--) {
      const grads = (L - l + 1) / L;
      // With checkpointing, backward through a block of 4 recomputes it: earlier checkpoints plus the block so far.
      const acts = leak ? stored(L) : ckpt ? Math.ceil(l / 4) - 1 + ((l - 1) % 4) + 1 : l - 1;
      pts.push(base + grads + acts * a);
    }
    if (leak) leaked += stored(L) * a;
    adam = 2;
    pts.push(1 + adam + 1 + leaked);
    pts.push(1 + adam + leaked);
  }
  return pts;
}

/** Memory over three training steps: parameters, activations saved in the forward pass, gradients, optimiser state. */
export function MemoryTimelineViz() {
  const [batch, setBatch] = useState(32);
  const [ckpt, setCkpt] = useState(false);
  const [leak, setLeak] = useState(false);
  const pts = timeline(batch, ckpt, leak);
  const ymax = Math.max(LIMIT + 4, Math.ceil(Math.max(...pts)) + 2);
  const px = (i: number) => PAD + (i / (pts.length - 1)) * (W - PAD - 10);
  const py = (v: number) => 10 + (1 - v / ymax) * (H - 10 - PAD);
  const peak = Math.max(...pts);
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="GPU memory in use over three training steps">
        <line x1={PAD} y1={H - PAD} x2={W - 10} y2={H - PAD} stroke="var(--border)" />
        <line x1={PAD} y1={10} x2={PAD} y2={H - PAD} stroke="var(--border)" />
        {[0, 8, 16, 24, 32, 40].filter((v) => v <= ymax).map((v) => (
          <text key={v} x={PAD - 4} y={py(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
        <line x1={PAD} y1={py(LIMIT)} x2={W - 10} y2={py(LIMIT)} stroke="var(--danger)" strokeDasharray="5 4" />
        <text x={W - 12} y={py(LIMIT) - 4} textAnchor="end" className="viz-label">16 GB GPU</text>
        <text x={(W + PAD) / 2} y={H - 8} textAnchor="middle" className="viz-label">three steps: forward, backward, optimiser</text>
        <polyline points={pts.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
      </svg>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 200px" }}>
          <span className="mono">batch {batch}</span>
          <input type="range" min={8} max={64} step={8} value={batch} onChange={(e) => setBatch(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
        </label>
        <button type="button" className="seg" aria-pressed={ckpt} onClick={() => setCkpt(!ckpt)}>checkpointing</button>
        <button type="button" className="seg" aria-pressed={leak} onClick={() => setLeak(!leak)}>losses.append(loss)</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Peak {peak.toFixed(1)} GB{peak > LIMIT ? ": out of memory." : "."}{" "}
        {leak
          ? "Keeping each loss tensor keeps its whole graph of saved activations alive, so memory climbs every step until the run dies."
          : ckpt
            ? "Checkpointing keeps only a few activations and recomputes the rest during backward: a lower peak for about one extra forward pass."
            : "Activations saved in the forward pass dominate the peak, and they grow with the batch size. The optimiser state appears after the first step."}
      </figcaption>
    </figure>
  );
}
