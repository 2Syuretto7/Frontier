"use client";

import { useMemo, useState } from "react";

function comb(n: number, k: number) {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

/** Exact plurality accuracy: correct with p, one wrong answer with q, the rest never repeat; ties broken at random. */
export function pluralityAcc(p: number, q: number, m: number) {
  const r = Math.max(0, 1 - p - q);
  let acc = 0;
  for (let c = 0; c <= m; c++)
    for (let w = 0; w <= m - c; w++) {
      const j = m - c - w;
      const pr =
        comb(m, c) * comb(m - c, w) * p ** c * q ** w * (j ? r ** j : 1);
      const top = Math.max(c, w, j ? 1 : 0);
      if (c === top)
        acc += pr / (1 + (w === top ? 1 : 0) + (top === 1 ? j : 0));
    }
  return acc;
}

export function PluralityVoteViz() {
  const [p, setP] = useState(30);
  const [q, setQ] = useState(20);
  const qq = Math.min(q, 100 - p);
  const M = 40;
  const acc = useMemo(
    () =>
      Array.from({ length: M }, (_, i) =>
        pluralityAcc(p / 100, qq / 100, i + 1),
      ),
    [p, qq],
  );
  const W = 330,
    H = 200,
    x0 = 34,
    y0 = 10,
    pw = 280,
    ph = 150;
  const sx = (m: number) => x0 + ((m - 1) / (M - 1)) * pw;
  const sy = (a: number) => y0 + (1 - a) * ph;
  const path = (f: (m: number) => number) =>
    Array.from({ length: M }, (_, i) => i + 1)
      .map(
        (m, i) => `${i ? "L" : "M"}${sx(m).toFixed(1)},${sy(f(m)).toFixed(1)}`,
      )
      .join(" ");
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          P(correct) = {(p / 100).toFixed(2)}{" "}
          <input
            type="range"
            min={5}
            max={90}
            value={p}
            onChange={(e) => setP(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          P(top wrong answer) = {(qq / 100).toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={90}
            value={q}
            onChange={(e) => setQ(+e.target.value)}
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
        aria-label="Accuracy of a plurality vote against the number of samples"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {[0, 0.5, 1].map((a) => (
          <g key={a}>
            <line
              x1={x0}
              x2={x0 + pw}
              y1={sy(a)}
              y2={sy(a)}
              stroke="var(--grid-line)"
            />
            <text
              x={x0 - 4}
              y={sy(a) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {a}
            </text>
          </g>
        ))}
        <path
          d={path((m) => 1 - (1 - p / 100) ** m)}
          fill="none"
          stroke="var(--text-muted)"
          strokeDasharray="4 3"
          strokeWidth={1.5}
        />
        <path
          d={path((m) => acc[m - 1])}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        {[1, 10, 20, 30, 40].map((m) => (
          <text
            key={m}
            x={sx(m)}
            y={y0 + ph + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {m}
          </text>
        ))}
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          samples m
        </text>
      </svg>
      <div
        style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          fontSize: 13,
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "var(--accent)" }}>plurality vote</span>
        <span style={{ color: "var(--text-muted)" }}>
          coverage: some sample right
        </span>
      </div>
      <figcaption className="viz-caption">
        Each sampled chain ends in the correct answer, in one popular wrong
        answer, or in a wrong answer that never repeats. The vote converges to
        the most likely answer, so it climbs to 1 when the correct answer is
        more likely than the popular wrong one, even if it is far below one
        half, and falls to 0 when it is not. Coverage, the chance that some
        sample is right, bounds what any way of choosing could achieve.
      </figcaption>
    </figure>
  );
}
