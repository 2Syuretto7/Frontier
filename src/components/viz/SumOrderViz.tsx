"use client";

import { useMemo, useState } from "react";

const fr = Math.fround;
const N = 10000;
type Kind = "positive" | "mixed" | "huge";

function data(kind: Kind) {
  let s = 3;
  const u = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  return Array.from({ length: N }, (_, i) => {
    if (kind === "positive") return fr(u());
    if (kind === "mixed") return fr((u() - 0.5) * 2000);
    return fr(i === 0 ? 1e8 : u());
  });
}

const left = (x: number[]) => x.reduce((a, v) => fr(a + v), 0);
const pairwise = (x: number[]): number => (x.length <= 8 ? left(x) : fr(pairwise(x.slice(0, x.length >> 1)) + pairwise(x.slice(x.length >> 1))));
const sortedAsc = (x: number[]) => left([...x].sort((a, b) => Math.abs(a) - Math.abs(b)));
const kahan = (x: number[]) => {
  let s = 0, c = 0;
  for (const v of x) { const y = fr(v - c); const t = fr(s + y); c = fr(fr(t - s) - y); s = t; }
  return s;
};

const ulp = (v: number) => { const a = Math.abs(v) || 1e-38; return 2 ** (Math.floor(Math.log2(a)) - 23); };

/** The same ten thousand float32 numbers summed in different orders, against an exact float64 sum. */
export function SumOrderViz() {
  const [kind, setKind] = useState<Kind>("positive");
  const rows = useMemo(() => {
    const x = data(kind);
    const exact = x.reduce((a, v) => a + v, 0);
    return {
      exact,
      list: [
        ["left to right", left(x)],
        ["pairwise (tree)", pairwise(x)],
        ["smallest first", sortedAsc(x)],
        ["Kahan", kahan(x)],
      ] as [string, number][],
    };
  }, [kind]);
  const u = ulp(rows.exact);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={kind === "positive"} onClick={() => setKind("positive")}>uniform in [0, 1)</button>
        <button type="button" className="seg" aria-pressed={kind === "mixed"} onClick={() => setKind("mixed")}>mixed signs</button>
        <button type="button" className="seg" aria-pressed={kind === "huge"} onClick={() => setKind("huge")}>1e8 then small</button>
      </div>
      <div className="mono" style={{ fontSize: 13, display: "grid", gridTemplateColumns: "auto auto auto", gap: "4px 14px", margin: "8px 0", overflowX: "auto" }}>
        <span style={{ color: "var(--text-muted)" }}>order</span>
        <span style={{ color: "var(--text-muted)" }}>float32 sum</span>
        <span style={{ color: "var(--text-muted)" }}>error in ULPs</span>
        {rows.list.map(([name, v]) => {
          const e = Math.abs(v - rows.exact) / u;
          return [
            <span key={`${name}0`}>{name}</span>,
            <span key={`${name}1`}>{v.toPrecision(9)}</span>,
            <span key={`${name}2`} style={{ color: e > 4 ? "var(--danger)" : "var(--accent)" }}>{e.toFixed(1)}</span>,
          ];
        })}
        <span>exact (float64)</span>
        <span>{rows.exact.toPrecision(9)}</span>
        <span>0</span>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Floating-point addition is not associative, so the order of a sum changes its last digits.{" "}
        {kind === "huge"
          ? "Next to 1e8, each small number is below half a float32 spacing (8) and vanishes, so the plain left-to-right sum loses all of them; adding the small ones first, or Kahan's compensation, keeps them."
          : "Left to right accumulates rounding error that grows with the length; pairwise summation, which NumPy and GPU reductions use, keeps it far smaller, and Kahan summation nearly removes it."}{" "}
        Two correct frameworks can therefore disagree in the last few bits.
      </figcaption>
    </figure>
  );
}
