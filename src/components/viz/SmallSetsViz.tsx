"use client";

import { useState } from "react";

export const LAWS = ["density 2x", "density + atom at 1/2", "Cantor law"];

/**
 * The worst set: a set A ⊂ [0, 1] with λ(A) ≤ δ carrying as much ν-mass as possible.
 * Returns its intervals, its length and its ν-mass.
 */
export function worst(law: number, delta: number) {
  if (law === 2) {
    let m = 0;
    while ((2 / 3) ** m > delta) m++;
    // Draw at most stage 8 (256 intervals); deeper stages are narrower than a pixel.
    const d = Math.min(m, 8);
    const ivs: [number, number][] = [];
    for (let j = 0; j < 2 ** d; j++) {
      let a = 0;
      for (let b = 0; b < d; b++) if ((j >> (d - 1 - b)) & 1) a += 2 / 3 ** (b + 1);
      ivs.push([a, a + 3 ** -d]);
    }
    return { ivs, len: (2 / 3) ** m, mass: 1 };
  }
  const w = law === 1 ? 0.7 : 1;
  const top = 1 - (1 - delta) ** 2;
  if (law === 0) return { ivs: [[1 - delta, 1]] as [number, number][], len: delta, mass: top };
  return { ivs: [[1 - delta, 1]] as [number, number][], len: delta, mass: 0.3 + w * top };
}

export function SmallSetsViz() {
  const [law, setLaw] = useState(0);
  const [k, setK] = useState(4);
  const delta = 2 ** -k;
  const r = worst(law, delta);
  const W = 330, H = 130, X0 = 14, PW = 304;
  const sx = (x: number) => X0 + x * PW;
  const curve = Array.from({ length: 13 }, (_, j) => worst(law, 2 ** -j).mass);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Measure ν" style={{ flexWrap: "wrap" }}>
          {LAWS.map((l, i) => (
            <button key={l} type="button" className="seg" aria-pressed={law === i} onClick={() => setLaw(i)}>{l}</button>
          ))}
        </div>
        <label className="viz-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          δ = {k ? `1/${2 ** k}` : "1"}
          <input type="range" min={0} max={12} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="Length budget delta" />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="A set of small length carrying as much mass as possible, and that mass as the budget shrinks">
        <text x={X0} y={12} className="viz-label">set A with λ(A) ≤ δ, as heavy as possible</text>
        <rect x={X0} y={18} width={PW} height={16} fill="none" stroke="var(--border)" />
        {r.ivs.map(([a, b], i) => <rect key={i} x={sx(a)} y={18} width={Math.max(0.6, (b - a) * PW)} height={16} fill="var(--accent)" />)}
        {law === 1 && <line x1={sx(0.5)} x2={sx(0.5)} y1={14} y2={38} stroke="var(--code-function)" strokeWidth={2} />}
        <text x={X0} y={48} className="viz-label">0</text>
        <text x={X0 + PW} y={48} textAnchor="end" className="viz-label">1</text>
        <text x={X0} y={66} className="viz-label">ν(A) as δ shrinks from 1 to 1/4096</text>
        <line x1={X0} x2={X0 + PW} y1={120} y2={120} stroke="var(--border)" />
        {curve.map((m, j) => (
          <rect key={j} x={X0 + j * (PW / 13) + 2} y={120 - m * 46} width={PW / 13 - 4} height={m * 46} fill={j === k ? "var(--accent)" : "var(--border)"} />
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        λ(A) = {r.len.toFixed(4)}, ν(A) = {r.mass.toFixed(4)}
      </div>
      <figcaption className="viz-caption">
        How much ν-mass can hide in a set of small length? With density 2x, the heaviest set of length δ is [1 − δ, 1] and its
        mass 2δ − δ² goes to 0 with δ: that is absolute continuity. An atom (here of weight 0.3 at 1/2) keeps the mass from
        falling below 0.3, since a point has length 0. The Cantor law is worse: stage-m covers of the Cantor set have length
        (2/3)ᵐ and carry all the mass, so ν(A) = 1 however small δ is.
      </figcaption>
    </figure>
  );
}
