"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const W8 = [0.8, 0.2], MUS = [-2, 2], V0 = 0.09;
/** Score of the data 0.8 N(-2, 0.3^2) + 0.2 N(2, 0.3^2) blurred by noise of size s. */
export function score(x: number, s: number) {
  const v = V0 + s * s;
  const d = MUS.map((m, k) => W8[k] * Math.exp(-((x - m) ** 2) / (2 * v)));
  const t = d[0] + d[1];
  return t > 0 ? (d[0] * (-(x - MUS[0]) / v) + d[1] * (-(x - MUS[1]) / v)) / t : -x / v;
}

const SIGMAS = Array.from({ length: 10 }, (_, i) => 4 * (0.03 / 4) ** (i / 9));

/** Run plain Langevin with the clean score, or annealed Langevin through decreasing noise levels, from uniform starts on [-8, 8]. */
export function sample(annealed: boolean, n: number, seed: number) {
  const r = rand(seed);
  const nrm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    let x = 16 * r() - 8;
    if (annealed) {
      for (const s of SIGMAS) { const eps = 0.1 * (V0 + s * s); for (let k = 0; k < 40; k++) x += eps * score(x, s) + Math.sqrt(2 * eps) * nrm(); }
    } else {
      const eps = 0.002;
      for (let k = 0; k < 400; k++) x += eps * score(x, 0.03) + Math.sqrt(2 * eps) * nrm();
    }
    out.push(x);
  }
  return out;
}

export function AnnealedLangevinViz() {
  const [ann, setAnn] = useState(false);
  const xs = useMemo(() => sample(ann, 1500, 13), [ann]);
  const left = xs.filter((x) => x < 0).length / xs.length;
  const NB = 64, LO = -4, HI = 4, bw = (HI - LO) / NB;
  const hist = new Array(NB).fill(0);
  for (const x of xs) { const b = Math.floor((x - LO) / bw); if (b >= 0 && b < NB) hist[b]++; }
  const dens = hist.map((h) => h / (xs.length * bw));
  const W = 330, H = 160, X0 = 10, PW = W - 20, Y0 = 8, PH = H - Y0 - 26, YM = 1.2;
  const sx = (x: number) => X0 + ((x - LO) / (HI - LO)) * PW, sy = (y: number) => Y0 + PH - (Math.min(y, YM) / YM) * PH;
  const grid = Array.from({ length: 321 }, (_, i) => LO + (i * (HI - LO)) / 320);
  const truth = (x: number) => MUS.reduce((a, m, k) => a + (W8[k] * Math.exp(-((x - m) ** 2) / (2 * V0))) / Math.sqrt(2 * Math.PI * V0), 0);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Sampler">
          <button type="button" className="seg" aria-pressed={!ann} onClick={() => setAnn(false)}>plain Langevin</button>
          <button type="button" className="seg" aria-pressed={ann} onClick={() => setAnn(true)}>annealed</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of Langevin samples against the true density">
        {dens.map((d, i) => <rect key={i} x={X0 + i * (PW / NB) + 0.5} y={sy(d)} width={PW / NB - 1} height={Y0 + PH - sy(d)} fill="var(--accent)" fillOpacity={0.45} />)}
        <path d={grid.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(truth(x)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeDasharray="4 3" />
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border-strong)" />
        {[-4, -2, 0, 2, 4].map((t) => <text key={t} x={sx(t)} y={H - 6} textAnchor="middle" className="viz-label">{t}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`fraction of samples in the left mode: ${left.toFixed(3)} (true 0.800)`}
      </div>
      <figcaption className="viz-caption">
        The data put 80% of their mass at −2 and 20% at +2 (dashed). Plain Langevin dynamics with the exact score, started
        from points spread uniformly over [−8, 8], sends each point to the nearer mode and then never crosses between them: the
        modes get roughly equal shares (0.496 on the left), whatever their true weights. Annealed Langevin starts with the score of heavily blurred
        data, in which the two modes merge into one broad hill weighted 80 to 20, and sharpens it over ten noise levels, with
        step sizes proportional to the variance at each level, recovering nearly the right proportions (0.777).
      </figcaption>
    </figure>
  );
}
