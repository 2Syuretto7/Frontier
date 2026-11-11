"use client";

import { useState } from "react";
import { fmtNum } from "./format";

const N = 10;
const W = 600, H = 260, top = 20, left = 30;
const r2 = (x: number) => Math.round(x * 100) / 100;

/** The first ten terms of an arithmetic or a geometric sequence, as bars, with their running total. */
export function SequenceViz() {
  const [kind, setKind] = useState<"arith" | "geom">("arith");
  const [a, setA] = useState(2);
  const [d, setD] = useState(3);
  const [r, setR] = useState(1.5);
  const terms = Array.from({ length: N }, (_, n) => (kind === "arith" ? a + n * d : a * r ** n));
  const sum = terms.reduce((s, t) => s + t, 0);
  const hi = Math.max(0, ...terms), lo = Math.min(0, ...terms);
  const span = hi - lo || 1;
  const y = (v: number) => top + ((hi - v) / span) * H;
  const bw = (W - left) / N;

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <button type="button" className={kind === "arith" ? "btn btn-primary" : "btn"} aria-pressed={kind === "arith"} onClick={() => setKind("arith")}>Arithmetic: add d</button>
        <button type="button" className={kind === "geom" ? "btn btn-primary" : "btn"} aria-pressed={kind === "geom"} onClick={() => setKind("geom")}>Geometric: multiply by r</button>
      </div>
      <svg viewBox={`0 0 ${W + 10} ${H + top + 30}`} role="img" aria-label={`The first ten terms: ${terms.map((t) => r2(t)).join(", ")}`}>
        <line x1={left} y1={y(0)} x2={W} y2={y(0)} className="viz-axis" />
        {terms.map((t, n) => {
          const x = left + n * bw + 6;
          const y0 = y(Math.max(0, t)), h = Math.abs(y(t) - y(0));
          return (
            <g key={n}>
              <rect x={x} y={y0} width={bw - 12} height={Math.max(h, 1)} className="viz-cell is-on" />
              <text x={x + (bw - 12) / 2} y={t >= 0 ? y0 - 5 : y0 + h + 13} textAnchor="middle" className="plot-tick">{fmtNum(r2(t))}</text>
              <text x={x + (bw - 12) / 2} y={H + top + 24} textAnchor="middle" className="viz-label">{n + 1}</text>
            </g>
          );
        })}
      </svg>
      <div className="viz-sliders">
        <label>
          <span>First term <span className="mono">a = {fmtNum(a)}</span></span>
          <input type="range" min={1} max={5} step={1} value={a} onChange={(e) => setA(Number(e.target.value))} />
        </label>
        {kind === "arith" ? (
          <label>
            <span>Difference <span className="mono">d = {fmtNum(d)}</span></span>
            <input type="range" min={-2} max={4} step={1} value={d} onChange={(e) => setD(Number(e.target.value))} />
          </label>
        ) : (
          <label>
            <span>Ratio <span className="mono">r = {r.toFixed(1)}</span></span>
            <input type="range" min={0.5} max={2} step={0.1} value={r} onChange={(e) => setR(Number(Number(e.target.value).toFixed(1)))} />
          </label>
        )}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {kind === "arith" ? (
          <>The <span className="mono">n</span>th term is <span className="mono">a + (n − 1)d</span>, so the bars climb in a straight line. The ten add to{" "}
            <span className="mono">{fmtNum(r2(sum))}</span>, which is ten times the average of the first and last, <span className="mono">5 × ({fmtNum(a)} + {fmtNum(r2(terms[N - 1]))})</span>.</>
        ) : (
          <>The <span className="mono">n</span>th term is <span className="mono">a·r<sup>n−1</sup></span>. The ten add to <span className="mono">{fmtNum(r2(sum))}</span>.{" "}
            {r < 1
              ? <>With <span className="mono">r</span> below 1 the bars shrink, and however many you add the total never passes <span className="mono">a ÷ (1 − r) = {fmtNum(r2(a / (1 - r)))}</span>.</>
              : r === 1
                ? <>With <span className="mono">r = 1</span> every term is the same.</>
                : <>With <span className="mono">r</span> above 1 each bar outgrows the one before by the same factor, and the total grows without limit.</>}
          </>
        )}
      </figcaption>
    </figure>
  );
}
