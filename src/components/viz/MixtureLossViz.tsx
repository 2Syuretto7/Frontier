"use client";

import { useState } from "react";

const B = 1e11, ALPHA = 0.3;
const DOMAINS = { web: { E: 2.0, k: 600 }, code: { E: 0.9, k: 250 } };
const TARGETS: [string, number][] = [["mostly prose", 0.1], ["balanced", 0.3], ["mostly code", 0.6]];

/** Illustrative per-domain validation loss when a share w of the B training tokens comes from that domain. */
export function domainLoss(d: keyof typeof DOMAINS, w: number) {
  const { E, k } = DOMAINS[d];
  return E + k * (w * B) ** -ALPHA;
}

export function MixtureLossViz() {
  const [ti, setTi] = useState(1);
  const t = TARGETS[ti][1];
  const xs = Array.from({ length: 95 }, (_, i) => 0.03 + (i / 94) * 0.92);
  const lw = xs.map((x) => domainLoss("web", 1 - x)), lc = xs.map((x) => domainLoss("code", x));
  const lt = xs.map((_, i) => (1 - t) * lw[i] + t * lc[i]);
  const best = lt.indexOf(Math.min(...lt));
  const W = 330, X0 = 30, Y0 = 8, PW = 288, PH = 130, LO = 1.0, HI = 2.8;
  const x = (v: number) => X0 + v * PW;
  const y = (l: number) => Y0 + PH - ((Math.min(l, HI) - LO) / (HI - LO)) * PH;
  const line = (ls: number[]) => xs.map((v, i) => `${x(v)},${y(ls[i])}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">target use</span>
        <div className="segmented" role="group" aria-label="Target distribution">
          {TARGETS.map(([n], j) => <button key={n} type="button" className="seg" aria-pressed={ti === j} onClick={() => setTi(j)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + PH + 18}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Validation losses against the share of code in the mixture">
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border)" />
        <polyline points={line(lw)} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} />
        <polyline points={line(lc)} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeDasharray="5 3" />
        <polyline points={line(lt)} fill="none" stroke="var(--accent)" strokeWidth={2.2} />
        <circle cx={x(xs[best])} cy={y(lt[best])} r={4} style={{ fill: "var(--accent)" }} />
        <text x={x(0.05)} y={y(lw[0]) - 6} className="viz-label">prose loss</text>
        <text x={x(0.95)} y={y(lc[94]) - 6} textAnchor="end" className="viz-label">code loss</text>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => <text key={v} x={x(v)} y={Y0 + PH + 13} textAnchor="middle" className="viz-label">{v}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        target {Math.round((1 - t) * 100)}% prose, {Math.round(t * 100)}% code: best share of code in training ≈ {xs[best].toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        Illustrative validation losses on prose (solid grey) and code (dashed) as the share of code in a fixed training budget varies
        along the horizontal axis, and their average weighted by how the model will be used (colour). Each domain&apos;s loss falls as
        it gets more data, with diminishing returns, so the best mixture depends on how fast each loss falls as well as on the
        target.
      </figcaption>
    </figure>
  );
}
