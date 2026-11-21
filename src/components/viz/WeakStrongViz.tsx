"use client";

import { useState } from "react";

/** Accuracies when weak labels are wrong systematically on a share es of inputs and at random with rate er elsewhere, and the strong model learns the conditional majority. */
export function weakStrong(es: number, er: number) {
  const weak = 1 - es - (1 - es) * er;
  const w2s = er < 0.5 ? 1 - es : es > 0 ? 0 : 0.5;
  const pgr = weak < 1 ? (w2s - weak) / (1 - weak) : 1;
  return { weak, w2s, pgr };
}

export function WeakStrongViz() {
  const [si, setSi] = useState(15);
  const [ri, setRi] = useState(25);
  const es = si / 100,
    er = ri / 100;
  const { weak, w2s, pgr } = weakStrong(es, er);
  const bars = [
    { label: "weak supervisor", v: weak, color: "var(--text-muted)" },
    { label: "strong, trained on weak labels", v: w2s, color: "var(--accent)" },
    { label: "strong, trained on true labels", v: 1, color: "var(--success)" },
  ];
  const W = 330,
    H = 150,
    x0 = 10,
    bw = 300;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          inputs where the weak model is consistently wrong: {es.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={40}
            value={si}
            onChange={(e) => setSi(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          random label noise elsewhere: {er.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={45}
            value={ri}
            onChange={(e) => setRi(+e.target.value)}
          />
        </label>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Accuracy of the weak supervisor, the weakly supervised strong model and the ceiling"
      >
        {bars.map((b, i) => (
          <g key={b.label}>
            <text x={x0} y={18 + i * 42} className="viz-label">
              {b.label}: {b.v.toFixed(3)}
            </text>
            <rect
              x={x0}
              y={24 + i * 42}
              width={bw}
              height={12}
              fill="var(--border)"
            />
            <rect
              x={x0}
              y={24 + i * 42}
              width={bw * b.v}
              height={12}
              fill={b.color}
            />
          </g>
        ))}
      </svg>
      <p style={{ textAlign: "center", fontSize: 13, margin: "6px 0 0" }}>
        Performance gap recovered: {pgr.toFixed(3)}
      </p>
      <figcaption className="viz-caption">
        A strong model that can represent the true labels, trained to imitate a
        weak supervisor, learns whatever is consistent in the weak labels.
        Random noise is not consistent, so it averages away and the strong model
        exceeds its teacher. Mistakes the weak model makes every time on the
        same inputs are consistent, so the strong model learns them too. The
        share of the gap recovered is the share of the weak model&apos;s errors
        that are random.
      </figcaption>
    </figure>
  );
}
