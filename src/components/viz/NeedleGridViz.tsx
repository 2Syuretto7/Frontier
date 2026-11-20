"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

export const LENGTHS = [4, 8, 16, 32, 64, 128];
export const DEPTHS = Array.from({ length: 11 }, (_, i) => i * 10);

type Model = "base" | "scaled" | "trained";

/** Probability that a single needle is retrieved, for a synthetic model, length in thousands and depth in per cent. */
export function passProb(model: Model, len: number, depth: number) {
  const middle = 1 - Math.abs(depth - 50) / 50; // 0 at the ends, 1 in the middle
  if (model === "base") return len <= 8 ? 0.98 : 0.02;
  if (model === "scaled") {
    const over = Math.max(0, Math.log2(len / 8));
    return Math.max(0.02, Math.min(0.99, 0.99 - over * (0.12 + 0.18 * middle)));
  }
  const over = Math.max(0, Math.log2(len / 32));
  return Math.max(0.02, Math.min(0.995, 0.995 - over * 0.09 * middle));
}

/** Pass or fail for each cell, sampled with a fixed seed; `keys` needles must all be found. */
export function grid(model: Model, keys: number, seed = 31) {
  const r = rand(seed);
  return LENGTHS.map((len) => DEPTHS.map((d) => {
    let ok = true;
    for (let k = 0; k < keys; k++) if (r() >= passProb(model, len, d)) ok = false;
    return ok;
  }));
}

const LABEL: Record<Model, string> = { base: "trained at 8K", scaled: "rescaled only", trained: "rescaled and trained" };

export function NeedleGridViz() {
  const [model, setModel] = useState<Model>("trained");
  const [keys, setKeys] = useState(1);
  const g = useMemo(() => grid(model, keys), [model, keys]);
  const rowScore = g.map((row) => row.filter(Boolean).length / row.length);
  const overall = rowScore.reduce((a, b) => a + b, 0) / rowScore.length;
  let eff = 0;
  for (let i = 0; i < LENGTHS.length && rowScore[i] >= 0.85; i++) eff = LENGTHS[i];
  const W = 330, H = 200, X0 = 40, Y0 = 8, CW = 25, CH = 24;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Model">
          {(Object.keys(LABEL) as Model[]).map((m) => (
            <button key={m} className="seg" aria-pressed={model === m} onClick={() => setModel(m)}>{LABEL[m]}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Needles">
          {[1, 4].map((k) => (
            <button key={k} className="seg" aria-pressed={keys === k} onClick={() => setKeys(k)}>{k === 1 ? "one needle" : "four needles"}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Retrieval results by context length and needle depth">
        {g.map((row, i) => (
          <g key={i}>
            <text x={X0 - 4} y={Y0 + i * CH + CH / 2 + 4} textAnchor="end" className="viz-label">{LENGTHS[i]}K</text>
            {row.map((ok, j) => (
              <rect key={j} x={X0 + j * CW} y={Y0 + i * CH} width={CW - 2} height={CH - 2} rx={2} style={{ fill: ok ? "var(--accent)" : "var(--danger)" }} opacity={ok ? 0.75 : 0.85} />
            ))}
          </g>
        ))}
        {DEPTHS.map((d, j) => (j % 2 === 0 ? <text key={d} x={X0 + j * CW + CW / 2 - 1} y={Y0 + LENGTHS.length * CH + 12} textAnchor="middle" className="viz-label">{d}%</text> : null))}
        <text x={X0} y={H - 4} className="viz-label">columns: needle depth; rows: context length</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {LABEL[model]}, {keys === 1 ? "one needle" : "four needles"}: {Math.round(overall * 100)}% of cells pass; every row passes 85% up to {eff ? `${eff}K` : "none"}
      </div>
      <figcaption className="viz-caption">
        A needle-in-a-haystack grid for three synthetic models. A model used beyond its training length fails outright.
        Rescaling the rotary frequencies without long training keeps short contexts working but fails at long ones, worst in
        the middle of the document. With long-context training, single-needle retrieval is nearly perfect, which is why harder
        variants such as finding four needles at once are used to separate models.
      </figcaption>
    </figure>
  );
}
