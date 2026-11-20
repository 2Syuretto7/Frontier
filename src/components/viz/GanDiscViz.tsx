"use client";

import { useState } from "react";

const pdf = (x: number, m: number, s: number) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
const pd = (x: number) => pdf(x, 0, 1);
const LO = -8, HI = 10, N = 3601, DX = (HI - LO) / (N - 1);

/** Quantities at the optimal discriminator for data N(0, 1) and generator N(mu, 1). */
export function analyse(mu: number) {
  const pg = (x: number) => pdf(x, mu, 1);
  const D = (x: number) => { const a = pd(x), b = pg(x); return a + b > 0 ? a / (a + b) : 0.5; };
  let js = 0, gSat = 0, gNon = 0;
  for (let i = 0; i < N; i++) {
    const x = LO + i * DX, a = pd(x), b = pg(x), m = (a + b) / 2;
    if (a > 0) js += 0.5 * a * Math.log(a / m) * DX;
    if (b > 0) js += 0.5 * b * Math.log(b / m) * DX;
    const d = D(x);
    gSat += b * d * DX;
    gNon += b * (1 - d) * DX;
  }
  return { js, value: -Math.log(4) + 2 * js, gSat, gNon, D };
}

const MUS = [0, 1, 2, 4, 7];

export function GanDiscViz() {
  const [mi, setMi] = useState(2);
  const mu = MUS[mi];
  const { js, value, gSat, gNon, D } = analyse(mu);
  const W = 330, H = 170, X0 = 10, PW = W - 20, Y0 = 8, PH = H - Y0 - 30, XL = -4, XH = 10;
  const sx = (x: number) => X0 + ((x - XL) / (XH - XL)) * PW, sy = (y: number) => Y0 + PH - y * PH;
  const grid = Array.from({ length: 401 }, (_, i) => XL + (i * (XH - XL)) / 400);
  const curve = (f: (x: number) => number) => grid.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(f(x)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">generator mean</span>
        <div className="segmented" role="group" aria-label="Generator mean">
          {MUS.map((m, i) => <button key={m} type="button" className="seg" aria-pressed={mi === i} onClick={() => setMi(i)}>{m}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Data, generator and optimal discriminator">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border-strong)" />
        <line x1={X0} x2={X0 + PW} y1={sy(1)} y2={sy(1)} stroke="var(--border)" strokeDasharray="2 4" />
        <path d={curve((x) => pd(x) * 2)} fill="none" stroke="var(--text-muted)" strokeWidth={2} />
        <path d={curve((x) => pdf(x, mu, 1) * 2)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <path d={curve(D)} fill="none" stroke="var(--success)" strokeWidth={2} strokeDasharray="5 3" />
        {[-4, -2, 0, 2, 4, 6, 8, 10].map((t) => <text key={t} x={sx(t)} y={Y0 + PH + 16} textAnchor="middle" className="viz-label">{t}</text>)}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--text-muted)" }}>●</span> data density</span>
        <span><span style={{ color: "var(--accent)" }}>●</span> generator density</span>
        <span><span style={{ color: "var(--success)" }}>●</span> optimal discriminator D*(x) (dashed, 0 to 1)</span>
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`JSD ${js.toFixed(4)} (max ${Math.log(2).toFixed(4)}); V ${value.toFixed(4)}; mean |∂/∂logit| on fakes: minimax ${gSat.toFixed(4)}, non-saturating ${gNon.toFixed(4)}`}
      </div>
      <figcaption className="viz-caption">
        The best discriminator outputs the fraction of density at x that is real. As the generator moves away from the data,
        the Jensen-Shannon divergence approaches its ceiling, log 2, and stops changing. The minimax generator loss log(1 − D)
        then has almost no gradient on the generator&apos;s samples, since D is near 0 there: 0.0004 at mean 7. The
        non-saturating loss −log D keeps a gradient of almost 1.
      </figcaption>
    </figure>
  );
}
