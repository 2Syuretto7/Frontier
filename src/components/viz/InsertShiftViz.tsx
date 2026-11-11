"use client";

import { useState } from "react";

const START = ["a", "b", "c", "d", "e", "f", "g", "h"];
const CAP = 12;

/** An array is one block of memory: inserting in the middle shifts every later item one cell to the right. */
export function InsertShiftViz() {
  const [items, setItems] = useState<string[]>(START);
  const [pos, setPos] = useState(3);
  const [moved, setMoved] = useState<number[]>([]);
  const [total, setTotal] = useState(0);
  const p = Math.min(pos, items.length);
  const insert = () => {
    if (items.length >= CAP) return;
    const label = String.fromCharCode(65 + (total % 26));
    setMoved(Array.from({ length: items.length - p }, (_, k) => p + 1 + k));
    setTotal(total + 1);
    setItems([...items.slice(0, p), label, ...items.slice(p)]);
  };
  const remove = () => {
    if (!items.length || p >= items.length) return;
    setMoved(Array.from({ length: items.length - p - 1 }, (_, k) => p + k));
    setItems([...items.slice(0, p), ...items.slice(p + 1)]);
  };
  const C = 44, W = CAP * C + 10;
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} 96`} role="img" aria-label={`Array of ${items.length} items in ${CAP} cells: ${items.join(", ")}`}>
        {Array.from({ length: CAP }, (_, k) => (
          <g key={k}>
            <rect x={5 + k * C + 2} y={14} width={C - 4} height={C - 4} rx={4} className={k < items.length ? (moved.includes(k) ? "viz-cell is-on" : "viz-cell") : "viz-cell"} style={k >= items.length ? { opacity: 0.35 } : undefined} />
            <text x={5 + k * C + C / 2} y={14 + C / 2 + 2} textAnchor="middle" className="viz-label">{items[k] ?? ""}</text>
            <text x={5 + k * C + C / 2} y={78} textAnchor="middle" className="plot-tick">{1000 + 8 * k}</text>
          </g>
        ))}
        <path d={`M ${5 + p * C} 4 l 0 52`} className="plot-line" />
      </svg>
      <div className="viz-sliders">
        <label><span>Position <span className="mono">i = {p}</span></span><input type="range" min={0} max={items.length} value={p} onChange={(e) => { setPos(Number(e.target.value)); setMoved([]); }} /></label>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={insert} disabled={items.length >= CAP}>Insert at i</button>
        <button type="button" className="btn" onClick={remove} disabled={p >= items.length}>Delete at i</button>
        <button type="button" className="btn" onClick={() => { setItems(START); setMoved([]); setTotal(0); }}>Reset</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Cell k lives at address 1000 + 8k, so reading any cell is one multiplication and one memory access. The last operation moved{" "}
        <span className="mono">{moved.length}</span> item{moved.length === 1 ? "" : "s"} (highlighted). Inserting or deleting at position i of n items
        moves n − i of them: free at the end, n at the front. {items.length >= CAP && "The block is full: a dynamic array would now allocate a bigger one and copy."}
      </figcaption>
    </figure>
  );
}
