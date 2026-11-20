"use client";

import { useState } from "react";

/** Linear-Gaussian model z ~ N(0, 1), x | z ~ N(W z, SIG^2), observed at x = X. */
const W = 1.5, SIG = 0.5, X = 2;
export const POST_M = (W * X) / (W * W + SIG * SIG), POST_V = (SIG * SIG) / (W * W + SIG * SIG);
export const LOGPX = -0.5 * Math.log(2 * Math.PI * (W * W + SIG * SIG)) - (X * X) / (2 * (W * W + SIG * SIG));

/** ELBO of q = N(m, s^2) in closed form. */
export function elbo(m: number, s: number) {
  const lik = -0.5 * Math.log(2 * Math.PI * SIG * SIG) - ((X - W * m) ** 2 + W * W * s * s) / (2 * SIG * SIG);
  const prior = -0.5 * Math.log(2 * Math.PI) - (m * m + s * s) / 2;
  const ent = 0.5 * Math.log(2 * Math.PI * Math.E * s * s);
  return lik + prior + ent;
}

/** KL(N(m, s^2) || N(POST_M, POST_V)). */
export const klPost = (m: number, s: number) => Math.log(Math.sqrt(POST_V) / s) + (s * s + (m - POST_M) ** 2) / (2 * POST_V) - 0.5;

const SHIFTS = [-0.6, -0.3, 0, 0.3], RATIOS = [0.5, 1, 2];
const pdf = (z: number, m: number, v: number) => Math.exp(-((z - m) ** 2) / (2 * v)) / Math.sqrt(2 * Math.PI * v);

export function ElboGapViz() {
  const [si, setSi] = useState(1), [ri, setRi] = useState(2);
  const m = POST_M + SHIFTS[si], s = Math.sqrt(POST_V) * RATIOS[ri];
  const e = elbo(m, s), gap = klPost(m, s);
  const Wd = 330, H = 170, X0 = 10, PW = Wd - 20, Y0 = 8, PH = H - Y0 - 30, ZL = -2.5, ZH = 3, YM = 1.6;
  const sx = (z: number) => X0 + ((z - ZL) / (ZH - ZL)) * PW, sy = (y: number) => Y0 + PH - (Math.min(y, YM) / YM) * PH;
  const grid = Array.from({ length: 301 }, (_, i) => ZL + (i * (ZH - ZL)) / 300);
  const curve = (f: (z: number) => number) => grid.map((z, i) => `${i ? "L" : "M"}${sx(z).toFixed(1)},${sy(f(z)).toFixed(1)}`).join(" ");
  const bar = (v: number) => Math.max(0, (v / 6) * 100);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">shift of q&apos;s mean</span>
        <div className="segmented" role="group" aria-label="Shift of the mean of q">
          {SHIFTS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}>{v > 0 ? `+${v}` : v}</button>)}
        </div>
        <span className="viz-label">width of q</span>
        <div className="segmented" role="group" aria-label="Width of q relative to the posterior">
          {RATIOS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={ri === i} onClick={() => setRi(i)}>{`${v}×`}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${Wd} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Prior, posterior and approximate posterior">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border-strong)" />
        <path d={curve((z) => pdf(z, 0, 1))} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" strokeWidth={1.5} />
        <path d={curve((z) => pdf(z, POST_M, POST_V))} fill="none" stroke="var(--success)" strokeWidth={2} />
        <path d={curve((z) => pdf(z, m, s * s))} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {[-2, -1, 0, 1, 2, 3].map((t) => <text key={t} x={sx(t)} y={Y0 + PH + 16} textAnchor="middle" className="viz-label">{t}</text>)}
        <text x={X0 + PW / 2} y={H - 2} textAnchor="middle" className="viz-label">latent z</text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--text-muted)" }}>●</span> prior p(z) (dashed)</span>
        <span><span style={{ color: "var(--success)" }}>●</span> true posterior p(z | x)</span>
        <span><span style={{ color: "var(--accent)" }}>●</span> approximation q(z)</span>
      </div>
      <div style={{ maxWidth: 360, margin: "8px auto 0", fontSize: 13 }}>
        <div style={{ display: "flex", height: 14, border: "1px solid var(--border)", borderRadius: 3, overflow: "hidden" }} aria-hidden="true">
          <div style={{ width: `${bar(gap)}%`, background: "var(--danger)" }} />
        </div>
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`log p(x) = ${LOGPX.toFixed(3)} = ELBO ${e.toFixed(3)} + gap ${gap.toFixed(3)}`}
      </div>
      <figcaption className="viz-caption">
        For a model whose posterior is known exactly, the log-likelihood splits into the ELBO and a gap equal to the KL
        divergence from q to the true posterior (the red bar, on a scale of 6 nats). Only q = posterior closes the gap. A q
        twice as wide costs 0.81 nats, half as wide 0.32: the KL divergence penalises spreading mass where the posterior has
        none more than missing some of it. Shifting the mean by 0.6, six-tenths of the prior&apos;s width, costs 1.80 nats.
      </figcaption>
    </figure>
  );
}
