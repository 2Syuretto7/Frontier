"use client";

import { useMemo, useState } from "react";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const L = 30, SWEEPS = 300;

/** Gibbs sampling of an Ising model on a 30-by-30 grid with wrap-around: each spin is redrawn from its conditional given its four neighbours. */
export function IsingGibbsViz() {
  const [J, setJ] = useState(0.3);
  const [seed, setSeed] = useState(1);
  const { x, mag, corr } = useMemo(() => {
    const r = makeRng(seed * 101 + 7);
    const x = Array.from({ length: L * L }, () => (r() < 0.5 ? -1 : 1));
    const at = (i: number, j: number) => x[((i + L) % L) * L + ((j + L) % L)];
    for (let s = 0; s < SWEEPS; s++) {
      for (let i = 0; i < L; i++) {
        for (let j = 0; j < L; j++) {
          const f = J * (at(i - 1, j) + at(i + 1, j) + at(i, j - 1) + at(i, j + 1));
          x[i * L + j] = r() < 1 / (1 + Math.exp(-2 * f)) ? 1 : -1;
        }
      }
    }
    let m = 0, c = 0;
    for (let i = 0; i < L; i++) for (let j = 0; j < L; j++) {
      m += at(i, j);
      c += at(i, j) * (at(i + 1, j) + at(i, j + 1));
    }
    return { x, mag: Math.abs(m) / (L * L), corr: c / (2 * L * L) };
  }, [J, seed]);
  const cell = 8;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          coupling J = {J.toFixed(2)}
          <input type="range" min={0} max={0.8} step={0.05} value={J} onChange={(e) => setJ(Number(e.target.value))} aria-label="coupling strength" style={{ width: 130 }} />
        </label>
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new start</button>
      </div>
      <svg viewBox={`0 0 ${L * cell} ${L * cell}`} style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }} role="img" aria-label="Grid of spins after Gibbs sampling">
        <rect width={L * cell} height={L * cell} fill="var(--border)" opacity={0.25} />
        {x.map((v, k) => (v === 1 ? <rect key={k} x={(k % L) * cell} y={Math.floor(k / L) * cell} width={cell} height={cell} fill="var(--accent)" /> : null))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        |mean spin| = {mag.toFixed(2)}; neighbour correlation = {corr.toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each square is a spin, +1 (filled) or −1, with p(x) proportional to exp(J Σ xᵢxⱼ) over neighbouring pairs. Gibbs
        sampling redraws one spin at a time with P(xᵢ = +1 | rest) = σ(2J·(sum of the four neighbours)), the Markov blanket
        being just the neighbours. After {SWEEPS} sweeps, weak coupling gives salt and pepper; above about J = 0.44 large
        single-colour domains form, and the sampler mixes so slowly that different starts end in different states.
      </figcaption>
    </figure>
  );
}
