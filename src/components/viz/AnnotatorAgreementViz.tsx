"use client";

import { useMemo, useState } from "react";

const sig = (x: number) => 1 / (1 + Math.exp(-x));

/** Density of the true reward gap between the two responses in a pair. */
function gapDensity(d: number, kind: "random" | "close") {
  const scale = kind === "random" ? 1.5 : 0.4;
  return Math.exp(-d / scale) / scale;
}

/** Average over pairs of: the chance one annotator picks the better response, and the chance two annotators agree. */
export function averages(tau: number, kind: "random" | "close") {
  let w = 0, acc = 0, agree = 0;
  for (let d = 0.005; d < 12; d += 0.01) {
    const p = sig(d / tau), dens = gapDensity(d, kind);
    w += dens; acc += dens * p; agree += dens * (p * p + (1 - p) * (1 - p));
  }
  return { acc: acc / w, agree: agree / w };
}

export function AnnotatorAgreementViz() {
  const [tau, setTau] = useState(1);
  const [kind, setKind] = useState<"random" | "close">("random");
  const avg = useMemo(() => averages(tau, kind), [tau, kind]);
  const W = 330, H = 216, X0 = 34, PW = 286, Y0 = 8, PH = 160, DMAX = 4;
  const px = (d: number) => X0 + (d / DMAX) * PW;
  const py = (v: number) => Y0 + PH - v * PH;
  const ds = Array.from({ length: 81 }, (_, i) => (i * DMAX) / 80);
  const densMax = gapDensity(0, kind);
  const area = `${px(0)},${py(0)} ` + ds.map((d) => `${px(d).toFixed(1)},${py((0.45 * gapDensity(d, kind)) / densMax).toFixed(1)}`).join(" ") + ` ${px(DMAX)},${py(0)}`;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Annotator noise">
          {[0.5, 1, 2].map((t) => (
            <button key={t} className="seg" aria-pressed={tau === t} onClick={() => setTau(t)}>noise {t}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="How pairs are chosen">
          {(["random", "close"] as const).map((k) => (
            <button key={k} className="seg" aria-pressed={kind === k} onClick={() => setKind(k)}>{k === "random" ? "varied pairs" : "close pairs"}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Annotator accuracy and agreement against the quality gap">
        <polygon points={area} style={{ fill: "var(--border)" }} opacity={0.6} />
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(v) + 3} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        <polyline points={ds.map((d) => `${px(d).toFixed(1)},${py(sig(d / tau)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <polyline points={ds.map((d) => { const p = sig(d / tau); return `${px(d).toFixed(1)},${py(p * p + (1 - p) * (1 - p)).toFixed(1)}`; }).join(" ")} fill="none" stroke="var(--code-function)" strokeWidth={2} strokeDasharray="5 3" />
        <text x={X0 + PW} y={py(0.36)} textAnchor="end" className="viz-label" style={{ fill: "var(--accent)" }}>solid: one annotator picks the better</text>
        <text x={X0 + PW} y={py(0.27)} textAnchor="end" className="viz-label" style={{ fill: "var(--code-function)" }}>dashed: two annotators agree</text>
        <text x={X0} y={H - 16} className="viz-label">true quality gap between the two responses, 0 to {DMAX}</text>
        <text x={X0} y={H - 4} className="viz-label">grey: how often pairs have each gap</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        over these pairs: an annotator picks the better response {(avg.acc * 100).toFixed(0)}% of the time; two annotators agree {(avg.agree * 100).toFixed(0)}%
      </div>
      <figcaption className="viz-caption">
        Annotators choose the better of two responses with a probability that grows with how different the responses are. When
        pairs are close in quality, which is where comparisons are most useful for a strong model, even careful annotators often
        disagree, and agreement between annotators is lower than each one&apos;s accuracy.
      </figcaption>
    </figure>
  );
}
