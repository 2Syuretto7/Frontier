"use client";

import { useState } from "react";
import { Axes, curvePath, scales, type View } from "./Plot";

const V: View = { xmin: 0, xmax: Math.PI, ymin: -0.1, ymax: 1.2, w: 520, h: 240 };
type Rule = "left" | "midpoint" | "trapezoid" | "simpson";
const RULES: Rule[] = ["left", "midpoint", "trapezoid", "simpson"];

function rule(r: Rule, f: (x: number) => number, a: number, b: number, n: number) {
  const h = (b - a) / n;
  let s = 0;
  if (r === "left") for (let i = 0; i < n; i++) s += f(a + i * h);
  if (r === "midpoint") for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h);
  if (r === "trapezoid") { s = (f(a) + f(b)) / 2; for (let i = 1; i < n; i++) s += f(a + i * h); }
  if (r === "simpson") { const m = n % 2 ? n + 1 : n; const k = (b - a) / m; let t = f(a) + f(b); for (let i = 1; i < m; i++) t += (i % 2 ? 4 : 2) * f(a + i * k); return (t * k) / 3; }
  return s * h;
}

/** Four rules for ∫₀^π sin x dx = 2, and how fast each error shrinks as the number of pieces grows. */
export function QuadratureViz() {
  const [r, setR] = useState<Rule>("trapezoid");
  const [n, setN] = useState(4);
  const { X, Y } = scales(V);
  const f = Math.sin, a = 0, b = Math.PI, h = (b - a) / n;
  const shapes = [];
  for (let i = 0; i < n; i++) {
    const x0 = a + i * h, x1 = x0 + h;
    if (r === "trapezoid" || r === "simpson") shapes.push(<path key={i} d={`M${X(x0)} ${Y(0)} L${X(x0)} ${Y(f(x0))} L${X(x1)} ${Y(f(x1))} L${X(x1)} ${Y(0)} Z`} className="viz-region" />);
    else { const y = r === "left" ? f(x0) : f(x0 + h / 2); shapes.push(<rect key={i} x={X(x0)} y={Y(y)} width={X(x1) - X(x0)} height={Y(0) - Y(y)} className="viz-region" />); }
  }
  const rows = [4, 8, 16, 32].map((m) => ({ m, err: Math.abs(rule(r, f, a, b, m) - 2) }));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Rule">
        {RULES.map((q) => <button key={q} type="button" className={q === r ? "btn btn-primary" : "btn"} aria-pressed={q === r} onClick={() => setR(q)}>{q}</button>)}
      </div>
      <Axes v={V} label={`The ${r} rule with ${n} pieces for the integral of sin x from 0 to pi`}>
        {r === "simpson" ? null : shapes}
        <path d={curvePath(V, f, 300)} className="plot-curve" />
      </Axes>
      <div className="viz-sliders">
        <label>Pieces n = <span className="mono">{n}</span><input type="range" min={2} max={32} step={2} value={n} onChange={(e) => setN(Number(e.target.value))} /></label>
      </div>
      <table className="table" style={{ marginTop: 12 }}>
        <thead><tr><th>n</th><th>error of the {r} rule</th><th>ratio to previous</th></tr></thead>
        <tbody>{rows.map((row, i) => <tr key={row.m}><td>{row.m}</td><td className="mono">{row.err.toExponential(3)}</td><td className="mono">{i ? (rows[i - 1].err / row.err).toFixed(2) : ""}</td></tr>)}</tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        The exact value is 2. {r === "simpson" ? "Simpson's rule fits a parabola through each pair of pieces (not drawn). Doubling n divides the error by about 16, so the error is proportional to 1/n⁴." : r === "left" ? "Here the left rule matches the trapezoid rule exactly, because sin x is 0 at both ends, so its error falls by about 4 when n doubles. On a typical curve the left rule's error is proportional to 1/n, and doubling n only halves it." : `Doubling n divides the error by about 4, so the ${r} rule's error is proportional to 1/n².`}
      </figcaption>
    </figure>
  );
}
