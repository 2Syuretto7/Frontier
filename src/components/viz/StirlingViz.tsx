"use client";

import { useState } from "react";
import { logFactorial } from "./calc";

/** n! against Stirling's approximation √(2πn) (n/e)ⁿ: the ratio tends to 1, though both numbers explode. */
export function StirlingViz() {
  const [n, setN] = useState(10);
  const lf = logFactorial(n);
  const ls = 0.5 * Math.log(2 * Math.PI * n) + n * (Math.log(n) - 1);
  const sci = (logv: number) => { const e = Math.floor(logv / Math.LN10); return `${(10 ** (logv / Math.LN10 - e)).toFixed(4)} × 10^${e}`; };
  const rows = [1, 5, 10, 50, 100, 1000];
  return (
    <figure className="viz">
      <div className="viz-sliders" style={{ marginTop: 0 }}>
        <label>n = <span className="mono">{n}</span><input type="range" min={1} max={200} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} /></label>
      </div>
      <table className="table" style={{ marginTop: 12 }}>
        <tbody>
          <tr><td>n!</td><td className="mono">{n <= 20 ? Math.round(Math.exp(lf)).toLocaleString("en-IN") : sci(lf)}</td></tr>
          <tr><td>√(2πn) (n/e)ⁿ</td><td className="mono">{sci(ls)}</td></tr>
          <tr><td>ratio n! ÷ Stirling</td><td className="mono">{Math.exp(lf - ls).toFixed(6)}</td></tr>
          <tr><td>1 + 1/(12n)</td><td className="mono">{(1 + 1 / (12 * n)).toFixed(6)}</td></tr>
        </tbody>
      </table>
      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead><tr><th>n</th><th>ln n!</th><th>n ln n − n</th><th>relative gap</th></tr></thead>
          <tbody>{rows.map((m) => { const a = logFactorial(m), b = m * Math.log(m) - m; return <tr key={m}><td>{m}</td><td className="mono">{a.toFixed(2)}</td><td className="mono">{b.toFixed(2)}</td><td className="mono">{m === 1 ? "—" : ((a - b) / a).toFixed(4)}</td></tr>; })}</tbody>
        </table>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The two numbers grow beyond anything a calculator holds, yet their ratio closes in on 1, and the error is about 1/(12n).
        On a log scale the cruder approximation ln n! ≈ n ln n − n is already close in relative terms; it is the one used in
        counting arguments and in entropy.
      </figcaption>
    </figure>
  );
}
