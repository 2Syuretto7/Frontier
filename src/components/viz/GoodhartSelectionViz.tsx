"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const NOISE = ["light-tailed error", "heavy-tailed error"];
const FRACS = [0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001, 0.0005, 0.0002, 0.0001];
const PICK = [2, 5, 8, 11];
const N = 200000;

/**
 * True value V ~ N(0, 1) and proxy U = V + X, with error X ~ N(0, 1) (light-tailed) or 0.7·t with 2 degrees of freedom
 * (heavy-tailed). Ranks N candidates by the proxy and returns, for each top fraction in FRACS, the mean proxy and mean true
 * value of the selected candidates.
 */
export function goodhartCurve(noise: number, seed = 14) {
  const r = rand(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const v = new Float64Array(N), u = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    v[i] = gauss();
    const x = noise === 0 ? gauss() : (0.7 * gauss()) / Math.sqrt(-Math.log(1 - r()));
    u[i] = v[i] + x;
  }
  const idx = Array.from({ length: N }, (_, i) => i).sort((a, b) => u[b] - u[a]);
  return FRACS.map((f) => {
    const m = Math.max(1, Math.round(N * f));
    let su = 0, sv = 0;
    for (let k = 0; k < m; k++) { su += u[idx[k]]; sv += v[idx[k]]; }
    return { f, proxy: su / m, truth: sv / m };
  });
}

export function GoodhartSelectionViz() {
  const [noise, setNoise] = useState(1);
  const [p, setP] = useState(2);
  const curves = useMemo(() => [goodhartCurve(0), goodhartCurve(1)], []);
  const W = 330, H = 190, X0 = 30, PW = 288, Y0 = 10, PH = 140, YMAX = 3.2;
  const px = (i: number) => X0 + (i / (FRACS.length - 1)) * PW;
  const py = (y: number) => Y0 + PH - ((Math.max(-0.5, y) + 0.5) / (YMAX + 0.5)) * PH;
  const line = (c: { truth: number }[]) => c.map((d, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(d.truth).toFixed(1)}`).join(" ");
  const sel = curves[noise][PICK[p]];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Proxy error">
          {NOISE.map((name, i) => <button key={name} type="button" className="seg" aria-pressed={noise === i} onClick={() => setNoise(i)}>{name}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Selection">
          {PICK.map((k, i) => <button key={k} type="button" className="seg" aria-pressed={p === i} onClick={() => setP(i)}>top {FRACS[k] * 100}%</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Mean true value of candidates selected by a proxy">
        {[0, 1, 2, 3].map((y) => (
          <g key={y}>
            <line x1={X0} x2={X0 + PW} y1={py(y)} y2={py(y)} stroke="var(--border)" strokeDasharray={y ? "2 3" : undefined} />
            <text x={X0 - 4} y={py(y) + 4} textAnchor="end" className="viz-label">{y}</text>
          </g>
        ))}
        {curves.map((c, i) => <path key={i} d={line(c)} fill="none" stroke={i === noise ? "var(--accent)" : "var(--text-muted)"} strokeWidth={i === noise ? 2 : 1.2} />)}
        <circle cx={px(PICK[p])} cy={py(sel.truth)} r={4} style={{ fill: "var(--accent)" }} />
        <text x={X0} y={Y0 + PH + 13} className="viz-label">top 50%</text>
        <text x={X0 + PW} y={Y0 + PH + 13} textAnchor="end" className="viz-label">top 0.01%</text>
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">stronger selection on the proxy, to the right</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        selected by proxy: mean proxy {sel.proxy.toFixed(2)}, mean true value {sel.truth.toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        Two hundred thousand candidates, each with a true value and a proxy equal to the true value plus an error. The curves show
        the mean true value of the candidates with the highest proxy scores, as selection gets stricter. With light-tailed error the
        true value keeps rising, though more slowly than the proxy. With heavy-tailed error the very top of the proxy is taken over
        by candidates whose error is huge, and the true value falls back towards the average.
      </figcaption>
    </figure>
  );
}
