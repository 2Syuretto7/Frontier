"use client";

import { useMemo, useRef, useState } from "react";
import { makeShell, run, type Shell } from "./shell";

type Entry = { cwd: string; cmd: string; out: string; err: string; stages?: { cmd: string; out: string }[] };

function tree(sh: Shell): { path: string; depth: number; dir: boolean }[] {
  const all = [...sh.fs.dirs, ...Object.keys(sh.fs.files)].filter((p) => p === sh.home || p.startsWith(sh.home + "/")).sort();
  return all.map((p) => ({ path: p, depth: p === sh.home ? 0 : p.slice(sh.home.length).split("/").length - 1, dir: sh.fs.dirs.has(p) }));
}

/** A practice terminal on a small pretend file system. Nothing here touches a real computer. */
export function ShellViz({ files, script, cwd, stages = false, showTree = false, caption }: { files: Record<string, string>; script: string[]; cwd?: string; stages?: boolean; showTree?: boolean; caption?: string }) {
  const fresh = () => makeShell(files, cwd);
  const sh = useRef<Shell>(null as unknown as Shell);
  if (!sh.current) sh.current = fresh();
  const [log, setLog] = useState<Entry[]>([]);
  const [next, setNext] = useState(0);
  const [text, setText] = useState("");
  const [, bump] = useState(0);
  const exec = (cmd: string) => {
    const before = sh.current.cwd;
    const r = run(sh.current, cmd);
    setLog((l) => [...l, { cwd: before, cmd, out: r.out, err: r.err, stages: stages ? r.stages : undefined }].slice(-30));
    bump((x) => x + 1);
  };
  const short = (p: string) => (p === sh.current.home ? "~" : p.startsWith(sh.current.home + "/") ? "~" + p.slice(sh.current.home.length) : p);
  const nodes = useMemo(() => (showTree ? tree(sh.current) : []), [showTree, log]); // eslint-disable-line react-hooks/exhaustive-deps
  const last = log[log.length - 1];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        {next < script.length && (
          <button type="button" className="btn btn-primary term-run" onClick={() => { exec(script[next]); setNext(next + 1); }}>
            Run <code className="term-btn-code">{script[next]}</code>
          </button>
        )}
        <button type="button" className="btn" onClick={() => { sh.current = fresh(); setLog([]); setNext(0); }}>Reset</button>
      </div>
      <div className={showTree ? "term-wrap has-tree" : "term-wrap"}>
        <div className="term" aria-live="polite" aria-label="Terminal">
          {log.length === 0 && <div className="term-dim">Press Run to try the next command, or type your own below.</div>}
          {log.map((e, i) => (
            <div key={i}>
              <div><span className="term-prompt">asha@laptop:{short(e.cwd)}$</span> {e.cmd}</div>
              {e.stages && e.stages.length > 1 && (
                <div className="term-stages">
                  {e.stages.slice(0, -1).map((s, k) => (
                    <div key={k}><div className="term-dim">after <b>{s.cmd}</b>:</div><div className="term-out">{s.out || "(nothing)"}</div></div>
                  ))}
                  <div className="term-dim">after <b>{e.stages[e.stages.length - 1].cmd}</b>:</div>
                </div>
              )}
              {e.out && <div className="term-out">{e.out}</div>}
              {e.err && <div className="term-out term-err">{e.err}</div>}
            </div>
          ))}
          <form className="term-input" onSubmit={(ev) => { ev.preventDefault(); if (text.trim()) { exec(text.trim()); setText(""); } }}>
            <span className="term-prompt">asha@laptop:{short(sh.current.cwd)}$</span>
            <input value={text} onChange={(ev) => setText(ev.target.value)} aria-label="Type a command" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
          </form>
        </div>
        {showTree && (
          <ul className="term-tree" aria-label="Files">
            {nodes.map((n) => (
              <li key={n.path} style={{ paddingLeft: n.depth * 14 }} className={n.path === sh.current.cwd ? "is-on" : undefined}>
                {n.path === sh.current.home ? "~" : n.path.slice(n.path.lastIndexOf("/") + 1)}{n.dir ? "/" : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
      <figcaption className="viz-caption">
        {caption ?? "A practice terminal on a pretend file system."} {last && last.err ? "The last command failed; read its error message, which says exactly what went wrong." : ""}
      </figcaption>
    </figure>
  );
}
