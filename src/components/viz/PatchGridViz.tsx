"use client";

import { useEffect, useState } from "react";
import { makeRng } from "./ml";

const SIDE = 32;
const PS = [4, 8, 16];

/** A procedural grey-level image: a ring and a bar, values in [0, 1]. */
export function image() {
  return Array.from({ length: SIDE }, (_, y) =>
    Array.from({ length: SIDE }, (_, x) => {
      const r = Math.hypot(x - 12, y - 13);
      const ring = Math.exp(-((r - 7) ** 2) / 4);
      const bar = x > 21 && x < 27 && y > 6 && y < 28 ? 0.8 : 0;
      return Math.min(1, ring + bar + 0.05);
    }),
  );
}

/** A random order of the n patches, or the identity when seed is 0. */
export function patchOrder(n: number, seed: number) {
  const o = Array.from({ length: n }, (_, i) => i);
  if (!seed) return o;
  const u = makeRng(seed);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(u() * (i + 1));
    [o[i], o[j]] = [o[j], o[i]];
  }
  return o;
}

export function PatchGridViz() {
  const [P, setP] = useState(8);
  const [seed, setSeed] = useState(0);
  const [img, setImg] = useState<number[][] | null>(null);
  useEffect(() => setImg(image()), []);
  const g = SIDE / P, n = g * g, order = patchOrder(n, seed), C = 7, W = SIDE * C;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {PS.map((p) => (
          <button key={p} type="button" className="seg" aria-pressed={p === P} onClick={() => { setP(p); setSeed(0); }}>patch {p}</button>
        ))}
        <button type="button" className="seg" aria-pressed={seed > 0} onClick={() => setSeed(seed > 0 ? 0 : 7)}>shuffle patches</button>
      </div>
      <svg viewBox={`0 0 ${W} ${W}`} style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }} role="img" aria-label="An image cut into square patches, optionally shuffled">
        {img && order.map((src, dst) => {
          const sr = Math.floor(src / g), sc = src % g, dr = Math.floor(dst / g), dc = dst % g;
          return (
            <g key={dst}>
              {Array.from({ length: P * P }, (_, k) => {
                const y = Math.floor(k / P), x = k % P;
                return <rect key={k} x={(dc * P + x) * C} y={(dr * P + y) * C} width={C} height={C} fill="var(--accent)" fillOpacity={img[sr * P + y][sc * P + x]} />;
              })}
            </g>
          );
        })}
        {Array.from({ length: g + 1 }, (_, i) => (
          <g key={i}>
            <line x1={i * P * C} y1={0} x2={i * P * C} y2={W} stroke="var(--text-muted)" strokeWidth={1} />
            <line x1={0} y1={i * P * C} x2={W} y2={i * P * C} stroke="var(--text-muted)" strokeWidth={1} />
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`${n} tokens of length ${P * P}; ${(n * n).toLocaleString("en-IN")} attention weights per head`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A 32 × 32 image is cut into non-overlapping patches; each patch is flattened into one token. Smaller patches mean
        finer detail and quadratically more attention weights. Shuffle the patches to see what a transformer without
        position embeddings receives: the same set of tokens, whatever the arrangement, so it cannot tell this picture from
        the original.
      </figcaption>
    </figure>
  );
}
