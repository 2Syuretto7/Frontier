"use client";

import { useState } from "react";

const CUSTOMERS = [
  { id: 1, name: "Asha", city: "Pune" }, { id: 2, name: "Ravi", city: "Delhi" }, { id: 3, name: "Meera", city: "Pune" }, { id: 4, name: "Kabir", city: "Chennai" },
];
const ORDERS = [
  { id: 101, customer_id: 1, amount: 450 }, { id: 102, customer_id: 2, amount: 120 }, { id: 103, customer_id: 1, amount: 80 }, { id: 104, customer_id: 4, amount: 800 },
  { id: 105, customer_id: 3, amount: 950 }, { id: 106, customer_id: 2, amount: 200 }, { id: 107, customer_id: 3, amount: 60 }, { id: 108, customer_id: 2, amount: 650 },
];
const QUERY = [
  { clause: "SELECT c.city, SUM(o.amount) AS total, COUNT(*) AS n", stage: 4 },
  { clause: "FROM orders AS o JOIN customers AS c ON o.customer_id = c.id", stage: 0 },
  { clause: "WHERE o.amount >= 100", stage: 1 },
  { clause: "GROUP BY c.city", stage: 2 },
  { clause: "HAVING COUNT(*) >= 2", stage: 3 },
  { clause: "ORDER BY total DESC", stage: 5 },
  { clause: "LIMIT 1;", stage: 6 },
];
const NOTES = [
  "FROM and JOIN come first: each order is paired with the customer whose id matches, giving one wide row per order.",
  "WHERE filters individual rows. The two orders under 100 are removed before any grouping.",
  "GROUP BY gathers the remaining rows into one group per city.",
  "HAVING filters whole groups, using aggregates. Chennai has only one order, so it goes.",
  "SELECT now computes the output columns for each surviving group, including the aggregates and their names.",
  "ORDER BY sorts the result. It runs after SELECT, which is why it can use the name total.",
  "LIMIT keeps the first row: the city with the most spending among cities with at least two orders.",
];

type Row = Record<string, string | number>;

function run(stage: number): { cols: string[]; rows: Row[]; groups?: Record<string, Row[]> } {
  let rows: Row[] = ORDERS.map((o) => { const c = CUSTOMERS.find((x) => x.id === o.customer_id)!; return { "o.id": o.id, "c.name": c.name, "c.city": c.city, "o.amount": o.amount }; });
  if (stage === 0) return { cols: ["o.id", "c.name", "c.city", "o.amount"], rows };
  rows = rows.filter((r) => (r["o.amount"] as number) >= 100);
  if (stage === 1) return { cols: ["o.id", "c.name", "c.city", "o.amount"], rows };
  const groups: Record<string, Row[]> = {};
  for (const r of rows) (groups[r["c.city"] as string] ??= []).push(r);
  if (stage === 2) return { cols: ["o.id", "c.name", "c.city", "o.amount"], rows, groups };
  const kept = Object.fromEntries(Object.entries(groups).filter(([, g]) => g.length >= 2));
  if (stage === 3) return { cols: ["o.id", "c.name", "c.city", "o.amount"], rows, groups: kept };
  let out: Row[] = Object.entries(kept).map(([city, g]) => ({ city, total: g.reduce((s, r) => s + (r["o.amount"] as number), 0), n: g.length }));
  if (stage === 4) return { cols: ["city", "total", "n"], rows: out };
  out = [...out].sort((a, b) => (b.total as number) - (a.total as number));
  if (stage === 5) return { cols: ["city", "total", "n"], rows: out };
  return { cols: ["city", "total", "n"], rows: out.slice(0, 1) };
}

/** The order in which a SQL query is really evaluated, with the table after each clause. */
export function SqlViz() {
  const [stage, setStage] = useState(0);
  const r = run(stage);
  const table = (rows: Row[]) => (
    <table className="df-table">
      <thead><tr>{r.cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
      <tbody>{rows.map((row, i) => <tr key={i}>{r.cols.map((c) => <td key={c}>{row[c]}</td>)}</tr>)}</tbody>
    </table>
  );
  return (
    <figure className="viz">
      <pre className="sql-query">
        {QUERY.map((q) => <span key={q.clause} className={q.stage === stage ? "is-on" : q.stage < stage ? "is-done" : undefined}>{q.clause}</span>)}
      </pre>
      <div style={{ overflowX: "auto", marginTop: 12 }}>
        {r.groups ? (
          <div className="gb-groups">
            {Object.entries(r.groups).map(([k, g]) => <div key={k} className="gb-group"><div className="gb-head">{k}</div>{table(g)}</div>)}
          </div>
        ) : table(r.rows)}
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setStage(Math.max(0, stage - 1))} disabled={stage === 0}>Back</button>
        <button type="button" className="btn btn-primary" onClick={() => setStage(stage + 1)} disabled={stage === 6}>Next clause</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">Step {stage + 1} of 7. {NOTES[stage]}</figcaption>
    </figure>
  );
}
