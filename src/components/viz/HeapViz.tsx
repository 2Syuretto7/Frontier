"use client";

import { useState } from "react";

const START = [2, 5, 3, 9, 6, 4, 8, 12, 10];

/** A binary min-heap drawn as a tree and as the array that stores it: push sifts up, pop sifts down. */
export function HeapViz() {
  const [a, setA] = useState<number[]>(START);
  const [path, setPath] = useState<number[]>([]);
  const [msg, setMsg] = useState("Each parent is at most its children; the minimum is at index 0.");
  const [next, setNext] = useState(7);
  const push = () => {
    if (a.length >= 15) return;
    const h = [...a, next]; let i = h.length - 1; const p = [i]; let swaps = 0;
    while (i > 0 && h[(i - 1) >> 1] > h[i]) { const j = (i - 1) >> 1; [h[i], h[j]] = [h[j], h[i]]; i = j; p.push(i); swaps++; }
    setA(h); setPath(p); setMsg(`Pushed ${next} at index ${h.length - 1} and sifted it up with ${swaps} swap${swaps === 1 ? "" : "s"}.`);
    setNext(((next * 7 + 3) % 23) + 1);
  };
  const pop = () => {
    if (!a.length) return;
    const h = [...a]; const top = h[0]; const last = h.pop()!; let swaps = 0; const p = [0];
    if (h.length) {
      h[0] = last; let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < h.length && h[l] < h[m]) m = l;
        if (r < h.length && h[r] < h[m]) m = r;
        if (m === i) break;
        [h[i], h[m]] = [h[m], h[i]]; i = m; p.push(i); swaps++;
      }
    }
    setA(h); setPath(p); setMsg(`Popped ${top}; moved the last item to the root and sifted it down with ${swaps} swap${swaps === 1 ? "" : "s"}.`);
  };
  const W = 560, pos = (i: number) => { const d = Math.floor(Math.log2(i + 1)); const k = i + 1 - 2 ** d; return [((k + 0.5) / 2 ** d) * W, 22 + d * 46]; };
  const C = W / 15;
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} 250`} role="img" aria-label={`Min-heap of ${a.length} items: ${a.join(", ")}`}>
        {a.map((_, i) => { if (!i) return null; const [x1, y1] = pos((i - 1) >> 1), [x2, y2] = pos(i); return <line key={`e${i}`} x1={x1} y1={y1} x2={x2} y2={y2} className="plot-line" />; })}
        {a.map((v, i) => { const [x, y] = pos(i); return (
          <g key={i}>
            <circle cx={x} cy={y} r={15} className={path.includes(i) ? "viz-node is-paired" : "viz-node"} />
            <text x={x} y={y + 5} textAnchor="middle" className="viz-label">{v}</text>
          </g>
        ); })}
        {a.map((v, i) => (
          <g key={`a${i}`}>
            <rect x={i * C + 2} y={196} width={C - 4} height={28} rx={4} className={path.includes(i) ? "viz-cell is-on" : "viz-cell"} />
            <text x={i * C + C / 2} y={215} textAnchor="middle" className="viz-label">{v}</text>
            <text x={i * C + C / 2} y={242} textAnchor="middle" className="plot-tick">{i}</text>
          </g>
        ))}
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={push} disabled={a.length >= 15}>Push {next}</button>
        <button type="button" className="btn" onClick={pop} disabled={!a.length}>Pop minimum</button>
        <button type="button" className="btn" onClick={() => { setA(START); setPath([]); setMsg("Each parent is at most its children; the minimum is at index 0."); }}>Reset</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {msg} The children of index i are at 2i + 1 and 2i + 2, and its parent at ⌊(i − 1)/2⌋, so the tree needs no pointers. Every path is at most
        ⌊log₂ n⌋ = <span className="mono">{a.length ? Math.floor(Math.log2(a.length)) : 0}</span> edges long, which bounds the swaps.
      </figcaption>
    </figure>
  );
}
