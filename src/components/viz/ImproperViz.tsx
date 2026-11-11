"use client";

import { useState } from "react";
import { areaPath } from "./calc";
import { fmtNum } from "./format";
import { Axes, curvePath, type View } from "./Plot";

const V: View = { xmin: 0, xmax: 10, ymin: 0, ymax: 1.6, w: 520, h: 240 };
const PS = [0.5, 1, 2];

/** ∫₁^R x^(−p) dx as R grows: it settles for p > 1 and grows without bound for p ≤ 1. */
export function ImproperViz() {
  const [p, setP] = useState(2);
  const [e, setE] = useState(1);
  const R = 10 ** e;
  const f = (x: number) => x ** -p;
  const area = p === 1 ? Math.log(R) : (R ** (1 - p) - 1) / (1 - p);
  const limit = p > 1 ? 1 / (p - 1) : Infinity;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Exponent">
        {PS.map((q) => <button key={q} type="button" className={q === p ? "btn btn-primary" : "btn"} aria-pressed={q === p} onClick={() => setP(q)}><span className="mono">1 / x^{q}</span></button>)}
      </div>
      <Axes v={V} label={`The area under 1 over x to the ${p} from 1 to ${fmtNum(R)}`}>
        <path d={areaPath(V, f, 1, Math.min(R, 10.5))} className="viz-region" />
        <path d={curvePath(V, f, 400)} className="plot-curve" />
      </Axes>
      <div className="viz-sliders">
        <label>Right end R = <span className="mono">{R < 1000 ? fmtNum(Number(R.toPrecision(3))) : R.toExponential(1)}</span><input type="range" min={0.3} max={9} step={0.05} value={e} onChange={(ev) => setE(Number(ev.target.value))} /></label>
      </div>
      <table className="table" style={{ marginTop: 12 }}>
        <tbody>
          <tr><td>area from 1 to R</td><td className="mono">{area.toFixed(4)}</td></tr>
          <tr><td>limit as R → ∞</td><td className="mono">{Number.isFinite(limit) ? fmtNum(limit) : "none: the area grows without bound"}</td></tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        The picture shows the first stretch of the region; the slider pushes R as far as a billion. {p > 1 ? `For p = ${p} the tail is thin enough that the total area settles on ${fmtNum(limit)}.` : p === 1 ? "For p = 1 the area is ln R. It grows ever more slowly, but without bound: each tenfold increase in R adds the same amount, ln 10 ≈ 2.303." : "For p = 1/2 the area is 2√R − 2, which grows without bound."}
      </figcaption>
    </figure>
  );
}
