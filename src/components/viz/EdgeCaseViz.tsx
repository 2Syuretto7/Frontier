"use client";

import { useState } from "react";

const fmt = (v: number) => (Number.isNaN(v) ? "nan" : v === Infinity ? "inf" : v === -Infinity ? "-inf" : Object.is(v, -0) ? "-0" : Math.abs(v) >= 1e4 || (v !== 0 && Math.abs(v) < 1e-3) ? v.toExponential(3) : v.toFixed(4));
const bad = (v: number) => !Number.isFinite(v);

type Row = { name: string; naive: (x: number) => number; stable: (x: number) => number; naiveCode: string; stableCode: string };
const ROWS: Row[] = [
  {
    name: "sigmoid",
    naive: (x) => 1 / (1 + Math.exp(-x)),
    stable: (x) => { const e = Math.exp(-Math.abs(x)); return x >= 0 ? 1 / (1 + e) : e / (1 + e); },
    naiveCode: "1 / (1 + exp(-x))",
    stableCode: "exp(-|x|) form by sign",
  },
  {
    name: "softplus",
    naive: (x) => Math.log(1 + Math.exp(x)),
    stable: (x) => Math.max(x, 0) + Math.log1p(Math.exp(-Math.abs(x))),
    naiveCode: "log(1 + exp(x))",
    stableCode: "max(x, 0) + log1p(exp(-|x|))",
  },
  {
    name: "log sigmoid",
    naive: (x) => Math.log(1 / (1 + Math.exp(-x))),
    stable: (x) => -(Math.max(-x, 0) + Math.log1p(Math.exp(-Math.abs(x)))),
    naiveCode: "log(sigmoid(x))",
    stableCode: "-softplus(-x)",
  },
  {
    name: "BCE grad, y = 1",
    naive: (x) => { const s = 1 / (1 + Math.exp(-x)); return -(1 / s) * s * (1 - s); },
    stable: (x) => { const e = Math.exp(-Math.abs(x)); const s = x >= 0 ? 1 / (1 + e) : e / (1 + e); return s - 1; },
    naiveCode: "−(1/s)·s(1 − s), chained",
    stableCode: "sigmoid(x) − y, fused",
  },
];

/** Naive and stable forms of sigmoid, softplus, log-sigmoid and a BCE gradient across extreme inputs. */
export function EdgeCaseViz() {
  const [x, setX] = useState(-40);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {[-1000, -800, -40, 0, 40, 800].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={x === v} onClick={() => setX(v)}>x = {v}</button>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 13, display: "grid", gridTemplateColumns: "auto auto auto", gap: "4px 14px", margin: "8px 0", overflowX: "auto" }}>
        <span style={{ color: "var(--text-muted)" }}>function</span>
        <span style={{ color: "var(--text-muted)" }}>naive</span>
        <span style={{ color: "var(--text-muted)" }}>stable</span>
        {ROWS.map((r) => {
          const a = r.naive(x), b = r.stable(x);
          const wrong = bad(a) || Math.abs(a - b) > 1e-9 * Math.abs(b);
          return [
            <span key={`${r.name}0`}>{r.name}</span>,
            <span key={`${r.name}1`} style={{ color: wrong ? "var(--danger)" : "var(--text)", fontWeight: wrong ? 700 : 400 }} title={r.naiveCode}>{fmt(a)}</span>,
            <span key={`${r.name}2`} style={{ color: "var(--accent)" }} title={r.stableCode}>{fmt(b)}</span>,
          ];
        })}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {x <= -800
          ? "exp(−x) overflows to inf. The naive sigmoid survives by luck (1/inf = 0), but the naive log sigmoid takes log(0) = −inf, and the chained BCE gradient computes (1/0)·0 = nan, which then spreads to every parameter."
          : x === -40
            ? "Nothing overflows, but sigmoid(−40) ≈ 4e-18 and 1 + exp(−40) rounds to exactly 1, so naive softplus returns 0 instead of 4.2e-18. Using log1p keeps the tiny answer."
            : x === 40
              ? "sigmoid(40) rounds to exactly 1, so the naive log sigmoid returns 0 instead of −4.2e-18. The stable form keeps the tiny value."
              : x >= 800
              ? "exp(x) overflows in the naive softplus: log(inf) = inf instead of 800. The stable form never exponentiates a positive number."
              : "Near 0 every form agrees. The differences appear only at the extremes, which is exactly where training goes when logits grow."}{" "}
        Highlighted values are wrong or not finite.
      </figcaption>
    </figure>
  );
}
