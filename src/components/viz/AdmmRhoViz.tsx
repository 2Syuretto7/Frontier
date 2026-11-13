"use client";

import { useEffect, useMemo, useState } from "react";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const M = 30, N = 10, K = 200, LAM = 3;

function invert(a: number[][]) {
  const n = a.length;
  const m = a.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
    [m[c], m[p]] = [m[p], m[c]];
    const d = m[c][c];
    for (let j = 0; j < 2 * n; j++) m[c][j] /= d;
    for (let r = 0; r < n; r++) if (r !== c) { const f = m[r][c]; for (let j = 0; j < 2 * n; j++) m[r][j] -= f * m[c][j]; }
  }
  return m.map((row) => row.slice(n));
}

/** ADMM for the lasso: the primal residual ‖x − z‖ and dual residual ρ‖z − z_prev‖ on a log scale, for a chosen penalty ρ. */
export function AdmmRhoViz() {
  const [ready, setReady] = useState(false);
  const [lr, setLr] = useState(0);
  useEffect(() => setReady(true), []);
  const rho = 10 ** lr;
  const data = useMemo(() => {
    const r = makeRng(42);
    const nrm = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    const A = Array.from({ length: M }, () => Array.from({ length: N }, nrm));
    const xt = Array.from({ length: N }, (_, j) => (j === 0 ? 3 : j === 3 ? -2 : j === 6 ? 1.5 : 0));
    const b = A.map((row) => row.reduce((s, a, j) => s + a * xt[j], 0) + 0.3 * nrm());
    const AtA = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => A.reduce((s, row) => s + row[i] * row[j], 0)));
    const Atb = Array.from({ length: N }, (_, i) => A.reduce((s, row, k) => s + row[i] * b[k], 0));
    return { AtA, Atb };
  }, []);
  const res = useMemo(() => {
    if (!ready) return null;
    const { AtA, Atb } = data;
    const Minv = invert(AtA.map((row, i) => row.map((v, j) => v + (i === j ? rho : 0))));
    let z = new Array(N).fill(0), u = new Array(N).fill(0);
    const pr: number[] = [], du: number[] = [];
    let nz = 0;
    for (let k = 0; k < K; k++) {
      const rhs = Atb.map((v, i) => v + rho * (z[i] - u[i]));
      const x = Minv.map((row) => row.reduce((s, a, j) => s + a * rhs[j], 0));
      const zo = z;
      z = x.map((xi, i) => { const v = xi + u[i]; return Math.sign(v) * Math.max(Math.abs(v) - LAM / rho, 0); });
      u = u.map((ui, i) => ui + x[i] - z[i]);
      pr.push(Math.hypot(...x.map((xi, i) => xi - z[i])));
      du.push(rho * Math.hypot(...z.map((zi, i) => zi - zo[i])));
      nz = z.filter((v) => Math.abs(v) > 1e-9).length;
    }
    return { pr, du, nz };
  }, [ready, data, rho]);
  const W = 330, H = 180, lo = -10, hi = 2;
  const X = (k: number) => 34 + (k / (K - 1)) * (W - 46);
  const Y = (v: number) => 10 + ((hi - Math.max(lo, Math.min(hi, Math.log10(Math.max(v, 1e-300))))) / (hi - lo)) * (H - 30);
  const line = (vs: number[]) => vs.map((v, k) => `${X(k).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const hit = res ? res.pr.findIndex((p, k) => Math.max(p, res.du[k]) < 1e-6) : -1;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          ρ = {rho < 1 ? rho.toFixed(3) : rho.toFixed(1)}
          <input type="range" min={-1.5} max={2} step={0.1} value={lr} onChange={(e) => setLr(Number(e.target.value))} aria-label="penalty parameter rho, log scale" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Primal and dual residuals of ADMM against iteration on a log scale">
        {[0, -4, -8].map((e) => (
          <g key={e}>
            <line x1={34} x2={W - 12} y1={Y(10 ** e)} y2={Y(10 ** e)} stroke="var(--border)" opacity={0.6} />
            <text x={30} y={Y(10 ** e) + 3} textAnchor="end" className="viz-label">1e{e}</text>
          </g>
        ))}
        {res ? (
          <>
            <polyline fill="none" stroke="var(--accent)" strokeWidth={1.6} points={line(res.pr)} />
            <polyline fill="none" stroke="var(--danger)" strokeWidth={1.4} strokeDasharray="4 3" points={line(res.du)} />
          </>
        ) : null}
        <text x={X(0)} y={H - 4} className="viz-label">k = 1</text>
        <text x={X(K - 1)} y={H - 4} textAnchor="end" className="viz-label">k = {K}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {res ? `both residuals below 10⁻⁶ from step ${hit < 0 ? `> ${K}` : hit + 1}; nonzeros in z: ${res.nz} of ${N}` : "computing"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A lasso with 30 observations and 10 features, three of them truly active, solved by ADMM with λ = 3. The solid curve
        is the primal residual ‖x − z‖, how far the two copies of the variable disagree; the dashed curve is the dual
        residual ρ‖z − z_prev‖, how far the iterates are from satisfying the optimality conditions. A small ρ enforces x = z
        weakly, so the primal residual lingers; a large ρ forces agreement but makes each step timid, so the dual residual
        lingers. Every ρ converges; a moderate one converges fastest.
      </figcaption>
    </figure>
  );
}
