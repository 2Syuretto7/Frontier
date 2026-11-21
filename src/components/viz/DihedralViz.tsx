"use client";

import { useState } from "react";

// an element of D4 is r^k s^f: first flip (if f = 1) across the vertical axis, then rotate by k quarter turns anticlockwise
type El = { k: number; f: number };
const SHAPE: [number, number][] = [
  [-0.5, -0.8],
  [-0.2, -0.8],
  [-0.2, -0.1],
  [0.3, -0.1],
  [0.3, 0.2],
  [-0.2, 0.2],
  [-0.2, 0.5],
  [0.5, 0.5],
  [0.5, 0.8],
  [-0.5, 0.8],
];

/** Left-multiply g by r or by s, using s r^k = r^(-k) s. */
export function apply(g: El, by: "r" | "s"): El {
  return by === "r"
    ? { k: (g.k + 1) % 4, f: g.f }
    : { k: (4 - g.k) % 4, f: 1 - g.f };
}

export function act(g: El, [x, y]: [number, number]): [number, number] {
  let p: [number, number] = g.f ? [-x, y] : [x, y];
  for (let i = 0; i < g.k; i++) p = [-p[1], p[0]];
  return p;
}

const name = (g: El) =>
  (g.k === 0 ? (g.f ? "" : "e") : g.k === 1 ? "r" : `r${"⁰¹²³"[g.k]}`) +
  (g.f ? "s" : "");

const ALL: El[] = [0, 1].flatMap((f) => [0, 1, 2, 3].map((k) => ({ k, f })));

export function DihedralViz() {
  const [g, setG] = useState<El>({ k: 0, f: 0 });
  const [hist, setHist] = useState<string>("");
  const press = (b: "r" | "s") => {
    setG(apply(g, b));
    setHist((h) => (b + h).slice(0, 14));
  };
  const poly = (el: El, cx: number, cy: number, sc: number) =>
    SHAPE.map((p) => act(el, p))
      .map(([x, y]) => `${cx + x * sc},${cy - y * sc}`)
      .join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <button type="button" className="btn" onClick={() => press("r")}>
          rotate r
        </button>
        <button type="button" className="btn" onClick={() => press("s")}>
          flip s
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setG({ k: 0, f: 0 });
            setHist("");
          }}
        >
          reset
        </button>
      </div>
      <svg
        viewBox="0 0 340 200"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="A letter-like shape transformed by the current symmetry of the square, beside the eight possible results"
      >
        <rect
          x={20}
          y={30}
          width={140}
          height={140}
          fill="none"
          stroke="var(--border-strong)"
        />
        <line
          x1={90}
          y1={24}
          x2={90}
          y2={176}
          stroke="var(--grid-line)"
          strokeDasharray="3 3"
        />
        <polygon
          points={poly(g, 90, 100, 60)}
          fill="var(--accent)"
          fillOpacity={0.8}
        />
        {ALL.map((el, i) => {
          const cx = 200 + (i % 4) * 36,
            cy = 62 + Math.floor(i / 4) * 80;
          const on = el.k === g.k && el.f === g.f;
          return (
            <g key={i}>
              <rect
                x={cx - 16}
                y={cy - 16}
                width={32}
                height={32}
                fill="none"
                stroke={on ? "var(--accent)" : "var(--border)"}
                strokeWidth={on ? 2 : 1}
              />
              <polygon
                points={poly(el, cx, cy, 13)}
                fill={on ? "var(--accent)" : "var(--text-faint)"}
              />
              <text
                x={cx}
                y={cy + 30}
                textAnchor="middle"
                className="viz-label"
              >
                {name(el)}
              </text>
            </g>
          );
        })}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        pressed (latest first): {hist || "nothing"} = {name(g)}
      </div>
      <figcaption className="viz-caption">
        Rotate by a quarter turn (r) or flip across the dashed axis (s), in any
        order and as often as you like. However long the sequence, the result is
        always one of the eight symmetries on the right, written rᵏ or rᵏs.
        Flipping, rotating and flipping again undoes the rotation: srs = r³.
      </figcaption>
    </figure>
  );
}
