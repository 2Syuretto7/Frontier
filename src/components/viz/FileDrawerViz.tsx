"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const EFFECTS = [0, 0.1, 0.25];
const SES = [0.15, 0.08, 0.04];
const N = 300;

/** N simulated studies of a true effect, each estimating it with normal noise of the given standard error; significance is two-sided at 5%. */
export function studies(effect: number, se: number, seed = 11) {
  const r = rand(seed);
  const ests = Array.from({ length: N }, () => {
    const u = Math.max(1e-12, r()), v = r();
    return effect + se * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  });
  const sig = ests.filter((e) => Math.abs(e / se) > 1.959964);
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  return { ests, sig: sig.length, all: mean(ests), pub: sig.length ? mean(sig) : NaN };
}

export function FileDrawerViz() {
  const [e, setE] = useState(1);
  const [s, setS] = useState(0);
  const effect = EFFECTS[e], se = SES[s];
  const { ests, sig, all, pub } = studies(effect, se);
  const W = 330, H = 170, X0 = 14, PW = 302, Y0 = 8, PH = 126, LO = -0.5, HI = 0.7, BINS = 48;
  const px = (x: number) => X0 + ((x - LO) / (HI - LO)) * PW;
  const bw = (HI - LO) / BINS;
  const counts = Array.from({ length: BINS }, () => [0, 0]);
  for (const x of ests) {
    const b = Math.floor((x - LO) / bw);
    if (b >= 0 && b < BINS) counts[b][Math.abs(x / se) > 1.959964 ? 1 : 0]++;
  }
  const maxC = Math.max(...counts.map((c) => c[0] + c[1]));
  const bh = (c: number) => (c / maxC) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="True effect">
          {EFFECTS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={e === i} onClick={() => setE(i)}>effect {v}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Standard error of each study">
          {SES.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={s === i} onClick={() => setS(i)}>error {v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of study estimates, with the significant ones highlighted">
        {counts.map((c, i) => {
          const x = X0 + i * (PW / BINS), w = PW / BINS - 0.6;
          return (
            <g key={i}>
              <rect x={x} y={Y0 + PH - bh(c[0])} width={w} height={bh(c[0])} style={{ fill: "var(--border-strong)" }} />
              <rect x={x} y={Y0 + PH - bh(c[0]) - bh(c[1])} width={w} height={bh(c[1])} style={{ fill: "var(--accent)" }} />
            </g>
          );
        })}
        <line x1={px(effect)} x2={px(effect)} y1={Y0} y2={Y0 + PH} stroke="var(--text)" strokeWidth={1.5} />
        {sig > 0 && <line x1={px(pub)} x2={px(pub)} y1={Y0} y2={Y0 + PH} stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="4 3" />}
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border-strong)" />
        {[-0.4, -0.2, 0, 0.2, 0.4, 0.6].map((x) => <text key={x} x={px(x)} y={Y0 + PH + 13} textAnchor="middle" className="viz-label">{x}</text>)}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">estimate; solid: true effect, dashed: mean of significant</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        significant: {sig} of {N}; mean of all {all.toFixed(3)}; mean of significant {sig ? pub.toFixed(3) : "none"}
      </div>
      <figcaption className="viz-caption">
        Three hundred simulated studies of the same true effect, each with noise of the chosen standard error. Coloured studies reached
        significance at 5%. If only those are reported, the reported effects are inflated when the studies are noisy, and with no true
        effect the reported ones are pure noise of both signs. Averaging every study, significant or not, recovers the true effect.
      </figcaption>
    </figure>
  );
}
