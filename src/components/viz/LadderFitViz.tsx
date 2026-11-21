"use client";

import { useState } from "react";

const XS = [3e16, 1e17, 3e17, 1e18, 3e18];
const YS = [3.21, 2.98, 2.79, 2.63, 2.5];
const MAIN = 3e19;

function fit(E: number) {
  const u = XS.map(Math.log),
    v = YS.map((y) => Math.log(y - E));
  const mu = u.reduce((a, b) => a + b) / u.length,
    mv = v.reduce((a, b) => a + b) / v.length;
  let num = 0,
    den = 0;
  u.forEach((p, i) => {
    num += (p - mu) * (v[i] - mv);
    den += (p - mu) ** 2;
  });
  const slope = num / den;
  const a = Math.exp(mv - slope * mu);
  const pred = (x: number) => E + a * x ** slope;
  const sse = XS.reduce(
    (s, x, i) => s + (Math.log(YS[i] - E) - Math.log(a * x ** slope)) ** 2,
    0,
  );
  return { pred, b: -slope, sse };
}

export function LadderFitViz() {
  const [E, setE] = useState(1.5);
  const { pred, b, sse } = fit(E);
  const W = 340,
    H = 200,
    x0 = 40,
    x1 = W - 12,
    y0 = 10,
    y1 = H - 30;
  const lx0 = Math.log10(1e16),
    lx1 = Math.log10(1e20);
  const X = (c: number) =>
    x0 + ((Math.log10(c) - lx0) / (lx1 - lx0)) * (x1 - x0);
  const lo = 2.0,
    hi = 3.4;
  const Y = (l: number) => y1 - ((l - lo) / (hi - lo)) * (y1 - y0);
  const curve = Array.from(
    { length: 81 },
    (_, i) => 10 ** (lx0 + (i / 80) * (lx1 - lx0)),
  )
    .map(
      (c, i) => `${i ? "L" : "M"}${X(c).toFixed(1)},${Y(pred(c)).toFixed(1)}`,
    )
    .join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <label className="viz-label">
          irreducible loss E: {E.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={2.4}
            step={0.05}
            value={E}
            onChange={(e) => setE(+e.target.value)}
          />
        </label>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Ladder losses against compute with a fitted power law extrapolated to the main run"
      >
        {[2.2, 2.6, 3.0, 3.4].map((v) => (
          <g key={v}>
            <line
              x1={x0}
              x2={x1}
              y1={Y(v)}
              y2={Y(v)}
              stroke="var(--grid-line)"
            />
            <text
              x={x0 - 6}
              y={Y(v) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        {[16, 17, 18, 19, 20].map((e) => (
          <text
            key={e}
            x={X(10 ** e)}
            y={y1 + 16}
            textAnchor={e === 20 ? "end" : "middle"}
            className="viz-label"
          >
            1e{e}
          </text>
        ))}
        <path d={curve} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {XS.map((x, i) => (
          <circle key={i} cx={X(x)} cy={Y(YS[i])} r={4} fill="var(--text)" />
        ))}
        <line
          x1={X(MAIN)}
          x2={X(MAIN)}
          y1={y0}
          y2={y1}
          stroke="var(--text-muted)"
          strokeDasharray="4 3"
        />
        <circle cx={X(MAIN)} cy={Y(pred(MAIN))} r={5} fill="var(--success)" />
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        exponent {b.toFixed(3)}; fit error {sse.toExponential(1)}; predicted
        main-run loss {pred(MAIN).toFixed(3)}
      </p>
      <figcaption className="viz-caption">
        Five ladder runs (dots) and a power law L = E + aC^(−b) fitted to them
        for the chosen E. Several values of E fit the five points almost equally
        well yet extrapolate to different losses at the main run&apos;s compute
        (dashed line), which is why ladders should span as wide a range as the
        budget allows and report the prediction with that uncertainty.
      </figcaption>
    </figure>
  );
}
