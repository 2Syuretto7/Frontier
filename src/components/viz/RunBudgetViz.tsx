"use client";

import { useState } from "react";

const BUDGET = 1e6,
  PEAK = 9.89e14,
  MFU = 0.4;

export function RunBudgetViz() {
  const [ai, setA] = useState(30);
  const [ei, setE] = useState(15);
  const [wi, setW] = useState(10);
  const a = ai / 100,
    e = ei / 100,
    w = wi / 100;
  const main = (BUDGET * (1 - w)) / (1 + a + e);
  const parts = [
    { label: "main run", hours: main, color: "var(--accent)" },
    { label: "ablations", hours: main * a, color: "var(--success)" },
    { label: "evaluation", hours: main * e, color: "var(--text-muted)" },
    { label: "lost to failures", hours: BUDGET * w, color: "var(--danger)" },
  ];
  const flops = main * 3600 * PEAK * MFU;
  const n = Math.sqrt(flops / 120);
  const W = 330,
    x0 = 10,
    pw = 310;
  let x = x0;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          ablations: {ai}% of main{" "}
          <input
            type="range"
            min={0}
            max={100}
            value={ai}
            onChange={(ev) => setA(+ev.target.value)}
          />
        </label>
        <label className="viz-label">
          evaluation: {ei}% of main{" "}
          <input
            type="range"
            min={0}
            max={50}
            value={ei}
            onChange={(ev) => setE(+ev.target.value)}
          />
        </label>
        <label className="viz-label">
          lost to failures: {wi}% of all{" "}
          <input
            type="range"
            min={0}
            max={40}
            value={wi}
            onChange={(ev) => setW(+ev.target.value)}
          />
        </label>
      </div>
      <svg
        viewBox={`0 0 ${W} 40`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="A million GPU-hours split between the main run and its overheads"
      >
        {parts.map((p) => {
          const wpx = (p.hours / BUDGET) * pw;
          const r = (
            <rect
              key={p.label}
              x={x}
              y={6}
              width={wpx}
              height={28}
              fill={p.color}
              opacity={0.8}
            />
          );
          x += wpx;
          return r;
        })}
      </svg>
      <div
        style={{
          display: "flex",
          gap: "4px 14px",
          justifyContent: "center",
          fontSize: 13,
          flexWrap: "wrap",
        }}
      >
        {parts.map((p) => (
          <span key={p.label} style={{ color: p.color }}>
            {p.label}: {(p.hours / 1000).toFixed(0)}k h
          </span>
        ))}
      </div>
      <p style={{ textAlign: "center", fontSize: 13, margin: "6px 0 0" }}>
        The main run gets {(main / 1e3).toFixed(0)}k GPU-hours, enough for a
        compute-optimal model of about {(n / 1e9).toFixed(1)}B parameters on{" "}
        {((20 * n) / 1e12).toFixed(2)}T tokens.
      </p>
      <figcaption className="viz-caption">
        A budget of one million GPU-hours on GPUs with a peak of 989 teraflops
        at 40% utilisation. Ablations and evaluation scale with the main run,
        and failures waste a share of everything, so every point of overhead
        comes out of the model that can be trained.
      </figcaption>
    </figure>
  );
}
