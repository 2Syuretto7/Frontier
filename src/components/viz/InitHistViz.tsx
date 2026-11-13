"use client";

import { useMemo, useState } from "react";

const N = 100, B = 40, DEPTH = 10, BINS = 24;
type Act = "tanh" | "relu";
type Scheme = "0.01" | "1/n" | "xavier" | "he";

function rng(seed: number) {
  let a = seed >>> 0;
  const u = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(u() + 1e-12)) * Math.cos(2 * Math.PI * u());
}

const STD: Record<Scheme, number> = { "0.01": 0.01, "1/n": Math.sqrt(1 / N), xavier: Math.sqrt(2 / (N + N)), he: Math.sqrt(2 / N) };

/** Histogram of the activations after ten layers, for an activation function and an initialisation scheme. */
export function InitHistViz() {
  const [act, setAct] = useState<Act>("relu");
  const [scheme, setScheme] = useState<Scheme>("he");
  const { vals, rms } = useMemo(() => {
    const r = rng(11);
    const f = act === "tanh" ? Math.tanh : (v: number) => Math.max(v, 0);
    let x = Array.from({ length: B }, () => Array.from({ length: N }, () => r()));
    for (let l = 0; l < DEPTH; l++) {
      const W = Array.from({ length: N }, () => Array.from({ length: N }, () => r() * STD[scheme]));
      x = x.map((row) => Array.from({ length: N }, (_, j) => f(row.reduce((s, v, i) => s + v * W[i][j], 0))));
    }
    const flat = x.flat();
    return { vals: flat, rms: Math.sqrt(flat.reduce((s, v) => s + v * v, 0) / flat.length) };
  }, [act, scheme]);
  const lo = act === "tanh" ? -1 : 0, hi = act === "tanh" ? 1 : Math.max(3 * rms, 1e-6);
  const counts = new Array(BINS).fill(0);
  vals.forEach((v) => { counts[Math.min(BINS - 1, Math.max(0, Math.floor(((v - lo) / (hi - lo)) * BINS)))]++; });
  const mx = Math.max(...counts);
  const W = 320, H = 150, bw = (W - 20) / BINS;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(["tanh", "relu"] as Act[]).map((a) => (
          <button key={a} type="button" className="seg" aria-pressed={act === a} onClick={() => setAct(a)}>{a}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        {(["0.01", "1/n", "xavier", "he"] as Scheme[]).map((s) => (
          <button key={s} type="button" className="seg" aria-pressed={scheme === s} onClick={() => setScheme(s)}>
            {s === "0.01" ? "std 0.01" : s === "1/n" ? "var 1/n" : s === "xavier" ? "Xavier" : "He"}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of layer-10 activations">
        <line x1={10} x2={W - 10} y1={H - 22} y2={H - 22} stroke="var(--border)" />
        {counts.map((c, i) => {
          const h = (c / mx) * (H - 34);
          return <rect key={i} x={10 + i * bw + 1} y={H - 22 - h} width={bw - 2} height={h} fill="var(--accent)" />;
        })}
        <text x={10} y={H - 6} className="viz-label">{lo.toPrecision(2)}</text>
        <text x={W - 10} y={H - 6} textAnchor="end" className="viz-label">{hi.toPrecision(2)}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        layer {DEPTH}, width {N}: root mean square of activations {rms.toExponential(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Watch the scale in the corner as well as the shape. With std 0.01 everything collapses towards 0. ReLU zeroes half of
        each pre-activation, halving the second moment, so variance 1/n (and Xavier, equal here because the widths match)
        shrinks by √2 per layer while He's factor 2 holds it steady. tanh is close to the identity near 0 but bends below it,
        so 1/n slowly shrinks it; He keeps it larger, with some units near ±1, where tanh's slope is small.
      </figcaption>
    </figure>
  );
}
