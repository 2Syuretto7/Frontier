import { useId, type ReactNode } from "react";
import { fmtNum } from "./format";

export type View = { xmin: number; xmax: number; ymin: number; ymax: number; w: number; h: number };

export function scales(v: View) {
  const X = (x: number) => ((x - v.xmin) / (v.xmax - v.xmin)) * v.w;
  const Y = (y: number) => v.h - ((y - v.ymin) / (v.ymax - v.ymin)) * v.h;
  return { X, Y };
}

/** Samples a function into an SVG path, breaking it where it is undefined or leaves the view. */
export function curvePath(v: View, f: (x: number) => number, samples = 400) {
  const { X, Y } = scales(v);
  let d = "";
  let pen = false;
  const pad = (v.ymax - v.ymin) * 2;
  for (let i = 0; i <= samples; i++) {
    const x = v.xmin + ((v.xmax - v.xmin) * i) / samples;
    const y = f(x);
    if (!Number.isFinite(y) || y > v.ymax + pad || y < v.ymin - pad) { pen = false; continue; }
    d += `${pen ? "L" : "M"}${X(x).toFixed(1)} ${Y(y).toFixed(1)} `;
    pen = true;
  }
  return d;
}

/** Parametric curve, for shapes that are not graphs of functions (circles, sideways parabolas). */
export function paramPath(v: View, p: (t: number) => [number, number], t0: number, t1: number, samples = 400) {
  const { X, Y } = scales(v);
  let d = "";
  for (let i = 0; i <= samples; i++) {
    const [x, y] = p(t0 + ((t1 - t0) * i) / samples);
    d += `${i ? "L" : "M"}${X(x).toFixed(1)} ${Y(y).toFixed(1)} `;
  }
  return d;
}

/** Axes with a light grid and integer ticks. Children are drawn on top, in the same coordinates. */
export function Axes({ v, children, label }: { v: View; children?: ReactNode; label: string }) {
  const { X, Y } = scales(v);
  const clip = `plot-clip-${useId().replace(/:/g, "")}`;
  const xs: number[] = [], ys: number[] = [];
  const stepX = v.xmax - v.xmin > 16 ? 2 : 1, stepY = v.ymax - v.ymin > 16 ? 2 : 1;
  for (let x = Math.ceil(v.xmin / stepX) * stepX; x <= v.xmax; x += stepX) xs.push(x);
  for (let y = Math.ceil(v.ymin / stepY) * stepY; y <= v.ymax; y += stepY) ys.push(y);
  return (
    <svg viewBox={`-28 -8 ${v.w + 40} ${v.h + 30}`} role="img" aria-label={label} className="plot">
      <defs>
        <clipPath id={clip}><rect x={0} y={0} width={v.w} height={v.h} /></clipPath>
      </defs>
      {xs.map((x) => <line key={`gx${x}`} x1={X(x)} y1={0} x2={X(x)} y2={v.h} className="plot-grid" />)}
      {ys.map((y) => <line key={`gy${y}`} x1={0} y1={Y(y)} x2={v.w} y2={Y(y)} className="plot-grid" />)}
      {v.ymin <= 0 && v.ymax >= 0 && <line x1={0} y1={Y(0)} x2={v.w} y2={Y(0)} className="viz-axis" />}
      {v.xmin <= 0 && v.xmax >= 0 && <line x1={X(0)} y1={0} x2={X(0)} y2={v.h} className="viz-axis" />}
      {xs.filter((x) => x !== 0).map((x) => (
        <text key={`tx${x}`} x={X(x)} y={Math.min(v.h, Math.max(0, Y(0))) + 14} textAnchor="middle" className="plot-tick">{fmtNum(x)}</text>
      ))}
      {ys.filter((y) => y !== 0).map((y) => (
        <text key={`ty${y}`} x={Math.min(v.w, Math.max(0, X(0))) - 5} y={Y(y) + 4} textAnchor="end" className="plot-tick">{fmtNum(y)}</text>
      ))}
      <g clipPath={`url(#${clip})`}>{children}</g>
    </svg>
  );
}

/** An arrow in screen coordinates, from (x1, y1) to (x2, y2), with a filled head. */
export function Arrow({ x1, y1, x2, y2, className = "plot-arrow", head = 9 }: { x1: number; y1: number; x2: number; y2: number; className?: string; head?: number }) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1) return null;
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  const bx = x2 - ux * head, by = y2 - uy * head;
  const w = head * 0.45;
  return (
    <g className={className}>
      <line x1={x1} y1={y1} x2={bx} y2={by} />
      <path d={`M${x2} ${y2} L${bx - uy * w} ${by + ux * w} L${bx + uy * w} ${by - ux * w} Z`} style={{ fill: "currentColor", stroke: "none" }} />
    </g>
  );
}
