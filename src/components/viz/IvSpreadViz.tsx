"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

// U hidden; Z instrument; X = a Z + U + e1; Y = 1 * X + 2 U + e2; true effect 1
const STRENGTHS = [0.1, 0.3, 1];
const REPS = 300;
const N = 200;
const LO = -1,
  HI = 3,
  BINS = 40;

const gauss = (r: () => number) =>
  Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

/** OLS and IV (Wald) estimates over REPS simulated datasets of size N. */
export function estimates(a: number) {
  const r = rand(91);
  const ols: number[] = [],
    iv: number[] = [];
  for (let k = 0; k < REPS; k++) {
    let sz = 0,
      sx = 0,
      sy = 0,
      szx = 0,
      szy = 0,
      sxx = 0,
      sxy = 0;
    for (let i = 0; i < N; i++) {
      const u = gauss(r),
        z = gauss(r);
      const x = a * z + u + gauss(r);
      const y = x + 2 * u + gauss(r);
      sz += z;
      sx += x;
      sy += y;
      szx += z * x;
      szy += z * y;
      sxx += x * x;
      sxy += x * y;
    }
    const czx = szx - (sz * sx) / N,
      czy = szy - (sz * sy) / N;
    const vx = sxx - (sx * sx) / N,
      cxy = sxy - (sx * sy) / N;
    ols.push(cxy / vx);
    iv.push(czy / czx);
  }
  return { ols, iv };
}

const median = (v: number[]) => {
  const s = [...v].sort((p, q) => p - q);
  return s[Math.floor(s.length / 2)];
};

export function IvSpreadViz() {
  const [k, setK] = useState(2);
  const { ols, iv } = estimates(STRENGTHS[k]);
  const hist = (v: number[]) => {
    const h = new Array(BINS).fill(0);
    v.forEach((e) => {
      const b = Math.floor(((e - LO) / (HI - LO)) * BINS);
      if (b >= 0 && b < BINS) h[b]++;
    });
    return h;
  };
  const ho = hist(ols),
    hi = hist(iv);
  const top = Math.max(...ho, ...hi);
  const X = (e: number) => 20 + ((e - LO) / (HI - LO)) * 300;
  const bw = 300 / BINS;
  const outside = iv.filter((e) => e < LO || e > HI).length;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div
          className="segmented"
          role="group"
          aria-label="Instrument strength"
        >
          {STRENGTHS.map((v, j) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={k === j}
              onClick={() => setK(j)}
            >
              Z → X strength {v}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 340 190"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Histograms of least-squares and instrumental-variable estimates over many simulated datasets"
      >
        {ho.map((c, i) => (
          <rect
            key={`o${i}`}
            x={20 + i * bw}
            y={140 - (c / top) * 110}
            width={bw - 0.5}
            height={(c / top) * 110}
            fill="var(--danger)"
            fillOpacity={0.45}
          />
        ))}
        {hi.map((c, i) => (
          <rect
            key={`i${i}`}
            x={20 + i * bw}
            y={140 - (c / top) * 110}
            width={bw - 0.5}
            height={(c / top) * 110}
            fill="var(--accent)"
            fillOpacity={0.45}
          />
        ))}
        <line
          x1={20}
          y1={140}
          x2={320}
          y2={140}
          stroke="var(--border-strong)"
        />
        <line
          x1={X(1)}
          y1={20}
          x2={X(1)}
          y2={140}
          stroke="var(--success)"
          strokeDasharray="4 3"
        />
        {[-1, 0, 1, 2, 3].map((e) => (
          <text
            key={e}
            x={X(e)}
            y={154}
            textAnchor="middle"
            className="viz-label"
          >
            {e}
          </text>
        ))}
        <text x={20} y={172} className="viz-label" fill="var(--danger)">
          least squares: median {median(ols).toFixed(2)}
        </text>
        <text x={20} y={186} className="viz-label">
          instrument: median {median(iv).toFixed(2)}, {outside} of {REPS} off
          the scale
        </text>
      </svg>
      <figcaption className="viz-caption">
        {REPS} simulated studies of {N} people each. A hidden U raises both X
        and Y, and the true effect of X on Y is 1 (dashed). Least squares (red)
        is precise but centred in the wrong place. The instrumental-variable
        estimate (colour) is centred near 1 when Z moves X strongly, and spreads
        out wildly as the instrument gets weak.
      </figcaption>
    </figure>
  );
}
