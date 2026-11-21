"use client";

import { useState } from "react";

/** Standard normal CDF via the error function approximation (Abramowitz and Stegun 7.1.26). */
export function phi(z: number) {
  const t = 1 / (1 + (0.3275911 * Math.abs(z)) / Math.SQRT2);
  const y =
    1 -
    t *
      (0.254829592 +
        t *
          (-0.284496736 +
            t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) *
      Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

const ETA = 0.1,
  D = 900,
  P = 0.95,
  EMAX = 0.3;

/** Accuracy of averaging the d weak features when an l-infinity adversary moves each by eps against the label. */
export function weakAccuracy(eps: number) {
  return phi((ETA - eps) * Math.sqrt(D));
}

export function RobustFeatureViz() {
  const [ei, setEi] = useState(5);
  const eps = ei / 100;
  const W = 330,
    H = 200,
    x0 = 34,
    y0 = 10,
    pw = 280,
    ph = 150;
  const sx = (e: number) => x0 + (e / EMAX) * pw;
  const sy = (v: number) => y0 + (1 - v) * ph;
  const es = Array.from({ length: 61 }, (_, i) => (i * EMAX) / 60);
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          attack budget per feature: {eps.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={30}
            value={ei}
            onChange={(e) => setEi(+e.target.value)}
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
        aria-label="Accuracy under attack of a classifier using many weak features and one using a single robust feature"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line
              x1={x0}
              x2={x0 + pw}
              y1={sy(v)}
              y2={sy(v)}
              stroke="var(--grid-line)"
            />
            <text
              x={x0 - 4}
              y={sy(v) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {v}
            </text>
          </g>
        ))}
        {[0, 0.1, 0.2, 0.3].map((e) => (
          <text
            key={e}
            x={sx(e)}
            y={y0 + ph + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {e}
          </text>
        ))}
        <path
          d={es
            .map(
              (e, i) =>
                `${i ? "L" : "M"}${sx(e).toFixed(1)},${sy(weakAccuracy(e)).toFixed(1)}`,
            )
            .join(" ")}
          fill="none"
          stroke="var(--danger)"
          strokeWidth={2}
        />
        <line
          x1={x0}
          x2={x0 + pw}
          y1={sy(P)}
          y2={sy(P)}
          stroke="var(--accent)"
          strokeWidth={2}
        />
        <line
          x1={sx(eps)}
          x2={sx(eps)}
          y1={y0}
          y2={y0 + ph}
          stroke="var(--text-muted)"
          strokeDasharray="4 3"
        />
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          attack budget per feature
        </text>
      </svg>
      <p style={{ textAlign: "center", fontSize: 13, margin: "6px 0 0" }}>
        At this budget: weak features {weakAccuracy(eps).toFixed(3)}, robust
        feature {P.toFixed(3)}
      </p>
      <div
        style={{
          display: "flex",
          gap: "4px 16px",
          justifyContent: "center",
          fontSize: 13,
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "var(--danger)" }}>
          average of 900 weak features
        </span>
        <span style={{ color: "var(--accent)" }}>
          one robust feature, right 95% of the time
        </span>
      </div>
      <figcaption className="viz-caption">
        Each of 900 weak features is shifted by 0.1 toward the label, under unit
        noise; together they classify almost perfectly. A single robust feature
        is right 95% of the time and cannot be moved by a small budget. With no
        attack the weak features win; an attacker who can shift every feature by
        more than their signal turns them against the label. Adversarial
        training pushes the model to the robust feature and gives up some clean
        accuracy to do it.
      </figcaption>
    </figure>
  );
}
