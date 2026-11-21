"use client";

import { useState } from "react";

const TOKENS = [" Paris", " the", " a", " located", " Lyon", " France"];
const LAYERS = 16;

function logits(l: number) {
  const t = l / (LAYERS - 1);
  return [
    -1 + 7 * Math.max(0, t - 0.45) * 2.2,
    2.2 - 1.2 * t,
    1.9 - 1.4 * t,
    0.4 + 2.2 * Math.sin(Math.PI * Math.min(1, t * 1.3)) * 0.9,
    -1.5 + 3.2 * Math.max(0, t - 0.5) * 1.6,
    0.2 + 1.6 * Math.sin(Math.PI * t),
  ];
}

export function LogitLensViz() {
  const [l, setL] = useState(6);
  const z = logits(l);
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b);
  const p = e.map((v) => v / s);
  const order = p.map((_, i) => i).sort((a, b) => p[b] - p[a]);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <label className="viz-label">
          layer: {l + 1} of {LAYERS}{" "}
          <input
            type="range"
            min={0}
            max={LAYERS - 1}
            step={1}
            value={l}
            onChange={(e) => setL(+e.target.value)}
          />
        </label>
      </div>
      <p
        className="viz-label"
        style={{ fontFamily: "var(--font-mono)", textAlign: "center" }}
      >
        The capital of France is ▢
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {order.map((i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <span
              className="viz-label"
              style={{
                width: 76,
                fontFamily: "var(--font-mono)",
                whiteSpace: "pre",
              }}
            >
              {TOKENS[i]}
            </span>
            <div
              style={{
                flex: 1,
                height: 14,
                background: "var(--bg-subtle)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${100 * p[i]}%`,
                  height: "100%",
                  background: i === 0 ? "var(--success)" : "var(--accent)",
                }}
              />
            </div>
            <span
              className="viz-label"
              style={{ width: 44, textAlign: "right" }}
            >
              {(100 * p[i]).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
      <figcaption className="viz-caption">
        An illustration of the logit lens: each layer&apos;s hidden state at the
        last position is passed through the final norm and unembedding as if it
        were the output. Early layers favour common words; the related token and
        the right answer emerge in the middle layers, and the answer dominates
        near the top. Shapes like this, measured on the capstone model, suggest
        where to look with probes and patching.
      </figcaption>
    </figure>
  );
}
