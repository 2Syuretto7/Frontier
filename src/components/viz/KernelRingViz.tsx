"use client";

import { useMemo, useState } from "react";

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

function solve(A: number[][], b: number[]) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  const x = Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
  return x;
}

type Kern = "linear" | "poly" | "rbf";
const GAMMAS = [0.1, 0.3, 1, 3, 10, 30];
const N = 60, G = 36, R = 2.4;

/** Kernel ridge classification of points in two rings: a linear kernel cannot separate them, a degree-2 polynomial kernel can, and the RBF bandwidth controls how wiggly the boundary is. */
export function KernelRingViz() {
  const [kern, setKern] = useState<Kern>("rbf");
  const [gi, setGi] = useState(2);
  const pts = useMemo(() => {
    const r = makeRng(31337);
    return Array.from({ length: N }, (_, i) => {
      const y = i % 2 === 0 ? 1 : -1;
      const rad = (y > 0 ? 0.7 : 1.7) + 0.35 * (r() - 0.5) * 2, th = 2 * Math.PI * r();
      return { x: [rad * Math.cos(th), rad * Math.sin(th)], y };
    });
  }, []);
  const gamma = GAMMAS[gi];
  const k = useMemo(() => {
    if (kern === "linear") return (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1];
    if (kern === "poly") return (a: number[], b: number[]) => { const d = 1 + a[0] * b[0] + a[1] * b[1]; return d * d; };
    return (a: number[], b: number[]) => Math.exp(-gamma * ((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])));
  }, [kern, gamma]);
  const { alpha, grid, acc } = useMemo(() => {
    const K = pts.map((p, i) => pts.map((q, j) => k(p.x, q.x) + (i === j ? 0.1 : 0)));
    const alpha = solve(K, pts.map((p) => p.y));
    const f = (x: number[]) => pts.reduce((s, p, i) => s + alpha[i] * k(x, p.x), 0);
    const grid = Array.from({ length: G * G }, (_, idx) => {
      const gx = -R + ((idx % G) + 0.5) * ((2 * R) / G), gy = R - (Math.floor(idx / G) + 0.5) * ((2 * R) / G);
      return f([gx, gy]);
    });
    const acc = pts.filter((p) => Math.sign(f(p.x)) === p.y).length / N;
    return { alpha, grid, acc };
  }, [pts, k]);
  const W = 280, cell = W / G;
  const X = (v: number) => ((v + R) / (2 * R)) * W;
  const Y = (v: number) => ((R - v) / (2 * R)) * W;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {(["linear", "poly", "rbf"] as Kern[]).map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={kern === v} onClick={() => setKern(v)}>
            {v === "linear" ? "linear" : v === "poly" ? "polynomial (d = 2)" : "RBF"}
          </button>
        ))}
        {kern === "rbf" && (
          <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
            γ = {gamma}
            <input type="range" min={0} max={GAMMAS.length - 1} value={gi} onChange={(e) => setGi(Number(e.target.value))} aria-label="RBF gamma" style={{ width: 110 }} />
          </label>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${W}`} style={{ width: "100%", maxWidth: 340, display: "block", margin: "0 auto" }} role="img" aria-label="Decision regions of a kernel classifier on ring-shaped data">
        {grid.map((v, idx) => (
          <rect key={idx} x={(idx % G) * cell} y={Math.floor(idx / G) * cell} width={cell + 0.3} height={cell + 0.3} fill={v > 0 ? "var(--accent)" : "var(--danger)"} opacity={Math.min(0.35, 0.08 + Math.abs(v) * 0.25)} />
        ))}
        {pts.map((p, i) => <circle key={i} cx={X(p.x[0])} cy={Y(p.x[1])} r={3.2} fill={p.y > 0 ? "var(--accent)" : "var(--danger)"} stroke="var(--text)" strokeWidth={0.5} />)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        training accuracy {(acc * 100).toFixed(0)}%; largest |αᵢ| = {Math.max(...alpha.map(Math.abs)).toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Kernel ridge regression on labels ±1, classifying by the sign of f(x) = Σ αᵢ k(xᵢ, x), with λ = 0.1. The inner ring
        cannot be cut from the outer by any line, so the linear kernel fails. The degree-2 polynomial kernel is an inner
        product of features that include x₁² and x₂², where a circle becomes a line, and it separates them. The RBF kernel
        with small γ gives a smooth boundary; large γ makes each point&apos;s influence local, and the boundary bends around
        individual points.
      </figcaption>
    </figure>
  );
}
