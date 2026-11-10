"use client";

import { useState } from "react";
import { Axes, scales, type View } from "./Plot";

const V: View = { xmin: 0, xmax: 10, ymin: 0, ymax: 10, w: 400, h: 400 };
// Two kinds of fruit: x = weight score, y = colour score. Hand-placed, with one stubborn overlap.
const A = [[1.5, 2], [2.5, 3.5], [3, 1.5], [1.8, 5], [4, 3], [3.5, 5.2], [2.2, 7], [5, 2], [6.3, 6.4]];
const B = [[6, 8], [7.5, 6], [8, 8.5], [5.5, 6.5], [7, 4.5], [8.5, 3.5], [6.5, 9], [4.5, 8.2], [9, 6]];

/** A straight-line decision boundary. Turn and slide it to separate the two classes. */
export function BoundaryViz() {
  const [angle, setAngle] = useState(20);
  const [offset, setOffset] = useState(0);
  const t = (angle * Math.PI) / 180;
  const nx = Math.cos(t), ny = Math.sin(t); // normal to the boundary
  const cx = 5, cy = 5;
  const side = (p: number[]) => (p[0] - cx) * nx + (p[1] - cy) * ny - offset;
  const correct = A.filter((p) => side(p) < 0).length + B.filter((p) => side(p) > 0).length;
  const { X, Y } = scales(V);
  // Boundary line: points with side = 0, drawn long and clipped by the plot.
  const px = cx + offset * nx, py = cy + offset * ny;
  const dx = -ny * 20, dy = nx * 20;
  // Shade the "B" half-plane with a large polygon.
  const shade = [[px + dx, py + dy], [px + dx + nx * 30, py + dy + ny * 30], [px - dx + nx * 30, py - dy + ny * 30], [px - dx, py - dy]];

  return (
    <figure className="viz">
      <Axes v={V} label={`A line classifier getting ${correct} of 18 right`}>
        <polygon points={shade.map(([a, b]) => `${X(a)},${Y(b)}`).join(" ")} className="viz-region" style={{ opacity: 0.35, strokeWidth: 0 }} />
        <line x1={X(px + dx)} y1={Y(py + dy)} x2={X(px - dx)} y2={Y(py - dy)} className="plot-curve" />
        {A.map((p, i) => <circle key={`a${i}`} cx={X(p[0])} cy={Y(p[1])} r={6} className={side(p) < 0 ? "plot-point" : "plot-hot"} style={{ fill: side(p) < 0 ? "var(--surface)" : undefined, stroke: side(p) < 0 ? "var(--text-muted)" : undefined, strokeWidth: 2 }} />)}
        {B.map((p, i) => <rect key={`b${i}`} x={X(p[0]) - 5.5} y={Y(p[1]) - 5.5} width={11} height={11} className={side(p) > 0 ? "plot-point" : "plot-hot"} />)}
      </Axes>
      <div className="viz-sliders">
        <label><span>Turn the line <span className="mono">{angle}°</span></span><input type="range" min={0} max={90} step={1} value={angle} onChange={(e) => setAngle(Number(e.target.value))} /></label>
        <label><span>Slide the line <span className="mono">{offset.toFixed(1)}</span></span><input type="range" min={-4} max={4} step={0.1} value={offset} onChange={(e) => setOffset(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Circles are one kind of fruit, squares the other. The model says &ldquo;square&rdquo; for everything in the shaded
        half and &ldquo;circle&rdquo; for the rest; anything it gets wrong turns red. It classifies{" "}
        <span className="mono">{correct}</span> of 18 correctly.{" "}
        {correct >= 17 ? "That is the best any straight line can do here: one circle sits among the squares, and no line can separate it." : "Can you do better?"}
      </figcaption>
    </figure>
  );
}
