"use client";

import { useState } from "react";

type Row = { order: number; city: string; product: string; amount: number };
export const ORDERS: Row[] = [
  { order: 1, city: "Pune", product: "book", amount: 450 },
  { order: 2, city: "Delhi", product: "pen", amount: 120 },
  { order: 3, city: "Pune", product: "pen", amount: 80 },
  { order: 4, city: "Chennai", product: "book", amount: 800 },
  { order: 5, city: "Pune", product: "bag", amount: 950 },
  { order: 6, city: "Delhi", product: "book", amount: 200 },
  { order: 7, city: "Mumbai", product: "bag", amount: 700 },
  { order: 8, city: "Delhi", product: "bag", amount: 650 },
];
type Key = "city" | "product";
type Agg = "sum" | "mean" | "count";

/** Split, apply, combine: a group-by on a small table of orders. */
export function GroupByViz() {
  const [key, setKey] = useState<Key>("city");
  const [agg, setAgg] = useState<Agg>("sum");
  const groups = new Map<string, Row[]>();
  for (const r of ORDERS) groups.set(r[key], [...(groups.get(r[key]) ?? []), r]);
  const f = (rs: Row[]) => (agg === "count" ? rs.length : agg === "sum" ? rs.reduce((s, r) => s + r.amount, 0) : rs.reduce((s, r) => s + r.amount, 0) / rs.length);
  const result = [...groups.entries()].map(([k, rs]) => ({ k, v: f(rs) })).sort((a, b) => (a.k < b.k ? -1 : 1));
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Group by">
          {(["city", "product"] as Key[]).map((k) => <button key={k} type="button" className="seg" aria-pressed={key === k} onClick={() => setKey(k)}>by {k}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Aggregate">
          {(["sum", "mean", "count"] as Agg[]).map((a) => <button key={a} type="button" className="seg" aria-pressed={agg === a} onClick={() => setAgg(a)}>{a}</button>)}
        </div>
      </div>
      <pre className="git-status">{`df.groupby("${key}")${agg === "count" ? "" : `["amount"]`}.${agg === "count" ? "size" : agg}()`}</pre>
      <div className="gb-groups">
        {[...groups.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([k, rs]) => (
          <div key={k} className="gb-group">
            <div className="gb-head">{k}</div>
            <table className="df-table"><tbody>{rs.map((r) => <tr key={r.order}><td>{r.order}</td><td>{key === "city" ? r.product : r.city}</td><td>{r.amount}</td></tr>)}</tbody></table>
            <div className="gb-agg">{agg} → <b>{fmt(f(rs))}</b></div>
          </div>
        ))}
      </div>
      <table className="df-table" style={{ marginTop: 12 }}>
        <thead><tr><th>{key}</th><th>{agg === "count" ? "size" : `amount (${agg})`}</th></tr></thead>
        <tbody>{result.map((r) => <tr key={r.k}><td>{r.k}</td><td>{fmt(r.v)}</td></tr>)}</tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        Split the 8 rows into one group per {key}, apply {agg} to each group&rsquo;s amounts, then combine the answers into a new table with one row per group. Every group-by, in pandas or SQL, is these three steps.
      </figcaption>
    </figure>
  );
}
