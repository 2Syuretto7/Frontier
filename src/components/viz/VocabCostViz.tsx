"use client";

import { useMemo, useState } from "react";

/** Illustrative compression curve: 1 byte per token at V = 256, about 4 at V = 50,000, never above 6. */
export const bytesPerToken = (V: number) => 6 - 5 * (256 / V) ** 0.1738;

const MODELS = [
  { label: "small (d 512, 25M)", d: 512, P: 25e6 },
  { label: "medium (d 2048, 1B)", d: 2048, P: 1e9 },
  { label: "large (d 8192, 70B)", d: 8192, P: 70e9 },
];

const LO = Math.log10(512), HI = Math.log10(2e6), K = 300;

/** FLOPs per byte of text, 2P + 2dV per token divided by bytes per token, on a log grid of vocabulary sizes. */
export function vocabCurve(d: number, P: number) {
  const pts = Array.from({ length: K }, (_, i) => {
    const V = Math.round(10 ** (LO + ((HI - LO) * i) / (K - 1)));
    return { V, cost: (2 * P + 2 * d * V) / bytesPerToken(V) };
  });
  const best = pts.reduce((a, b) => (b.cost < a.cost ? b : a));
  return { pts, best };
}

export function VocabCostViz() {
  const [mi, setMi] = useState(1);
  const { d, P } = MODELS[mi];
  const { pts, best } = useMemo(() => vocabCurve(d, P), [d, P]);
  const W = 320, H = 190, X1 = 34, PW = W - X1 - 8, PH = H - 34;
  const top = Math.max(...pts.map((p) => p.cost)), bot = best.cost;
  const ymax = Math.min(top, bot * 3);
  const sx = (V: number) => X1 + ((Math.log10(V) - LO) / (HI - LO)) * PW;
  const sy = (c: number) => 8 + (1 - (Math.min(c, ymax) - bot * 0.9) / (ymax - bot * 0.9)) * PH;
  const at32 = (2 * P + 2 * d * 32000) / bytesPerToken(32000);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {MODELS.map((m, i) => (
          <button key={m.label} type="button" className="seg" aria-pressed={mi === i} onClick={() => setMi(i)}>{m.label}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Compute per byte of text against vocabulary size">
        <line x1={X1} y1={8 + PH} x2={X1 + PW} y2={8 + PH} stroke="var(--border)" />
        <line x1={X1} y1={8} x2={X1} y2={8 + PH} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={pts.map((p) => `${sx(p.V)},${sy(p.cost)}`).join(" ")} />
        <circle cx={sx(best.V)} cy={sy(best.cost)} r={4} fill="var(--danger)" />
        {[1e3, 1e4, 1e5, 1e6].map((V) => (
          <text key={V} x={sx(V)} y={H - 10} textAnchor="middle" className="viz-label">{V >= 1e6 ? "1M" : `${V / 1e3}k`}</text>
        ))}
        <text x={X1 + 4} y={18} className="viz-label">compute per byte</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        <div>{`cheapest vocabulary ≈ ${best.V.toLocaleString("en-IN")} (${bytesPerToken(best.V).toFixed(2)} bytes per token)`}</div>
        <div>{`embedding share of parameters there ${((100 * d * best.V) / (P + d * best.V)).toFixed(1)}%; at 32,000 the cost is ${(100 * (at32 / best.cost - 1)).toFixed(1)}% higher`}</div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Compute to process one byte of text: each token costs about 2P FLOPs in the body of the model plus 2dV in the
        output layer, and a larger vocabulary packs more bytes into each token. The compression curve here is an
        illustrative fit (about 4 bytes per token at 50,000, levelling off towards 6), not a measurement. The cheapest
        vocabulary grows with the model, because the output layer is a smaller share of a large model&apos;s cost.
      </figcaption>
    </figure>
  );
}
