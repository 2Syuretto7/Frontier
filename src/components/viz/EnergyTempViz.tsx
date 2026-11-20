"use client";

import { useState } from "react";

/** Asymmetric double-well energy. */
export const energy = (x: number) => 2 * (x * x - 1) ** 2 + 0.3 * x;
const LO = -2.2, HI = 2.2, N = 2201, DX = (HI - LO) / (N - 1);

/** log Z, probability of the left well and mean energy at temperature T, by quadrature. */
export function stats(T: number) {
  let z = 0, left = 0, me = 0;
  for (let i = 0; i < N; i++) { const x = LO + i * DX, w = Math.exp(-energy(x) / T) * DX; z += w; if (x < 0) left += w; me += w * energy(x); }
  return { logZ: Math.log(z), left: left / z, meanE: me / z, Z: z };
}

const TS = [0.1, 0.3, 1, 3];

export function EnergyTempViz() {
  const [ti, setTi] = useState(1);
  const T = TS[ti], st = stats(T);
  const W = 330, H = 222, X0 = 10, PW = W - 20, PH = 70, Y1 = 22, Y2 = 122;
  const sx = (x: number) => X0 + ((x - LO) / (HI - LO)) * PW;
  const grid = Array.from({ length: 441 }, (_, i) => LO + (i * (HI - LO)) / 440);
  const pmax = Math.max(...grid.map((x) => Math.exp(-energy(x) / T) / st.Z));
  const ey = (e: number) => Y1 + PH - (Math.min(e, 4) / 4.5) * PH, py = (p: number) => Y2 + PH - (p / pmax) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">temperature T</span>
        <div className="segmented" role="group" aria-label="Temperature">
          {TS.map((t, i) => <button key={t} type="button" className="seg" aria-pressed={ti === i} onClick={() => setTi(i)}>{t}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Energy and Boltzmann density">
        <text x={X0} y={Y1 - 8} className="viz-label">energy E(x)</text>
        <path d={grid.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${ey(energy(x)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text-muted)" strokeWidth={2} />
        <text x={X0} y={Y2 - 8} className="viz-label">density ∝ exp(−E/T), scaled to its peak</text>
        <path d={grid.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${py(Math.exp(-energy(x) / T) / st.Z).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <line x1={X0} x2={X0 + PW} y1={Y2 + PH} y2={Y2 + PH} stroke="var(--border-strong)" />
        {[-2, -1, 0, 1, 2].map((t) => <text key={t} x={sx(t)} y={Y2 + PH + 14} textAnchor="middle" className="viz-label">{t}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`log Z ${st.logZ.toFixed(3)}; P(left well) ${st.left.toFixed(3)}; mean energy ${st.meanE.toFixed(3)}`}
      </div>
      <figcaption className="viz-caption">
        An energy function defines a density by exponentiating minus the energy and dividing by the normaliser Z. The left well
        is 0.6 lower than the right. At temperature 1 the two wells hold 0.63 and 0.37 of the mass; at 0.1 almost all of it
        sits in the lower well (0.997); at 3 the density spreads over both wells and the barrier between them. Only
        differences in energy matter, and computing Z needs an integral over the whole space.
      </figcaption>
    </figure>
  );
}
