"use client";

import { useState } from "react";

type Node = { n: number; kids?: [Node, Node] };

function split(n: number): Node {
  for (let d = 2; d * d <= n; d++) {
    if (n % d === 0) {
      // split into the most balanced pair, to show that both parts are smaller than n
      let a = d;
      for (let e = Math.floor(Math.sqrt(n)); e >= 2; e--) if (n % e === 0) { a = e; break; }
      return { n, kids: [split(a), split(n / a)] };
    }
  }
  return { n };
}

function leaves(t: Node): number[] {
  return t.kids ? [...leaves(t.kids[0]), ...leaves(t.kids[1])] : [t.n];
}
function depth(t: Node): number {
  return t.kids ? 1 + Math.max(depth(t.kids[0]), depth(t.kids[1])) : 0;
}
function width(t: Node): number {
  return t.kids ? width(t.kids[0]) + width(t.kids[1]) : 1;
}

function Draw({ t, x0, x1, y, dy }: { t: Node; x0: number; x1: number; y: number; dy: number }) {
  const cx = (x0 + x1) / 2;
  if (!t.kids) {
    return <g><circle cx={cx} cy={y} r={17} className="viz-cell is-on" /><text x={cx} y={y + 5} textAnchor="middle" className="viz-label is-on">{t.n}</text></g>;
  }
  const wl = width(t.kids[0]), wr = width(t.kids[1]);
  const mid = x0 + ((x1 - x0) * wl) / (wl + wr);
  const lc = (x0 + mid) / 2, rc = (mid + x1) / 2;
  return (
    <g>
      <line x1={cx} y1={y + 17} x2={lc} y2={y + dy - 17} className="plot-ghost" />
      <line x1={cx} y1={y + 17} x2={rc} y2={y + dy - 17} className="plot-ghost" />
      <rect x={cx - 22} y={y - 15} width={44} height={30} rx={6} className="viz-cell" />
      <text x={cx} y={y + 5} textAnchor="middle" className="viz-label">{t.n}</text>
      <Draw t={t.kids[0]} x0={x0} x1={mid} y={y + dy} dy={dy} />
      <Draw t={t.kids[1]} x0={mid} x1={x1} y={y + dy} dy={dy} />
    </g>
  );
}

/** Strong induction: a number is prime, or it splits into two smaller numbers, each already known to factor. */
export function FactorTreeViz() {
  const [n, setN] = useState(360);
  const t = split(n);
  const d = depth(t);
  const dy = d ? Math.min(60, 200 / d) : 60;
  const ps = leaves(t).sort((a, b) => a - b);

  return (
    <figure className="viz">
      <svg viewBox={`0 0 620 ${50 + d * dy}`} role="img" aria-label={`Factor tree of ${n}: ${ps.join(" × ")}`}>
        <Draw t={t} x0={20} x1={600} y={28} dy={dy} />
      </svg>
      <div className="viz-controls">
        <label className="viz-stepper-label" style={{ flex: 1 }}>
          n = <span className="mono">{n}</span>
          <input type="range" className="viz-range" min={2} max={1000} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {t.kids
          ? <>{n} is not prime, so it splits as {t.kids[0].n} × {t.kids[1].n}, two numbers <em>smaller</em> than {n}. Strong induction lets us assume every smaller number already factors into primes, so {n} does too: <span className="mono">{n} = {ps.join(" × ")}</span>. Ordinary induction, which assumes only the case n − 1, would be no help here.</>
          : <>{n} is prime: it is its own factorisation. Move the slider to a composite number.</>}
      </figcaption>
    </figure>
  );
}
