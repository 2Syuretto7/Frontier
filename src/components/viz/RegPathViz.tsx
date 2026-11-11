"use client";

import { useMemo, useState } from "react";
import { Chart } from "./Chart";
import { scales, type View } from "./Plot";
import { makeNormal, makeRng, solve } from "./ml";

const P = 6, N = 60;
const TRUE = [3, 0, 2, -1, 0, 0];
const NAMES = ["x₁", "x₂", "x₃", "x₄", "x₅", "x₆"];
const LOGS = Array.from({ length: 51 }, (_, i) => -3 + (5 * i) / 50);
const V: View = { xmin: -3, xmax: 2, ymin: -1.5, ymax: 3.5, w: 440, h: 240 };

/** Standardised features: x₂ is nearly a copy of x₁; x₅ and x₆ are irrelevant. */
function makeData() {
  const r = makeRng(31), g = makeNormal(r);
  const X = Array.from({ length: N }, () => {
    const a = g();
    return [a, a + 0.3 * g(), g(), g(), g(), g()];
  });
  for (let j = 0; j < P; j++) {
    const m = X.reduce((s, row) => s + row[j], 0) / N;
    const sd = Math.sqrt(X.reduce((s, row) => s + (row[j] - m) ** 2, 0) / N);
    for (const row of X) row[j] = (row[j] - m) / sd;
  }
  const y = X.map((row) => row.reduce((s, v, j) => s + v * TRUE[j], 0) + 0.8 * g());
  const ym = y.reduce((s, v) => s + v, 0) / N;
  return { X, y: y.map((v) => v - ym) };
}

/** Minimises (1/2n)‖y − Xb‖² + (λ/2)‖b‖². */
function ridge(X: number[][], y: number[], lam: number) {
  const A = Array.from({ length: P }, (_, j) => Array.from({ length: P }, (_, k) => X.reduce((s, r) => s + r[j] * r[k], 0) / N + (j === k ? lam : 0)));
  const b = Array.from({ length: P }, (_, j) => X.reduce((s, r, i) => s + r[j] * y[i], 0) / N);
  return solve(A, b);
}

/** Minimises (1/2n)‖y − Xb‖² + λ‖b‖₁ by coordinate descent with soft thresholding. */
function lasso(X: number[][], y: number[], lam: number, start: number[]) {
  const b = [...start];
  const res = y.map((v, i) => v - X[i].reduce((s, x, j) => s + x * b[j], 0));
  for (let sweep = 0; sweep < 200; sweep++) {
    for (let j = 0; j < P; j++) {
      let rho = 0;
      for (let i = 0; i < N; i++) rho += X[i][j] * (res[i] + X[i][j] * b[j]);
      rho /= N;
      const nb = Math.sign(rho) * Math.max(0, Math.abs(rho) - lam);
      if (nb !== b[j]) { for (let i = 0; i < N; i++) res[i] -= X[i][j] * (nb - b[j]); b[j] = nb; }
    }
  }
  return b;
}

/** How ridge shrinks every coefficient smoothly, while lasso sets some exactly to zero. */
export function RegPathViz() {
  const [kind, setKind] = useState<"ridge" | "lasso">("lasso");
  const [li, setLi] = useState(25);
  const paths = useMemo(() => {
    const { X, y } = makeData();
    const r = LOGS.map((l) => ridge(X, y, 10 ** l));
    let warm = new Array(P).fill(0);
    const la = [...LOGS].reverse().map((l) => (warm = lasso(X, y, 10 ** l, warm))).reverse();
    return { ridge: r, lasso: la };
  }, []);
  const path = paths[kind];
  const { X, Y } = scales(V);
  const cur = path[li];
  const nonzero = cur.filter((b) => Math.abs(b) > 1e-6).length;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Penalty">
          <button type="button" className="seg" aria-pressed={kind === "ridge"} onClick={() => setKind("ridge")}>Ridge</button>
          <button type="button" className="seg" aria-pressed={kind === "lasso"} onClick={() => setKind("lasso")}>Lasso</button>
        </div>
      </div>
      <Chart v={V} label={`${kind} coefficient paths against the penalty strength`} xticks={[-3, -2, -1, 0, 1, 2]} xfmt={(l) => (l >= 0 ? String(10 ** l) : `10${["⁻³", "⁻²", "⁻¹"][l + 3]}`)} yticks={[-1, 0, 1, 2, 3]} xlabel="penalty strength λ" ylabel="coefficient">
        <line x1={0} x2={V.w} y1={Y(0)} y2={Y(0)} className="viz-axis" />
        {Array.from({ length: P }, (_, j) => (
          <path key={j} d={path.map((b, i) => `${i ? "L" : "M"}${X(LOGS[i]).toFixed(1)} ${Y(b[j]).toFixed(1)}`).join(" ")} className={TRUE[j] !== 0 ? "plot-curve" : j === 1 ? "ml-curve-test" : "plot-curve-2"} />
        ))}
        <line x1={X(LOGS[li])} x2={X(LOGS[li])} y1={0} y2={V.h} className="plot-mirror" />
      </Chart>
      <div className="ml-legend"><span>features that matter</span><span className="is-test">x₂, a near copy of x₁</span><span className="is-muted">pure noise</span></div>
      <div className="ml-stats">
        {cur.map((b, j) => <div key={j} className="ml-stat"><b>{Math.abs(b) < 1e-6 ? "0" : b.toFixed(2)}</b><span>{NAMES[j]} (true {TRUE[j]})</span></div>)}
      </div>
      <div className="viz-sliders">
        <label>
          λ = {(10 ** LOGS[li]).toPrecision(2)}
          <input type="range" min={0} max={LOGS.length - 1} value={li} onChange={(e) => setLi(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {kind === "ridge"
          ? "Ridge shrinks all six coefficients towards zero together, and shares the weight between the near-copies x₁ and x₂. No coefficient ever becomes exactly zero."
          : `Lasso sets coefficients to exactly zero one at a time as λ grows, choosing features as it shrinks: it keeps x₁ and drops its near-copy x₂ almost at once. Here ${nonzero} of 6 are non-zero.`}
      </figcaption>
    </figure>
  );
}
