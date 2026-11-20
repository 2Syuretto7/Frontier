"use client";

import { useState } from "react";

const HOSTS = 8, PAGES = 15, CAP = 15;
const BUDGETS = [60, 120, 240];
const NAMES = [...Array.from({ length: HOSTS }, (_, k) => `site${k + 1}`), "calendar"];

/** Links of a page: regular sites are binary trees of 15 pages whose home links to the next site and to the calendar;
 *  every calendar page links to two new calendar pages, without end. */
function links(host: number, page: number): [number, number][] {
  if (host === HOSTS) return [[HOSTS, 2 * page + 1], [HOSTS, 2 * page + 2]];
  const out: [number, number][] = [];
  for (const c of [2 * page + 1, 2 * page + 2]) if (c < PAGES) out.push([host, c]);
  if (page === 0) {
    if (host + 1 < HOSTS) out.push([host + 1, 0]);
    out.push([HOSTS, 0]);
  }
  return out;
}

/** Pages fetched per host by a breadth-first crawl from site1's home page, with or without a per-host cap. */
export function crawlCounts(budget: number, capped: boolean) {
  const counts = new Array(HOSTS + 1).fill(0);
  const seen = new Set<string>(["0:0"]);
  const queue: [number, number][] = [[0, 0]];
  let head = 0, fetched = 0;
  while (head < queue.length && fetched < budget) {
    const [h, p] = queue[head++];
    if (capped && counts[h] >= CAP) continue;
    counts[h]++; fetched++;
    for (const [h2, p2] of links(h, p)) {
      const key = `${h2}:${p2}`;
      if (!seen.has(key)) { seen.add(key); queue.push([h2, p2]); }
    }
  }
  return counts;
}

export function CrawlFrontierViz() {
  const [capped, setCapped] = useState(false);
  const [b, setB] = useState(1);
  const counts = crawlCounts(BUDGETS[b], capped);
  const total = counts.reduce((a, c) => a + c, 0);
  const regular = total - counts[HOSTS];
  const W = 330, X0 = 62, BH = 13, GAP = 4, Y0 = 4, MAXV = 150, BW = 230;
  const x = (v: number) => (v / MAXV) * BW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Crawl policy">
          {["breadth-first", `cap ${CAP} per host`].map((m, j) => (
            <button key={m} type="button" className="seg" aria-pressed={capped === (j === 1)} onClick={() => setCapped(j === 1)}>{m}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Fetch budget">
          {BUDGETS.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={b === j} onClick={() => setB(j)}>{v} fetches</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + (HOSTS + 1) * (BH + GAP) + 4}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Pages fetched from each host">
        {counts.map((c, i) => {
          const y = Y0 + i * (BH + GAP);
          return (
            <g key={i}>
              <text x={X0 - 6} y={y + BH - 3} textAnchor="end" className="viz-label">{NAMES[i]}</text>
              <rect x={X0} y={y} width={Math.max(x(c), 0.5)} height={BH} style={{ fill: i === HOSTS ? "var(--accent)" : "var(--text-muted)" }} opacity={0.85} />
              <text x={X0 + x(c) + 4} y={y + BH - 3} className="viz-label">{c}</text>
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {total} fetched: {regular} of {HOSTS * PAGES} real pages, {counts[HOSTS]} calendar pages ({Math.round((100 * counts[HOSTS]) / total)}%)
      </div>
      <figcaption className="viz-caption">
        A small web of eight sites, each with fifteen pages, crawled breadth-first from the first site&apos;s home page. Every home page
        also links to a calendar whose pages each link to two more, without end. Without a limit the calendar soon takes most of the
        fetches and later sites are reached late or not at all; capping each host leaves the budget for real pages.
      </figcaption>
    </figure>
  );
}
