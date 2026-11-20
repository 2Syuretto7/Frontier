"use client";

import { useMemo, useState } from "react";
import { lrAt } from "./WsdViz";

const T = 10000, LAM = 0.999;
const BASE = { web: 0.85, math: 0.05 };
const HQ = { web: 0.4, math: 0.3 };
const DOMAINS = [
  { key: "web" as const, L0: 2.2, A: 8, C: 5e-5, colour: "var(--accent)", label: "web text" },
  { key: "math" as const, L0: 1.6, A: 9, C: 4e-5, colour: "var(--code-function)", label: "mathematics" },
];

/** Loss per domain along a WSD run whose decay phase uses either the base mixture or a high-quality one. */
export function domainCurves(hq: boolean, frac: number) {
  const lrs = Array.from({ length: T }, (_, s) => lrAt(s, T, "sqrt", frac));
  const start = T - Math.floor(frac * T);
  return DOMAINS.map((d) => {
    const g = hq ? Math.pow(HQ[d.key] / BASE[d.key], 0.3) : 1;
    let s1 = 0, m = 0, s2 = 0;
    return lrs.map((lr, i) => {
      s1 += lr;
      if (i > 0 && i > 500) { m = LAM * m + (lrs[i - 1] - lr); s2 += m * (i >= start ? g : 1); }
      return d.L0 + d.A * Math.pow(s1, -0.4) - d.C * s2;
    });
  });
}

export function AnnealMixViz() {
  const [hq, setHq] = useState(true);
  const [frac, setFrac] = useState(0.2);
  const curves = useMemo(() => domainCurves(hq, frac), [hq, frac]);
  const plain = useMemo(() => domainCurves(false, frac), [frac]);
  const W = 330, H = 220, X0 = 40, PW = 280, XS = 5000, PH = 70, TOPS = [8, 98];
  const px = (st: number) => X0 + ((st - XS) / (T - XS)) * PW;
  const range = (k: number) => {
    const lo = Math.min(curves[k][T - 1], plain[k][T - 1]) - 0.01;
    return [lo, lo + 0.12] as const;
  };
  const py = (k: number, v: number) => {
    const [lo, hi] = range(k);
    return TOPS[k] + PH - ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * PH;
  };
  const line = (k: number, ys: number[]) => ys.map((v, i) => [i, v] as const).filter(([i]) => i >= XS && (i % 25 === 0 || i === T - 1)).map(([i, v]) => `${px(i).toFixed(1)},${py(k, v).toFixed(1)}`).join(" ");
  const start = T - Math.floor(frac * T);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Data in the decay phase">
          {[false, true].map((h) => (
            <button key={String(h)} className="seg" aria-pressed={hq === h} onClick={() => setHq(h)}>{h ? "high-quality mix" : "same mix"}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Decay fraction">
          {[0.1, 0.2].map((f) => (
            <button key={f} className="seg" aria-pressed={frac === f} onClick={() => setFrac(f)}>decay {f * 100}%</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Loss on web text and mathematics during training">
        {DOMAINS.map((d, k) => {
          const [lo, hi] = range(k);
          return (
            <g key={d.key}>
              <rect x={px(start)} y={TOPS[k]} width={px(T) - px(start)} height={PH} style={{ fill: "var(--surface)" }} stroke="var(--border)" strokeWidth={0.5} />
              <line x1={X0} x2={X0 + PW} y1={TOPS[k] + PH} y2={TOPS[k] + PH} stroke="var(--border)" strokeWidth={0.5} />
              <text x={X0 - 4} y={TOPS[k] + 8} textAnchor="end" className="viz-label">{hi.toFixed(2)}</text>
              <text x={X0 - 4} y={TOPS[k] + PH} textAnchor="end" className="viz-label">{lo.toFixed(2)}</text>
              {hq && <polyline points={line(k, plain[k])} fill="none" stroke={d.colour} strokeDasharray="4 3" strokeWidth={1} />}
              <polyline points={line(k, curves[k])} fill="none" stroke={d.colour} strokeWidth={2} />
              <text x={X0 + 4} y={TOPS[k] + 10} className="viz-label" style={{ fill: d.colour }}>{d.label} loss</text>
              <text x={px(start) + 3} y={TOPS[k] + 10} className="viz-label">decay</text>
            </g>
          );
        })}
        <text x={X0} y={H - 16} className="viz-label">steps 5,000 to 10,000</text>
        <text x={X0} y={H - 4} className="viz-label">dashed: decay on the same mixture</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        final loss: web {curves[0][T - 1].toFixed(3)}, mathematics {curves[1][T - 1].toFixed(3)}
        {hq ? ` (same mix: ${plain[0][T - 1].toFixed(3)}, ${plain[1][T - 1].toFixed(3)})` : ""}
      </div>
      <figcaption className="viz-caption">
        A warmup-stable-decay run whose decay phase either keeps the pretraining mixture or switches to one with six times as
        much mathematics and less web text. The decay lowers both losses, but where the switch puts more weight, the gain is
        larger, at a small cost on the domains it takes weight from. The numbers come from the annealing law of l8.5.3 with each
        domain&apos;s annealing gain scaled by how much more of its data the decay sees.
      </figcaption>
    </figure>
  );
}
