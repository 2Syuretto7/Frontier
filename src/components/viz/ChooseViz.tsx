"use client";

import { useState } from "react";

const LETTERS = "ABCDEF";
const fact = (k: number): number => (k <= 1 ? 1 : k * fact(k - 1));

function subsets(n: number, r: number): number[][] {
  const out: number[][] = [];
  const go = (start: number, acc: number[]) => {
    if (acc.length === r) { out.push(acc); return; }
    for (let i = start; i < n; i++) go(i + 1, [...acc, i]);
  };
  go(0, []);
  return out;
}

/** Every way to choose r things from n, listed: there are n! / (r! (n − r)!) of them. */
export function ChooseViz() {
  const [n, setN] = useState(5);
  const [r, setR] = useState(2);
  const rr = Math.min(r, n);
  const list = subsets(n, rr);
  const perCol = 10;
  const cols = Math.ceil(list.length / perCol);
  const colW = n * 20 + 30;
  const x0 = Math.max(10, (620 - cols * colW) / 2);
  const ordered = fact(n) / fact(n - rr);

  return (
    <figure className="viz">
      <svg viewBox="0 0 620 230" role="img" aria-label={`All ${list.length} ways to choose ${rr} of ${n} items`}>
        {list.map((set, k) => {
          const cx = x0 + Math.floor(k / perCol) * colW, cy = 18 + (k % perCol) * 21;
          return (
            <g key={k}>
              {Array.from({ length: n }, (_, i) => (
                <g key={i}>
                  <circle cx={cx + i * 20 + 8} cy={cy} r={8} className={set.includes(i) ? "viz-cell is-on" : "viz-cell"} />
                  {set.includes(i) && <text x={cx + i * 20 + 8} y={cy + 3.5} textAnchor="middle" className="plot-tick" style={{ fontSize: 9 }}>{LETTERS[i]}</text>}
                </g>
              ))}
            </g>
          );
        })}
      </svg>
      <div className="viz-sliders">
        <label>
          <span>Items <span className="mono">n = {n}</span></span>
          <input type="range" min={1} max={6} step={1} value={n} onChange={(e) => { const m = Number(e.target.value); setN(m); setR(Math.min(r, m)); }} />
        </label>
        <label>
          <span>Chosen <span className="mono">r = {rr}</span></span>
          <input type="range" min={0} max={n} step={1} value={rr} onChange={(e) => setR(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        There are <span className="mono">{list.length}</span> ways to choose {rr} of the {n} letters {LETTERS.slice(0, n).split("").join(", ")}.
        Picking them in order would give <span className="mono">{n}{rr > 1 ? ` × ${Array.from({ length: rr - 1 }, (_, i) => n - 1 - i).join(" × ")}` : ""} = {ordered}</span>{" "}
        {rr === 0 ? "(the empty choice)" : "lists"}, but each set appears in <span className="mono">{rr}! = {fact(rr)}</span> orders, so{" "}
        <span className="mono">C({n}, {rr}) = {ordered} ÷ {fact(rr)} = {list.length}</span>.
      </figcaption>
    </figure>
  );
}
