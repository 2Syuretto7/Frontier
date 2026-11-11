"use client";

import { useState } from "react";

const PAGE = 256, PAGES = 8, FRAMES = 4, TLB_SIZE = 2;

type Mem = { table: (number | null)[]; frames: (number | null)[]; tlb: number[]; fifo: number[]; log: string; last: number; kind: "tlb" | "walk" | "fault" | null };

const START: Mem = { table: Array(PAGES).fill(null), frames: Array(FRAMES).fill(null), tlb: [], fifo: [], log: "", last: -1, kind: null };

function access(m: Mem, va: number): Mem {
  const vpn = Math.floor(va / PAGE), off = va % PAGE;
  const table = [...m.table], frames = [...m.frames];
  let tlb = m.tlb.filter((p) => p !== vpn), fifo = [...m.fifo], kind: Mem["kind"], extra = "";
  if (m.tlb.includes(vpn)) kind = "tlb";
  else if (table[vpn] !== null) kind = "walk";
  else {
    kind = "fault";
    let f = frames.indexOf(null);
    if (f < 0) {
      const victim = fifo.shift()!;
      f = table[victim]!;
      table[victim] = null;
      tlb = tlb.filter((p) => p !== victim);
      extra = ` Memory was full, so page ${victim} was evicted from frame ${f}.`;
    }
    frames[f] = vpn;
    table[vpn] = f;
    fifo.push(vpn);
  }
  tlb.push(vpn);
  if (tlb.length > TLB_SIZE) tlb = tlb.slice(-TLB_SIZE);
  const pa = table[vpn]! * PAGE + off;
  const what = kind === "tlb" ? "TLB hit: no table lookup at all." : kind === "walk" ? "TLB miss: the page table supplied the frame." : `Page fault: the OS loaded page ${vpn} into frame ${table[vpn]}.${extra}`;
  return { table, frames, tlb, fifo, kind, last: vpn, log: `Virtual ${va} = page ${vpn}, offset ${off} → physical ${pa}. ${what}` };
}

/** Eight virtual pages of 256 bytes, four physical frames and a 2-entry TLB: each access is a TLB hit, a page-table walk or a page fault. */
export function PageTableViz() {
  const [va, setVa] = useState(600);
  const [m, setM] = useState<Mem>(START);
  const C = 30;
  const box = (x: number, y: number, label: string, on: boolean, hl: boolean, key: string) => (
    <g key={key}>
      <rect x={x} y={y} width={C * 2} height={C - 4} rx={4} className={on ? "viz-cell is-on" : "viz-cell"} style={hl ? { stroke: m.kind === "fault" ? "var(--danger)" : "var(--success)", strokeWidth: 2.5 } : undefined} />
      <text x={x + C} y={y + C / 2 + 2} textAnchor="middle" className="viz-label mono" style={{ fontSize: 11 }}>{label}</text>
    </g>
  );
  const vpn = Math.floor(va / PAGE);
  return (
    <figure className="viz">
      <div className="viz-sliders">
        <label>
          <span>Virtual address {va} (page {vpn}, offset {va % PAGE})</span>
          <input type="range" min={0} max={PAGES * PAGE - 1} step={4} value={va} onChange={(e) => setVa(Number(e.target.value))} aria-label="Virtual address" />
        </label>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setM(access(m, va))}>Access</button>
        <button type="button" className="btn" onClick={() => setM(START)}>Reset</button>
      </div>
      <svg viewBox={`0 0 330 ${PAGES * C + 26}`} role="img" aria-label={m.log || "Nothing accessed yet"} style={{ maxWidth: 520 }}>
        <text x={40} y={12} textAnchor="middle" className="plot-tick">TLB</text>
        <text x={150} y={12} textAnchor="middle" className="plot-tick">page table</text>
        <text x={275} y={12} textAnchor="middle" className="plot-tick">frames</text>
        {Array.from({ length: TLB_SIZE }, (_, i) => {
          const p = m.tlb[i];
          return box(10, 20 + i * C, p === undefined ? "" : `${p}→${m.table[p]}`, p !== undefined, p === m.last && m.kind === "tlb", `t${i}`);
        })}
        {m.table.map((f, p) => (
          <g key={`p${p}`}>
            <text x={112} y={20 + p * C + C / 2 + 2} textAnchor="end" className="plot-tick" style={{ fontSize: 10 }}>{p}</text>
            {box(120, 20 + p * C, f === null ? "invalid" : `frame ${f}`, f !== null, p === m.last && m.kind !== "tlb", `pt${p}`)}
          </g>
        ))}
        {m.frames.map((p, f) => box(245, 20 + f * C, p === null ? "free" : `page ${p}`, p !== null, p === m.last, `f${f}`))}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        {m.log || "Pick an address and press Access. Nothing is in memory yet, so the first touch of each page faults."} Pages are
        evicted first-in, first-out when all four frames are full.
      </figcaption>
    </figure>
  );
}
