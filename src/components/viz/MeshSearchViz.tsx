"use client";

import { useState } from "react";

const P = 70e9, L = 80, D = 8192, S = 4096, F = 400e12, N = 256, G8 = 8, BUDGET = 80;
const A = (34 * S * D) / 1e9;                       // GB of activations per sequence per layer with sequence parallelism
const BW_TP = 450e9, BW_DP = 50e9;

export function memoryGb(dp: number, tp: number, pp: number) {
  return (4 * P) / (tp * pp) / 1e9 + (12 * P) / (tp * pp * dp) / 1e9 + (L * A) / tp;
}

export function meshTime(G: number, dp: number, tp: number, pp: number) {
  const compute = (6 * P * G * S) / (N * F);
  const tpo = (2 * (tp - 1) * F) / (9 * D * BW_TP);
  const m = G / dp;
  const grads = ((2 * (dp - 1)) / dp) * ((2 * P) / (tp * pp)) / BW_DP;
  return { t: compute * (1 + tpo) * ((m + pp - 1) / m) + grads, compute };
}

/** Every (dp, tp, pp) on 256 GPUs with tp dividing a node of 8, pp dividing 80 layers, micro-batch 1, fitting in 80 GB. */
export function meshes(G: number) {
  const out: { dp: number; tp: number; pp: number; eff: number }[] = [];
  for (const tp of [1, 2, 4, 8])
    for (const pp of [1, 2, 4, 8, 16]) {
      if (G8 % tp || L % pp || N % (tp * pp)) continue;
      const dp = N / (tp * pp);
      if (G % dp || memoryGb(dp, tp, pp) > BUDGET) continue;
      const { t, compute } = meshTime(G, dp, tp, pp);
      out.push({ dp, tp, pp, eff: compute / t });
    }
  return out;
}

export function MeshSearchViz() {
  const [G, setG] = useState(256);
  const ms = meshes(G);
  const best = ms.reduce((b, m) => (m.eff > b.eff ? m : b), ms[0]);
  const W = 330, X0 = 84, BW = 220, RH = 15, Y0 = 4, LO = 0.5;
  const x = (e: number) => X0 + ((e - LO) / (1 - LO)) * BW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Global batch">
          {[256, 1024].map((g) => <button key={g} type="button" className="seg" aria-pressed={G === g} onClick={() => setG(g)}>{g} sequences</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + ms.length * RH + 18}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Efficiency of each feasible device mesh">
        {ms.map((m, i) => (
          <g key={`${m.dp}-${m.tp}-${m.pp}`}>
            <text x={X0 - 6} y={Y0 + i * RH + 10} textAnchor="end" className="mono" style={{ fontSize: 9, fill: "var(--text-muted)" }}>{m.dp}·{m.tp}·{m.pp}</text>
            <rect x={X0} y={Y0 + i * RH} width={Math.max(0, x(m.eff) - X0)} height={RH - 4} style={{ fill: m === best ? "var(--accent)" : "var(--text-muted)" }} opacity={m === best ? 0.9 : 0.6} />
          </g>
        ))}
        {[0.5, 0.75, 1].map((v) => <text key={v} x={x(v)} y={Y0 + ms.length * RH + 12} textAnchor={v === 1 ? "end" : "middle"} className="viz-label">{v * 100}%</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        best of {ms.length} feasible meshes (dp·tp·pp): {best.dp}·{best.tp}·{best.pp}, at {(best.eff * 100).toFixed(1)}% of the time with no overheads
      </div>
      <figcaption className="viz-caption">
        A 70-billion-parameter model on 256 GPUs, each bar a mesh that fits in 80 GB, its length the share of the step spent on useful
        compute. With a small global batch, many data-parallel replicas would leave each pipeline few micro-batches and a large bubble,
        so the best mesh uses few replicas and full tensor parallelism; with four times the batch the bubble stays small with more
        replicas, and less tensor parallelism wins.
      </figcaption>
    </figure>
  );
}
