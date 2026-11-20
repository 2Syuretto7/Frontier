"use client";

import { useState } from "react";

/*
 * Results of real training runs, recorded offline. A 10-input, 128-unit ReLU network learns a 3-class task labelled by a fixed
 * random teacher network, with SGD (batch 128, learning rate 0.1, 6,000 steps) on 4,000 examples, tested on 4,000 others.
 * Pruning: magnitude masks from the trained network, retrained from the original or a fresh initialisation, averaged over three
 * seeds. Interpolation: test loss along the line between two networks trained from different seeds, before and after matching
 * hidden units by the Hungarian algorithm on their weights.
 */
const SPARSITY = [0.0, 0.5, 0.7, 0.8, 0.9, 0.95, 0.98];
const TICKET = [0.8702, 0.8668, 0.8464, 0.8327, 0.7918, 0.6598, 0.4956];
const RANDOM = [0.8708, 0.8477, 0.8328, 0.8267, 0.7914, 0.6591, 0.4956];
const ALPHA = [0.0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0];
const NAIVE = [0.3183, 0.3471, 0.4196, 0.5285, 0.6637, 0.8163, 0.9735, 1.1206, 1.2445, 1.3331, 1.3771, 1.3713, 1.3124, 1.2078, 1.0659, 0.9036, 0.7396, 0.5888, 0.4637, 0.3795, 0.3475];
const ALIGNED = [0.3183, 0.3198, 0.3255, 0.334, 0.3445, 0.3561, 0.3675, 0.3781, 0.3876, 0.3948, 0.399, 0.4, 0.3976, 0.3926, 0.3854, 0.3765, 0.3668, 0.3575, 0.3501, 0.3464, 0.3475];

export function TicketModeViz() {
  const [panel, setPanel] = useState(0);
  const W = 330, H = 180, X0 = 34, PW = 286, Y0 = 10, PH = 140;
  const isPrune = panel === 0;
  const xs = isPrune ? SPARSITY.map((_, i) => i / (SPARSITY.length - 1)) : ALPHA;
  const series = isPrune ? [{ ys: TICKET, col: "var(--accent)" }, { ys: RANDOM, col: "var(--text-muted)" }] : [{ ys: ALIGNED, col: "var(--accent)" }, { ys: NAIVE, col: "var(--text-muted)" }];
  const lo = isPrune ? 0.4 : 0, hi = isPrune ? 0.9 : 1.5;
  const px = (x: number) => X0 + x * PW;
  const py = (y: number) => Y0 + PH - ((y - lo) / (hi - lo)) * PH;
  const ticks = isPrune ? [0.4, 0.6, 0.8] : [0, 0.5, 1, 1.5];
  const read = isPrune
    ? `at 70% pruned: ticket ${(100 * TICKET[2]).toFixed(1)}%, random restart ${(100 * RANDOM[2]).toFixed(1)}% test accuracy`
    : `loss rise at the midpoint: naive ${(NAIVE[10] - (NAIVE[0] + NAIVE[20]) / 2).toFixed(2)}, aligned ${(ALIGNED[10] - (ALIGNED[0] + ALIGNED[20]) / 2).toFixed(2)}`;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Experiment">
          {["pruning and retraining", "interpolating two networks"].map((name, i) => <button key={name} type="button" className="seg" aria-pressed={panel === i} onClick={() => setPanel(i)}>{name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label={isPrune ? "Test accuracy against fraction of weights pruned" : "Test loss along the straight line between two trained networks"}>
        {ticks.map((y) => (
          <g key={y}>
            <line x1={X0} x2={X0 + PW} y1={py(y)} y2={py(y)} stroke="var(--border)" strokeDasharray="2 3" />
            <text x={X0 - 4} y={py(y) + 4} textAnchor="end" className="viz-label">{isPrune ? `${y * 100}%` : y}</text>
          </g>
        ))}
        {series.map((s, k) => <path key={k} d={s.ys.map((y, i) => `${i ? "L" : "M"}${px(xs[i]).toFixed(1)},${py(y).toFixed(1)}`).join(" ")} fill="none" stroke={s.col} strokeWidth={k ? 1.5 : 2} />)}
        {isPrune
          ? SPARSITY.map((s, i) => <text key={s} x={px(xs[i])} y={Y0 + PH + 13} textAnchor={i === 0 ? "start" : i === SPARSITY.length - 1 ? "end" : "middle"} className="viz-label">{Math.round(s * 100)}</text>)
          : [0, 0.5, 1].map((a) => <text key={a} x={px(a)} y={Y0 + PH + 13} textAnchor={a === 0 ? "start" : a === 1 ? "end" : "middle"} className="viz-label">{a === 0 ? "network A" : a === 1 ? "network B" : "halfway"}</text>)}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">{isPrune ? "% of weights pruned" : "position on the line"}</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">{read}</div>
      <figcaption className="viz-caption">
        Real runs of a small two-layer network on a synthetic classification task. Pruning: after training, the smallest weights are
        removed and the remaining subnetwork is retrained, either from its original initial values (the ticket, coloured) or from fresh random
        ones (grey); here the ticket&apos;s advantage is a point or two at moderate sparsity and vanishes at high sparsity. Interpolating: the straight
        line between two independently trained networks (grey) crosses a ridge of high loss, but after permuting one network&apos;s hidden
        units to match the other (coloured), the ridge almost disappears.
      </figcaption>
    </figure>
  );
}
