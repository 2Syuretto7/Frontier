"use client";

import { useState } from "react";
import { Axes, curvePath, scales, type View } from "./Plot";
import { fmtNum } from "./format";

const V: View = { xmin: -6, xmax: 6, ymin: -6, ymax: 6, w: 420, h: 420 };
const r2 = (n: number) => Math.round(n * 100) / 100;

/** The line through two points: its slope as rise over run, its equation, and the perpendicular through the first point. */
export function SlopeViz() {
  const [px, setPx] = useState(-3), [py, setPy] = useState(-2);
  const [qx, setQx] = useState(3), [qy, setQy] = useState(2);
  const [perp, setPerp] = useState(false);
  const { X, Y } = scales(V);
  const run = qx - px, rise = qy - py;
  const vertical = run === 0;
  const m = vertical ? NaN : rise / run;
  const c = py - m * px;
  const same = run === 0 && rise === 0;

  return (
    <figure className="viz">
      <Axes v={V} label="The line through P and Q with its rise and run">
        {!same && (vertical
          ? <line x1={X(px)} y1={0} x2={X(px)} y2={V.h} className="plot-curve" />
          : <path d={curvePath(V, (x) => m * x + c, 2)} className="plot-curve" />)}
        {perp && !same && (rise === 0
          ? <line x1={X(px)} y1={0} x2={X(px)} y2={V.h} className="plot-curve-2" />
          : <path d={curvePath(V, (x) => (-run / rise) * (x - px) + py, 2)} className="plot-curve-2" />)}
        {run !== 0 && <line x1={X(px)} y1={Y(py)} x2={X(qx)} y2={Y(py)} className="plot-mirror" style={{ strokeDasharray: "none", strokeWidth: 2 }} />}
        {rise !== 0 && <line x1={X(qx)} y1={Y(py)} x2={X(qx)} y2={Y(qy)} className="plot-line" strokeWidth={2} />}
        {run !== 0 && <text x={X((px + qx) / 2)} y={Y(py) + (rise >= 0 ? 16 : -8)} textAnchor="middle" className="viz-label">run {fmtNum(run)}</text>}
        {rise !== 0 && <text x={X(qx) + (run >= 0 ? 6 : -6)} y={Y((py + qy) / 2) + 4} textAnchor={run >= 0 ? "start" : "end"} className="viz-label">rise {fmtNum(rise)}</text>}
        <circle cx={X(px)} cy={Y(py)} r={5.5} className="plot-point" />
        <circle cx={X(qx)} cy={Y(qy)} r={5.5} className="plot-hot" />
        <text x={X(px) - 8} y={Y(py) - 8} textAnchor="end" className="viz-label">P</text>
        <text x={X(qx) + 8} y={Y(qy) - 8} className="viz-label">Q</text>
      </Axes>
      <div className="viz-sliders">
        <label><span>P across <span className="mono">{fmtNum(px)}</span></span><input type="range" min={-5} max={5} step={1} value={px} onChange={(e) => setPx(Number(e.target.value))} /></label>
        <label><span>P up <span className="mono">{fmtNum(py)}</span></span><input type="range" min={-5} max={5} step={1} value={py} onChange={(e) => setPy(Number(e.target.value))} /></label>
        <label><span>Q across <span className="mono">{fmtNum(qx)}</span></span><input type="range" min={-5} max={5} step={1} value={qx} onChange={(e) => setQx(Number(e.target.value))} /></label>
        <label><span>Q up <span className="mono">{fmtNum(qy)}</span></span><input type="range" min={-5} max={5} step={1} value={qy} onChange={(e) => setQy(Number(e.target.value))} /></label>
      </div>
      <div className="viz-controls">
        <button type="button" className={perp ? "btn btn-primary" : "btn"} aria-pressed={perp} onClick={() => setPerp(!perp)}>Perpendicular through P</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {same
          ? <>P and Q are the same point, and one point does not fix a line. Move one of them.</>
          : vertical
            ? <>The run is 0, so the slope is undefined: the line is vertical, <span className="mono">x = {fmtNum(px)}</span>.</>
            : <>Slope <span className="mono">m = {fmtNum(rise)} / {fmtNum(run)} = {fmtNum(r2(m))}</span>, and the line is{" "}
                <span className="mono">y = {fmtNum(r2(m))}x{r2(c) === 0 ? "" : ` ${c < 0 ? "−" : "+"} ${fmtNum(r2(Math.abs(c)))}`}</span>.
                {perp && (rise === 0 ? <> The perpendicular is vertical.</> : <> The perpendicular has slope <span className="mono">{fmtNum(r2(-run / rise))}</span>, and the two slopes multiply to <span className="mono">−1</span>.</>)}</>}{" "}
        {!same && <>The distance PQ is <span className="mono">√({fmtNum(run * run)} + {fmtNum(rise * rise)}) ≈ {Math.hypot(run, rise).toFixed(2)}</span>.</>}
      </figcaption>
    </figure>
  );
}
