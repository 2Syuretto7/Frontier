"use client";

import { useEffect, useState } from "react";
import { mse, polyFit, sineData } from "./ml";

const N = 30, MAXD = 10, DELTA = 0.01;

export function costs(xs: number[], ys: number[]) {
  return Array.from({ length: MAXD + 1 }, (_, d) => {
    const f = polyFit(xs, ys, d, 0, 1);
    const m = mse(f, xs, ys);
    const data = 0.5 * N * Math.log2(2 * Math.PI * Math.E * m) + N * Math.log2(1 / DELTA);
    const model = 0.5 * (d + 1) * Math.log2(N);
    return { f, data, model };
  });
}

/** Two-part code length for polynomial fits: parameter bits grow with degree, residual bits shrink. */
export function MdlPolyViz() {
  const [deg, setDeg] = useState(3);
  const [st, setSt] = useState<{ xs: number[]; ys: number[]; c: ReturnType<typeof costs> } | null>(null);
  useEffect(() => {
    const { xs, ys } = sineData(11, N, 0.25);
    setSt({ xs, ys, c: costs(xs, ys) });
  }, []);
  const W = 330, H = 150, X0 = 20;
  const sx = (x: number) => X0 + x * (W - 40);
  const sy = (y: number) => H / 2 - y * 45;
  const best = st ? st.c.reduce((b, v, d) => (v.data + v.model < st.c[b].data + st.c[b].model ? d : b), 0) : 0;
  const base = st ? Math.min(...st.c.map((v) => v.data)) : 0;
  const top = st ? Math.max(...st.c.map((v) => v.data - base + v.model)) : 1;
  const BH = 120, bw = (W - 40) / (MAXD + 1);
  const cur = st?.c[deg];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          degree {deg}
          <input type="range" min={0} max={MAXD} value={deg} onChange={(e) => setDeg(Number(e.target.value))} aria-label="polynomial degree" style={{ width: 140 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Noisy points with the fitted polynomial of the chosen degree">
        {st && st.xs.map((x, i) => <circle key={i} cx={sx(x)} cy={sy(st.ys[i])} r={2.5} fill="var(--text-muted)" />)}
        {cur && (
          <polyline fill="none" stroke="var(--accent)" strokeWidth={2}
            points={Array.from({ length: 101 }, (_, i) => i / 100).map((x) => `${sx(x)},${Math.max(2, Math.min(H - 2, sy(cur.f(x))))}`).join(" ")} />
        )}
      </svg>
      <svg viewBox={`0 0 ${W} ${BH + 20}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Bits for the parameters and for the residuals at each degree">
        {st && st.c.map((v, d) => {
          const hd = ((v.data - base) / top) * BH, hm = (v.model / top) * BH;
          return (
            <g key={d} opacity={d === deg ? 1 : 0.55}>
              <rect x={X0 + d * bw + 2} y={BH - hd} width={bw - 4} height={hd} fill="var(--accent)" />
              <rect x={X0 + d * bw + 2} y={BH - hd - hm} width={bw - 4} height={hm} fill="var(--text-muted)" />
              <text x={X0 + d * bw + bw / 2} y={BH + 13} textAnchor="middle" className="viz-label" fill={d === best ? "var(--danger)" : undefined}>{d}</text>
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {cur ? `model ${cur.model.toFixed(1)} + data ${cur.data.toFixed(1)} = ${(cur.model + cur.data).toFixed(1)} bits; shortest at degree ${best}` : "computing"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Thirty noisy samples of a sine wave. Each bar is the two-part code length at one degree: grey for the parameters,
        at ½ log₂ 30 bits each, and colour for the residual bits (coded to precision 0.01) beyond those of the most
        flexible fit. Raising the degree always shrinks the residual bits, but past the shortest total (degree marked in red) the saving no longer pays for the extra
        parameters.
      </figcaption>
    </figure>
  );
}
