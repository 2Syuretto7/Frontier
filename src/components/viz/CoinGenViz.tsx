"use client";

import { useState } from "react";

const COINS = [1, 2, 5, 10];
const MAX = 20;

/** Multiplying generating functions 1/(1 − xᶜ) counts the ways to make each amount from the chosen coins. */
export function CoinGenViz() {
  const [on, setOn] = useState([true, true, true, false]);
  const [n, setN] = useState(10);
  const chosen = COINS.filter((_, i) => on[i]);
  let coef = Array.from({ length: MAX + 1 }, (_, i) => (i === 0 ? 1 : 0));
  for (const c of chosen) {
    const next = [...coef];
    for (let i = c; i <= MAX; i++) next[i] += next[i - c];
    coef = next;
  }
  const top = Math.max(1, ...coef);
  const W = 560, H = 220, bw = (W - 20) / (MAX + 1);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        {COINS.map((c, i) => (
          <button key={c} type="button" className={on[i] ? "viz-chip is-on" : "viz-chip"} aria-pressed={on[i]} onClick={() => setOn(on.map((v, j) => (j === i ? !v : v)))}>{c}-rupee coin</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label={`Coefficients of the generating function up to x to the ${MAX}`}>
        {coef.map((v, i) => {
          const h = (v / top) * (H - 20);
          return (
            <g key={i} onClick={() => setN(i)} style={{ cursor: "pointer" }}>
              <rect x={10 + i * bw + 2} y={H - h} width={bw - 4} height={h} className={i === n ? "viz-cell is-on" : "viz-cell"} />
              <text x={10 + i * bw + bw / 2} y={H + 16} textAnchor="middle" className="plot-tick">{i}</text>
            </g>
          );
        })}
      </svg>
      <div className="viz-sliders">
        <label><span>Amount <span className="mono">n = {n}</span></span><input type="range" min={0} max={MAX} value={n} onChange={(e) => setN(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {chosen.length === 0 ? <>With no coins, only the amount 0 can be made, in one way. </> : (
          <>The generating function is <span className="mono">{chosen.map((c) => `1/(1 − x${c === 1 ? "" : `^${c}`})`).join(" · ")}</span>. </>
        )}
        The coefficient of xⁿ, the bar above n, is the number of ways to make n rupees: <span className="mono">{coef[n]}</span> for n = {n}.
        Multiplying by one more factor 1/(1 − xᶜ) adds the option of any number of c-rupee coins.
      </figcaption>
    </figure>
  );
}
