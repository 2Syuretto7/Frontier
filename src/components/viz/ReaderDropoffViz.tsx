"use client";

import { useState } from "react";

const CLAIMS = [
  { id: "setup", label: "experimental setup", value: 2 },
  { id: "related", label: "related work", value: 1 },
  { id: "result", label: "main result", value: 9 },
  { id: "method", label: "key idea of the method", value: 6 },
  { id: "limits", label: "limitations", value: 3 },
];

export function ReaderDropoffViz() {
  const [order, setOrder] = useState(CLAIMS.map((c) => c.id));
  const [di, setD] = useState(40);
  const d = di / 100;
  const byId = Object.fromEntries(CLAIMS.map((c) => [c.id, c]));
  const surv = order.map((_, i) => (1 - d) ** i);
  const ev = order.reduce((s, id, i) => s + byId[id].value * surv[i], 0);
  const sorted = [...CLAIMS].sort((a, b) => b.value - a.value);
  const best = sorted.reduce((s, c, i) => s + c.value * (1 - d) ** i, 0);
  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...order];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setOrder(next);
  };
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          readers lost per section: {Math.round(d * 100)}%{" "}
          <input
            type="range"
            min={0}
            max={80}
            value={di}
            onChange={(e) => setD(+e.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn"
          onClick={() => setOrder(CLAIMS.map((c) => c.id))}
        >
          reset order
        </button>
      </div>
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        {order.map((id, i) => (
          <div
            key={id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              margin: "6px 0",
              fontSize: 13,
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={() => moveUp(i)}
              disabled={i === 0}
              aria-label={`Move ${byId[id].label} earlier`}
              style={{ minWidth: 36 }}
            >
              ↑
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div>
                {byId[id].label} (value {byId[id].value})
              </div>
              <div
                style={{
                  height: 8,
                  width: `${surv[i] * 100}%`,
                  background: "var(--accent)",
                  opacity: 0.7,
                  borderRadius: 2,
                }}
              />
            </div>
            <span className="mono" style={{ width: 44, textAlign: "right" }}>
              {Math.round(surv[i] * 100)}%
            </span>
          </div>
        ))}
      </div>
      <p style={{ textAlign: "center", fontSize: 13, margin: "6px 0 0" }}>
        Value reaching readers: {ev.toFixed(2)} (best possible {best.toFixed(2)}
        )
      </p>
      <figcaption className="viz-caption">
        Each bar shows the share of readers who reach that point of the paper.
        Move sections earlier with the arrows. The value delivered is each
        section&apos;s value times the share of readers who reach it, and it is
        largest when the most important content comes first, which is why the
        abstract, introduction and first figure carry the main result.
      </figcaption>
    </figure>
  );
}
