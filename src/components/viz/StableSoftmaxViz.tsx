"use client";

import { useState } from "react";

const fmt = (v: number) => (Number.isNaN(v) ? "nan" : !Number.isFinite(v) ? (v > 0 ? "inf" : "-inf") : Math.abs(v) >= 1e6 || (v !== 0 && Math.abs(v) < 1e-3) ? v.toExponential(2) : v.toFixed(4));

/** Softmax cross-entropy computed naively and with the max subtracted, as the logits grow. */
export function StableSoftmaxViz() {
  const [s, setS] = useState(5);
  const z = [s, s / 2, -s];
  const y = 0;
  const ez = z.map(Math.exp);
  const sum = ez.reduce((a, b) => a + b, 0);
  const naiveP = ez.map((e) => e / sum);
  const naive = -Math.log(naiveP[y]);
  const m = Math.max(...z);
  const lse = m + Math.log(z.reduce((a, v) => a + Math.exp(v - m), 0));
  const stable = lse - z[y];
  const p = z.map((v) => Math.exp(v - lse));
  const grad = p.map((v, j) => v - (j === y ? 1 : 0));
  const broken = !Number.isFinite(naive);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          scale s = {s}
          <input type="range" min={1} max={1000} value={s} onChange={(e) => setS(Number(e.target.value))} aria-label="logit scale" style={{ width: 180 }} />
        </label>
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", lineHeight: 1.7, overflowX: "auto" }}>
        logits z = [{z.map(fmt).join(", ")}], target class 0
        <br />
        <span style={{ color: "var(--text-muted)" }}>naive:</span> exp(z) = [{ez.map(fmt).join(", ")}], loss ={" "}
        <span style={{ color: broken ? "var(--danger)" : "var(--text)", fontWeight: broken ? 700 : 400 }}>{fmt(naive)}</span>
        <br />
        <span style={{ color: "var(--text-muted)" }}>stable:</span> exp(z − max) = [{z.map((v) => fmt(Math.exp(v - m))).join(", ")}], loss ={" "}
        <span style={{ color: "var(--accent)" }}>{fmt(stable)}</span>
        <br />
        <span style={{ color: "var(--text-muted)" }}>gradient p − onehot:</span> [{grad.map(fmt).join(", ")}]
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {broken
          ? `exp(${fmt(s)}) is larger than the biggest float64 (about 1.8e308), so it becomes inf, and inf / inf is nan. Subtracting the max first makes the largest exponent exp(0) = 1, and the loss is exact.`
          : "Drag s up. Above about 709, exp overflows in float64 and the naive loss breaks; the stable version never computes an exponent above 0."}
      </figcaption>
    </figure>
  );
}
