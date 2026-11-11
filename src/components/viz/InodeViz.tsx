"use client";

import { useState } from "react";

const B = 4096, PER = 1024, D = 12;
const SIZES = [1, 2048, 4096, 30000, 49152, 49153, 1e6, 4.2e6, 4.3e6, 1e8, 1e9, 4e9];

function fmt(n: number) {
  if (n >= 2 ** 30) return `${(n / 2 ** 30).toFixed(2)} GiB`;
  if (n >= 2 ** 20) return `${(n / 2 ** 20).toFixed(1)} MiB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KiB`;
  return `${n} B`;
}

/** An ext2-style inode: 12 direct block pointers, then single and double indirect blocks of 1024 pointers each. */
export function InodeViz() {
  const [k, setK] = useState(6);
  const size = SIZES[k];
  const data = Math.ceil(size / B);
  const direct = Math.min(data, D);
  const single = Math.max(0, Math.min(data - D, PER));
  const dbl = Math.max(0, data - D - PER);
  const children = Math.ceil(dbl / PER);
  const meta = (single > 0 ? 1 : 0) + (dbl > 0 ? 1 + children : 0);
  const lastReads = data <= D ? 1 : data <= D + PER ? 2 : 3;
  const W = 420;
  const slot = (x: number, y: number, on: boolean, key: string) => (
    <rect key={key} x={x} y={y} width={14} height={14} rx={2} className={on ? "viz-cell is-on" : "viz-cell"} />
  );
  return (
    <figure className="viz">
      <div className="viz-sliders">
        <label>
          <span>File size {fmt(size)}</span>
          <input type="range" min={0} max={SIZES.length - 1} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="File size" />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} 150`} role="img" aria-label={`${data} data blocks and ${meta} pointer blocks`}>
        <rect x={4} y={8} width={W - 8} height={56} rx={6} className="viz-cell" style={{ fillOpacity: 0.15 }} />
        <text x={12} y={24} className="plot-tick">inode: size, owner, permissions, times, link count</text>
        {Array.from({ length: D }, (_, i) => slot(12 + i * 18, 36, i < direct, `d${i}`))}
        <text x={12 + 6 * 18} y={78} textAnchor="middle" className="plot-tick" style={{ fontSize: 10 }}>12 direct pointers</text>
        {slot(240, 36, single > 0, "s")}
        {slot(300, 36, dbl > 0, "dd")}
        <text x={247} y={78} textAnchor="middle" className="plot-tick" style={{ fontSize: 10 }}>single</text>
        <text x={307} y={78} textAnchor="middle" className="plot-tick" style={{ fontSize: 10 }}>double</text>
        <line x1={247} y1={50} x2={247} y2={96} className="viz-link" style={{ opacity: single > 0 ? 1 : 0.3 }} />
        <line x1={307} y1={50} x2={307} y2={96} className="viz-link" style={{ opacity: dbl > 0 ? 1 : 0.3 }} />
        <rect x={200} y={96} width={94} height={16} rx={3} className="viz-cell" />
        <rect x={200} y={96} width={(94 * single) / PER} height={16} rx={3} className="viz-cell is-on" />
        <text x={247} y={126} textAnchor="middle" className="plot-tick" style={{ fontSize: 10 }}>{single} of 1024 used</text>
        <rect x={300} y={96} width={110} height={16} rx={3} className="viz-cell" />
        <rect x={300} y={96} width={Math.max(dbl > 0 ? 2 : 0, (110 * dbl) / (PER * PER))} height={16} rx={3} className="viz-cell is-on" />
        <text x={355} y={126} textAnchor="middle" className="plot-tick" style={{ fontSize: 10 }}>{children} of 1024 child blocks</text>
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        <span className="mono">{data}</span> data blocks of 4 KiB and <span className="mono">{meta}</span> blocks of pointers.
        Reaching the last block needs <span className="mono">{lastReads}</span> block read{lastReads > 1 ? "s" : ""} after the inode.{" "}
        {data > D + PER + PER * PER ? "Too large for this layout: the maximum is about 4 GiB." : "Small files need no extra blocks; the overhead stays near 0.1% even for huge files."}
      </figcaption>
    </figure>
  );
}
