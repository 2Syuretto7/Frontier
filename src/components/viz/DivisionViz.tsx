"use client";

import { useState } from "react";

const X0 = 30, X1 = 600;

/** The division algorithm via well-ordering: the remainder is the least element of {n − qd : q ≥ 0} ∩ ℕ. */
export function DivisionViz() {
  const [n, setN] = useState(47);
  const [d, setD] = useState(9);
  const X = (v: number) => X0 + (v / n) * (X1 - X0);
  const S = Array.from({ length: Math.floor(n / d) + 1 }, (_, q) => n - q * d);
  const r = S[S.length - 1], q = S.length - 1;

  return (
    <figure className="viz">
      <svg viewBox="0 0 620 150" role="img" aria-label={`The set of n − qd that are at least 0, with least element ${r}`}>
        <line x1={X0} x2={X1} y1={80} y2={80} className="viz-axis" />
        <text x={X(0)} y={104} textAnchor="middle" className="plot-tick">0</text>
        {S.map((v, i) => (
          <g key={v}>
            {i > 0 && <path d={`M${X(S[i - 1])} 70 Q ${(X(S[i - 1]) + X(v)) / 2} ${70 - 26} ${X(v)} 70`} className="plot-ghost" fill="none" />}
            <circle cx={X(v)} cy={80} r={i === S.length - 1 ? 7 : 5} className={i === S.length - 1 ? "plot-hot" : "plot-point"} />
            {(S.length <= 14 || i === 0 || i === S.length - 1) && <text x={X(v)} y={i === S.length - 1 ? 128 : S.length > 14 || i % 2 === 0 ? 60 : 104} textAnchor="middle" className={i === S.length - 1 ? "viz-label" : "plot-tick"} style={i === S.length - 1 ? { fill: "var(--danger)", fontWeight: 600 } : undefined}>{v}</text>}
          </g>
        ))}
        <text x={Math.min(X(n - d / 2), 575)} y={30} textAnchor="middle" className="plot-tick">subtract {d}</text>
      </svg>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        <label className="viz-stepper-label" style={{ flex: 1, minWidth: 200 }}>
          n = <span className="mono">{n}</span>
          <input type="range" className="viz-range" min={1} max={120} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} />
        </label>
        <label className="viz-stepper-label" style={{ flex: 1, minWidth: 200 }}>
          d = <span className="mono">{d}</span>
          <input type="range" className="viz-range" min={1} max={30} step={1} value={d} onChange={(e) => setD(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Subtract {d} from {n} again and again, keeping only results that are not negative. The set{" "}
        <span className="mono">{"{"}{S.join(", ")}{"}"}</span> is a non-empty set of natural numbers, so by well-ordering it has a
        least element, r = {r}. Then <span className="mono">{n} = {q} · {d} + {r}</span>, and r &lt; {d}, since otherwise r − {d}{" "}
        would be a smaller element.
      </figcaption>
    </figure>
  );
}
