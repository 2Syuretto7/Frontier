"use client";

import { useState } from "react";

const VERSIONS: { label: string; body: string; f: (y: number) => boolean }[] = [
  { label: "Version A", body: "return year % 4 == 0", f: (y) => y % 4 === 0 },
  { label: "Version B", body: "return year % 4 == 0 and year % 100 != 0", f: (y) => y % 4 === 0 && y % 100 !== 0 },
  { label: "Version C", body: "return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)", f: (y) => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) },
];

const TESTS: { year: number; expected: boolean; kind: string }[] = [
  { year: 2024, expected: true, kind: "typical" },
  { year: 2023, expected: false, kind: "typical" },
  { year: 1900, expected: false, kind: "century" },
  { year: 2000, expected: true, kind: "400 rule" },
  { year: 2100, expected: false, kind: "century" },
];

const py = (b: boolean) => (b ? "True" : "False");

/** Run a table of test cases against three versions of the same function. */
export function TestTableViz() {
  const [v, setV] = useState(0);
  const [on, setOn] = useState<boolean[]>([true, true, false, false, false]);
  const ver = VERSIONS[v];
  const chosen = TESTS.filter((_, i) => on[i]);
  const passed = chosen.filter((t) => ver.f(t.year) === t.expected).length;
  const allPassEverywhere = VERSIONS.every((x) => chosen.every((t) => x.f(t.year) === t.expected));

  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Version">
        {VERSIONS.map((x, i) => (
          <button key={x.label} type="button" className="seg" aria-pressed={i === v} onClick={() => setV(i)}>{x.label}</button>
        ))}
      </div>
      <pre className="trace-code" style={{ marginTop: 12 }}>
        <span className="trace-line">def is_leap(year):</span>
        <span className="trace-line">{`    ${ver.body}`}</span>
      </pre>
      <p className="viz-caption" style={{ margin: "12px 0 6px" }}>Choose which test cases to run:</p>
      <div className="viz-remainders" role="group" aria-label="Test cases">
        {TESTS.map((t, i) => (
          <button key={t.year} type="button" aria-pressed={on[i]} className={on[i] ? "viz-chip is-on" : "viz-chip"} style={{ cursor: "pointer" }} onClick={() => setOn((o) => o.map((x, k) => (k === i ? !x : x)))}>
            {t.year}
          </button>
        ))}
      </div>
      <table className="table" style={{ marginTop: 12, marginBottom: 0 }}>
        <thead>
          <tr><th>year</th><th>expected</th><th>actual</th><th>result</th></tr>
        </thead>
        <tbody>
          {chosen.map((t) => {
            const got = ver.f(t.year);
            const ok = got === t.expected;
            return (
              <tr key={t.year}>
                <td>{t.year}</td>
                <td>{py(t.expected)}</td>
                <td>{py(got)}</td>
                <td className={ok ? "viz-verdict-right" : "viz-verdict-wrong"}>{ok ? "pass" : "FAIL"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        {chosen.length === 0
          ? "No tests chosen, so nothing is checked."
          : `${ver.label} passes ${passed} of ${chosen.length} chosen test${chosen.length === 1 ? "" : "s"}. `}
        {chosen.length > 0 && allPassEverywhere && v !== 2 ? "Every version passes these tests, so they cannot tell a wrong version from the right one. Add the century years." : ""}
      </figcaption>
    </figure>
  );
}
