"use client";

import { useState } from "react";

// a 3x3 binary image as 9 cells, row-major; D4 acts by quarter turns (anticlockwise) and a left-right mirror
type Img = number[];
const rot = (a: Img): Img =>
  Array.from({ length: 9 }, (_, i) => {
    const r = Math.floor(i / 3),
      c = i % 3;
    return a[c * 3 + (2 - r)];
  });
const flip = (a: Img): Img =>
  Array.from({ length: 9 }, (_, i) => a[Math.floor(i / 3) * 3 + (2 - (i % 3))]);
const NAMES = ["e", "r", "r²", "r³", "s", "rs", "r²s", "r³s"];

/** The eight images r^k s^f (a), in the order of NAMES. */
export function images(a: Img): Img[] {
  const out: Img[] = [];
  for (const start of [a, flip(a)]) {
    let x = start;
    for (let k = 0; k < 4; k++) {
      out.push(x);
      x = rot(x);
    }
  }
  return out;
}

export function OrbitStabiliserViz() {
  const [a, setA] = useState<Img>([1, 1, 0, 0, 1, 0, 0, 0, 0]);
  const ims = images(a);
  const keys = ims.map((x) => x.join(""));
  const orbit = new Set(keys).size;
  const stab = keys.filter((k) => k === keys[0]).length;
  const cell = 26;
  return (
    <figure className="viz">
      <svg
        viewBox="0 0 340 250"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="A three by three image you can edit, and its eight images under the symmetries of the square"
      >
        {a.map((v, i) => (
          <rect
            key={i}
            x={14 + (i % 3) * cell}
            y={40 + Math.floor(i / 3) * cell}
            width={cell - 2}
            height={cell - 2}
            fill={v ? "var(--accent)" : "var(--surface)"}
            stroke="var(--border-strong)"
            style={{ cursor: "pointer" }}
            role="button"
            aria-label={`cell ${i + 1}, ${v ? "on" : "off"}`}
            onClick={() => setA(a.map((w, j) => (j === i ? 1 - w : w)))}
          />
        ))}
        <text x={14} y={30} className="viz-label">
          click to edit
        </text>
        {ims.map((x, n) => {
          const ox = 110 + (n % 4) * 57,
            oy = 20 + Math.floor(n / 4) * 115;
          const fixed = keys[n] === keys[0];
          const repeat = keys.indexOf(keys[n]) < n;
          return (
            <g key={n} opacity={repeat ? 0.35 : 1}>
              {x.map((v, i) => (
                <rect
                  key={i}
                  x={ox + (i % 3) * 15}
                  y={oy + Math.floor(i / 3) * 15}
                  width={14}
                  height={14}
                  fill={v ? "var(--accent)" : "var(--surface)"}
                  stroke="var(--border)"
                />
              ))}
              {fixed && (
                <rect
                  x={ox - 3}
                  y={oy - 3}
                  width={50}
                  height={50}
                  fill="none"
                  stroke="var(--success)"
                  strokeWidth={2}
                />
              )}
              <text
                x={ox + 22}
                y={oy + 64}
                textAnchor="middle"
                className="viz-label"
              >
                {NAMES[n]}
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
        orbit size {orbit} × stabiliser size {stab} = {orbit * stab}
      </div>
      <figcaption className="viz-caption">
        Left: an image you can edit. Right: what each of the eight symmetries of
        the square does to it. Images that repeat an earlier one are faded; the
        symmetries that leave the image unchanged, its stabiliser, are boxed.
        The number of different images (the orbit) times the number of boxed
        symmetries is always 8, the size of the group.
      </figcaption>
    </figure>
  );
}
