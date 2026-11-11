"use client";

import { useState } from "react";

const CAP = 8;

/** A queue in a fixed array: head and tail chase each other round the ring, so neither end ever shifts. */
export function RingBufferViz() {
  const [slots, setSlots] = useState<(number | null)[]>(Array(CAP).fill(null));
  const [head, setHead] = useState(0);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState(1);
  const [msg, setMsg] = useState("Empty: head = 0, count = 0.");
  const tail = (head + count) % CAP;
  const push = () => {
    if (count === CAP) { setMsg("Full: a bounded queue refuses, or a dynamic one copies into a bigger ring."); return; }
    const s = [...slots]; s[tail] = next; setSlots(s);
    setMsg(`Enqueued ${next} at slot (head + count) mod ${CAP} = ${tail}.`);
    setCount(count + 1); setNext(next + 1);
  };
  const pop = () => {
    if (!count) { setMsg("Empty: nothing to dequeue."); return; }
    const s = [...slots]; const v = s[head]; s[head] = null; setSlots(s);
    setMsg(`Dequeued ${v} from slot ${head}; head moves to ${(head + 1) % CAP}.`);
    setHead((head + 1) % CAP); setCount(count - 1);
  };
  const R = 92, cx = 150, cy = 120;
  const pos = (i: number, r = R) => { const a = (2 * Math.PI * i) / CAP - Math.PI / 2; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  return (
    <figure className="viz">
      <svg viewBox="0 0 300 240" role="img" aria-label={`Ring buffer with ${count} items, head at slot ${head}`} style={{ maxWidth: 360 }}>
        {slots.map((v, i) => {
          const [x, y] = pos(i);
          const [lx, ly] = pos(i, R + 34);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={22} className={v !== null ? "viz-node is-paired" : "viz-node"} />
              <text x={x} y={y + 5} textAnchor="middle" className="viz-label">{v ?? ""}</text>
              <text x={lx} y={ly + 4} textAnchor="middle" className="plot-tick">{i === head && i === tail ? "head, tail" : i === head ? "head" : i === tail ? "tail" : i}</text>
            </g>
          );
        })}
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={push}>Enqueue</button>
        <button type="button" className="btn" onClick={pop}>Dequeue</button>
        <button type="button" className="btn" onClick={() => { setSlots(Array(CAP).fill(null)); setHead(0); setCount(0); setNext(1); setMsg("Empty: head = 0, count = 0."); }}>Reset</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {msg} The queue holds <span className="mono">{count}</span> of {CAP}. Both operations touch one slot and update an index modulo {CAP}, so each is O(1);
        keep enqueuing and dequeuing and watch the queue travel round the ring.
      </figcaption>
    </figure>
  );
}
