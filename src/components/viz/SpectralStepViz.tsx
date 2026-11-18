"use client";

import { useMemo, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const N = 32;
const SPECTRA: Record<string, (i: number) => number> = {
  "one dominant": (i) => (i === 0 ? 10 : 0.1),
  "power law": (i) => 1 / (i + 1),
  flat: () => 1,
};

function orthogonal(seed: number) {
  const normal = makeNormal(makeRng(seed));
  const Q: number[][] = [];
  for (let k = 0; k < N; k++) {
    const v = Array.from({ length: N }, () => normal());
    for (const q of Q) {
      const d = q.reduce((s, x, i) => s + x * v[i], 0);
      for (let i = 0; i < N; i++) v[i] -= d * q[i];
    }
    const n = Math.hypot(...v);
    Q.push(v.map((x) => x / n));
  }
  return Q;
}

function spectralNorm(A: number[][]) {
  let v = Array.from({ length: N }, (_, i) => 1 + i / N);
  let s = 0;
  for (let it = 0; it < 200; it++) {
    const u = A.map((row) => row.reduce((acc, x, j) => acc + x * v[j], 0));
    const w = Array.from({ length: N }, (_, j) => A.reduce((acc, row, i) => acc + row[j] * u[i], 0));
    const n = Math.hypot(...w);
    s = Math.sqrt(n / Math.hypot(...v));
    v = w.map((x) => x / n);
  }
  return s;
}

/** First-order decrease ⟨G, D⟩/‖D‖₂ for D = G (gradient descent), sign(G) (Adam-like) and UVᵀ (Muon), for G = U diag(σ) Vᵀ. */
export function gains(name: string) {
  const U = orthogonal(1), V = orthogonal(2);
  const s = Array.from({ length: N }, (_, i) => SPECTRA[name](i));
  const G = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => s.reduce((acc, sk, k) => acc + U[k][i] * sk * V[k][j], 0)));
  const fro2 = s.reduce((a, x) => a + x * x, 0);
  const sg = G.map((row) => row.map(Math.sign));
  const l1 = G.reduce((a, row) => a + row.reduce((b, x) => b + Math.abs(x), 0), 0);
  return {
    gd: fro2 / Math.max(...s),
    sign: l1 / spectralNorm(sg),
    muon: s.reduce((a, x) => a + x, 0),
    srank: fro2 / Math.max(...s) ** 2,
  };
}

export function SpectralStepViz() {
  const [name, setName] = useState("power law");
  const g = useMemo(() => gains(name), [name]);
  const rows: [string, number, string][] = [
    ["gradient G", g.gd, "var(--text-muted)"],
    ["sign(G)", g.sign, "var(--danger)"],
    ["UVᵀ (Muon)", g.muon, "var(--accent)"],
  ];
  const W = 300, X0 = 92, PW = W - X0 - 40;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">singular values of G</span>
        {Object.keys(SPECTRA).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={name === k} onClick={() => setName(k)}>{k}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} 96`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="First-order decrease per unit spectral norm for three update directions">
        {rows.map(([label, v, col], i) => (
          <g key={label}>
            <text x={X0 - 6} y={22 + i * 28} textAnchor="end" className="viz-label">{label}</text>
            <rect x={X0} y={10 + i * 28} width={(v / g.muon) * PW} height={16} fill={col} />
            <text x={X0 + (v / g.muon) * PW + 4} y={22 + i * 28} className="viz-label">{`${((100 * v) / g.muon).toFixed(0)}%`}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`stable rank ‖G‖²_F/‖G‖²₂ = ${g.srank.toFixed(2)}; nuclear norm ‖G‖_* = ${g.muon.toFixed(2)}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        For a 32 × 32 gradient G in a random basis, the first-order decrease ⟨G, D⟩ bought by an update D of spectral norm
        1, as a share of the best possible, which is the nuclear norm and is attained by D = UVᵀ. Following the raw
        gradient spends the budget on its top singular direction, which is only right when the spectrum is flat. The
        elementwise sign, which Adam approximates, ignores the matrix structure; when G is not aligned with the
        coordinate axes it captures under half of the possible decrease for every spectrum here.
      </figcaption>
    </figure>
  );
}
