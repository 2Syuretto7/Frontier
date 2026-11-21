"use client";

import { useState } from "react";

/** Best-of-n with a binary verifier: pick a random accepted sample, else a random rejected one. */
export function bonVerifierAcc(p: number, t: number, f: number, n: number) {
  const a = p * t + (1 - p) * f;
  if (a === 0) return p;
  const none = (1 - a) ** n;
  return (
    ((1 - none) * p * t) / a + (a < 1 ? (none * p * (1 - t)) / (1 - a) : 0)
  );
}

export function VerifierBonViz() {
  const [ti, setTi] = useState(90);
  const [fi, setFi] = useState(10);
  const p = 0.3,
    t = ti / 100,
    f = fi / 100;
  const prec = (p * t) / (p * t + (1 - p) * f || 1);
  const W = 330,
    H = 200,
    x0 = 34,
    y0 = 10,
    pw = 280,
    ph = 150;
  const sx = (n: number) => x0 + (Math.log10(n) / 3) * pw;
  const sy = (a: number) => y0 + (1 - a) * ph;
  const ns = Array.from({ length: 61 }, (_, i) => 10 ** (i / 20));
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          accepts correct: {t.toFixed(2)}{" "}
          <input
            type="range"
            min={10}
            max={100}
            value={ti}
            onChange={(e) => setTi(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          accepts wrong: {f.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={50}
            value={fi}
            onChange={(e) => setFi(+e.target.value)}
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
        aria-label="Best-of-n accuracy with an imperfect verifier"
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
        <line
          x1={x0}
          x2={x0 + pw}
          y1={sy(prec)}
          y2={sy(prec)}
          stroke="var(--success)"
          strokeDasharray="4 3"
        />
        <path
          d={ns
            .map(
              (n, i) =>
                `${i ? "L" : "M"}${sx(n).toFixed(1)},${sy(bonVerifierAcc(p, t, f, n)).toFixed(1)}`,
            )
            .join(" ")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        {[1, 10, 100, 1000].map((n) => (
          <text
            key={n}
            x={sx(n)}
            y={y0 + ph + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {n}
          </text>
        ))}
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          samples n (log scale)
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
        <span style={{ color: "var(--accent)" }}>best-of-n accuracy</span>
        <span style={{ color: "var(--success)" }}>
          verifier precision: {prec.toFixed(3)}
        </span>
      </div>
      <figcaption className="viz-caption">
        Each sample is correct with probability 0.3. A verifier accepts correct
        samples and, sometimes, wrong ones, and best-of-n returns an accepted
        sample. More samples make it almost certain that something is accepted,
        so accuracy rises quickly and then stops at the verifier&apos;s
        precision, however many samples are drawn.
      </figcaption>
    </figure>
  );
}
