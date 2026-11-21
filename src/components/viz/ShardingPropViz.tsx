"use client";

import { useState } from "react";

type W = "rep" | "col" | "row";
const N = 4;
const MIB = { y: 32, g: 128, h: 128 };
const LABEL: Record<W, string> = {
  rep: "replicated",
  col: "column-sharded",
  row: "row-sharded",
};
const spec = (s: (string | null)[]) =>
  "[" + s.map((a) => a ?? "·").join(", ") + "]";

export function ShardingPropViz() {
  const [w1, setW1] = useState<W>("col");
  const [w2, setW2] = useState<W>("row");
  const steps: { what: string; s: string; comm?: string; mib: number }[] = [];
  steps.push({ what: "a", s: spec([null, null]), mib: 0 });
  let h: (string | null)[] = [null, null];
  if (w1 === "col") h = [null, "x"];
  steps.push({
    what: "h = a · W1",
    s: spec(h),
    comm: w1 === "row" ? "all-reduce h" : undefined,
    mib: w1 === "row" ? (2 * (N - 1) * MIB.h) / N : 0,
  });
  steps.push({ what: "g = gelu(h)", s: spec(h), mib: 0 });
  let gk = h[1];
  let gather = 0;
  if (gk === "x" && w2 !== "row") {
    gather = ((N - 1) * MIB.g) / N;
    gk = null;
  }
  const reduce = w2 === "row";
  const y: (string | null)[] = [null, w2 === "col" ? "x" : null];
  steps.push({
    what: "y = g · W2",
    s: spec(y),
    comm:
      [gather ? "all-gather g" : "", reduce ? "all-reduce y" : ""]
        .filter(Boolean)
        .join(", ") || undefined,
    mib: gather + (reduce ? (2 * (N - 1) * MIB.y) / N : 0),
  });
  const total = steps.reduce((s, t) => s + t.mib, 0);
  const pick = (v: W, set: (w: W) => void, label: string) => (
    <div
      role="group"
      aria-label={label}
      style={{
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <span className="viz-label">{label}:</span>
      {(["rep", "col", "row"] as W[]).map((o) => (
        <button
          key={o}
          type="button"
          className={o === v ? "btn btn-primary" : "btn"}
          aria-pressed={o === v}
          onClick={() => set(o)}
        >
          {o === "rep" ? "replicate" : o === "col" ? "columns" : "rows"}
        </button>
      ))}
    </div>
  );
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{
          marginTop: 0,
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        {pick(w1, setW1, "W1")}
        {pick(w2, setW2, "W2")}
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 10,
          fontSize: 14,
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "1px solid var(--border)",
              textAlign: "left",
            }}
          >
            <th style={{ padding: 4 }}>value</th>
            <th style={{ padding: 4 }}>sharding</th>
            <th style={{ padding: 4 }}>inserted</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((t) => (
            <tr
              key={t.what}
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <td style={{ padding: 4, fontFamily: "var(--font-mono)" }}>
                {t.what}
              </td>
              <td style={{ padding: 4, fontFamily: "var(--font-mono)" }}>
                {t.s}
              </td>
              <td
                style={{
                  padding: 4,
                  color: t.comm ? "var(--danger)" : "var(--text-muted)",
                }}
              >
                {t.comm ? `${t.comm} (${t.mib} MiB)` : "none"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="viz-label" style={{ textAlign: "center" }}>
        W1 {LABEL[w1]}, W2 {LABEL[w2]}: each device receives {total} MiB per
        forward pass
      </p>
      <figcaption className="viz-caption">
        A two-layer MLP on a mesh axis x of {N} devices, with a of shape 4096 ×
        4096, a hidden width of 16384 and bf16 values. Only the weights are
        annotated; the shardings of every other value follow by propagation, and
        the partitioner inserts a collective wherever two shardings disagree or
        a contraction leaves partial sums. Columns then rows needs a single
        all-reduce of the output.
      </figcaption>
    </figure>
  );
}
