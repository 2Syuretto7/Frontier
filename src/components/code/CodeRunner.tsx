"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Editor, type EditorHandle } from "./Editor";
import { runtime, workspaces, type ErrorInfo, type RunResult, type TestResult, type TestSpec } from "./runtime";
import { explainError } from "./explain";
import { Check, Close, Expand, Play, Shrink, Stop, Undo } from "@/components/ui/Icons";

type Chunk = { stream: "stdout" | "stderr"; text: string };
const OUTPUT_LIMIT = 100_000;
const KEYS = ["(", ")", "[", "]", "{", "}", ":", "=", '"', "'", ",", ".", "+", "-", "*", "/", "<", ">", "_", "#"];

export type RunnerApi = {
  busy: boolean;
  source: string;
  /** Runs the program followed by the checks, shows the results, and returns them. */
  runChecks: (tests: TestSpec[]) => Promise<RunResult | null>;
};

function readDraft(key?: string): string | null {
  if (!key) return null;
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function writeDraft(key: string, value: string | null) {
  try { if (value === null) window.localStorage.removeItem(key); else window.localStorage.setItem(key, value); } catch { /* storage is optional */ }
}

/** An editor with Run, Stop and Reset, an output console, plots and check results. Used by Playground and code exercises. */
export function CodeRunner({ initial, original, setup, files, draftKey, workspaceKey, label, actions, onSourceChange, brief }: {
  initial: string;
  /** What Reset restores. */
  original: string;
  setup?: string;
  files?: Record<string, string>;
  /** Keeps unsaved work in this browser under this key. */
  draftKey?: string;
  /** Shares the code, output and error with Parton under this key (the exercise id). */
  workspaceKey?: string;
  label: string;
  /** The task, shown above the output while the editor is expanded. */
  brief?: ReactNode;
  actions?: (api: RunnerApi) => ReactNode;
  onSourceChange?: (source: string) => void;
}) {
  const [source, setSource] = useState(initial);
  const sourceRef = useRef(initial);
  const editor = useRef<EditorHandle | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<ErrorInfo | null>(null);
  const [figures, setFigures] = useState<string[]>([]);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);
  const [ran, setRan] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [focused, setFocused] = useState(false);
  const [stdin, setStdin] = useState("");
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outputId = useId();
  const busy = jobId !== null;
  const asksInput = /\binput\s*\(/.test(source);

  useEffect(() => {
    const draft = readDraft(draftKey);
    if (draft !== null && draft !== sourceRef.current) editor.current?.setValue(draft);
  }, [draftKey]);

  const share = useCallback((patch: Partial<{ error: string | null; output: string }>) => {
    if (!workspaceKey) return;
    const prev = workspaces.get(workspaceKey) ?? { source: sourceRef.current, error: null, output: "" };
    workspaces.set(workspaceKey, { ...prev, source: sourceRef.current, ...patch });
  }, [workspaceKey]);

  useEffect(() => { share({}); }, [share]);

  const change = useCallback((value: string) => {
    sourceRef.current = value;
    share({});
    setSource(value);
    onSourceChange?.(value);
    if (draftKey) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => writeDraft(draftKey, value === original ? null : value), 400);
    }
  }, [draftKey, onSourceChange, original, share]);

  const execute = useCallback(async (tests: TestSpec[] | null): Promise<RunResult | null> => {
    if (jobId !== null) return null;
    setChunks([]); setError(null); setInfo(null); setFigures([]); setNote(null); setRan(true);
    editor.current?.showError(null);
    let printed = "";
    setResults(null);
    let size = 0;
    const { id, done } = runtime().run(
      { code: sourceRef.current, setup, files, stdin, tests },
      {
        onStatus: setStatus,
        onOutput: (text, stream) => {
          if (size > OUTPUT_LIMIT) return;
          size += text.length;
          if (printed.length < 4000) printed += text;
          const clipped = size > OUTPUT_LIMIT ? text.slice(0, Math.max(0, text.length - (size - OUTPUT_LIMIT))) + "\n… output cut short here." : text;
          setChunks((c) => (c.length && c[c.length - 1].stream === stream
            ? [...c.slice(0, -1), { stream, text: c[c.length - 1].text + clipped }]
            : [...c, { stream, text: clipped }]));
        },
      },
    );
    setJobId(id);
    const result = await done;
    setJobId(null);
    setError(result.error);
    setInfo(result.info ?? null);
    editor.current?.showError(result.info ?? null);
    share({ error: result.error, output: printed.slice(0, 4000) });
    setFigures(result.figures);
    if (tests) setResults(result.tests);
    if (result.stopped === "user") setNote("Stopped.");
    return result;
  }, [jobId, setup, files, stdin, share]);

  const run = useCallback(() => { void execute(null); }, [execute]);
  const stop = () => { if (jobId !== null) runtime().stop(jobId, "user"); };
  const reset = () => {
    if (sourceRef.current !== original && !window.confirm("Reset the code to how it started? Your changes will be lost.")) return;
    editor.current?.setValue(original);
    if (draftKey) writeDraft(draftKey, null);
    setChunks([]); setError(null); setInfo(null); setFigures([]); setResults(null); setNote(null); setRan(false);
    editor.current?.showError(null);
  };

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setExpanded(false); };
    document.documentElement.classList.add("has-code-overlay");
    window.addEventListener("keydown", onKey);
    return () => { document.documentElement.classList.remove("has-code-overlay"); window.removeEventListener("keydown", onKey); };
  }, [expanded]);

  const onFocus = (f: boolean) => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    if (f) { setFocused(true); runtime().warm(); }
    else blurTimer.current = setTimeout(() => setFocused(false), 200);
  };

  const passed = results?.filter((r) => r.passed).length ?? 0;
  const empty = !chunks.length && !error && !figures.length && !results && !status && !note;

  return (
    <div className={`code-runner ${expanded ? "is-expanded" : ""} ${focused ? "is-focused" : ""}`}
      role={expanded ? "dialog" : undefined} aria-modal={expanded || undefined} aria-label={expanded ? label : undefined}>
      <div className="code-bar">
        <span className="code-lang">Python</span>
        <div className="code-bar-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={reset} disabled={busy} title="Reset the code" aria-label="Reset">
            <Undo size={14} /><span className="code-bar-label">Reset</span>
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setExpanded((x) => !x)}
            title={expanded ? "Back to the lesson (Esc)" : "Open a larger editor"} aria-label={expanded ? "Close" : "Expand"}>
            {expanded ? <Shrink size={14} /> : <Expand size={14} />}<span className="code-bar-label">{expanded ? "Close" : "Expand"}</span>
          </button>
        </div>
      </div>

      <div className="code-panes">
        <div className="code-edit-pane" onPointerDown={() => runtime().warm()}>
          <Editor initial={initial} onChange={change} onRun={run} onFocus={onFocus} label={label} handle={(h) => { editor.current = h; }} />
          <div className="code-keys" aria-label="Coding keys">
            <button type="button" className="code-key" onPointerDown={(e) => e.preventDefault()} onClick={() => editor.current?.indent(true)} aria-label="Indent">Tab</button>
            <button type="button" className="code-key" onPointerDown={(e) => e.preventDefault()} onClick={() => editor.current?.indent(false)} aria-label="Outdent">⇤</button>
            {KEYS.map((k) => (
              <button key={k} type="button" className="code-key" onPointerDown={(e) => e.preventDefault()} onClick={() => editor.current?.insert(k)}>{k}</button>
            ))}
          </div>
        </div>

        <div className="code-out-pane">
          {expanded && brief && <div className="code-brief">{brief}</div>}
          {asksInput && (
            <label className="code-stdin">
              <span>Input <span className="muted">(one line for each input() call)</span></span>
              <textarea className="input" rows={2} value={stdin} onChange={(e) => setStdin(e.target.value)} spellCheck={false}
                autoCapitalize="off" autoCorrect="off" />
            </label>
          )}
          <div className="code-run-row">
            {busy ? (
              <button type="button" className="btn" onClick={stop}><Stop size={14} />Stop</button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={run} title="Run (Ctrl or Cmd + Enter)"><Play size={14} />Run</button>
            )}
            {actions?.({ busy, source, runChecks: execute })}
            <span className="code-shortcut" aria-hidden="true">Ctrl or ⌘ + Enter runs</span>
          </div>

          <div className="code-output" id={outputId} aria-live="polite" aria-label="Output">
            {empty && <p className="code-output-empty">{ran ? "The program finished without printing anything." : "Press Run to see what your code prints."}</p>}
            {status && <p className="code-status"><span className="pill-spin" />{status}</p>}
            {chunks.length > 0 && (
              <pre className="code-console">{chunks.map((c, i) => <span key={i} className={c.stream === "stderr" ? "code-stderr" : undefined}>{c.text}</span>)}</pre>
            )}
            {error && (
              <div className="code-error">
                {info && (
                  <p className="code-explain">
                    <strong>{info.line ? `Line ${info.line}: ` : ""}{info.type}.</strong> {explainError(info)}
                  </p>
                )}
                <pre>{error}</pre>
              </div>
            )}
            {note && <p className="code-note">{note}</p>}
            {figures.map((f, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} className="code-figure" src={`data:image/png;base64,${f}`} alt={`Plot ${i + 1} drawn by the program`} />
            ))}
            {results && (
              <div className="code-checks">
                <p className={`code-checks-head ${passed === results.length ? "is-pass" : ""}`}>
                  {passed === results.length ? `All ${results.length} checks passed.` : `${passed} of ${results.length} checks passed.`}
                </p>
                <ul>
                  {results.map((r) => (
                    <li key={r.name} className={r.passed ? "is-pass" : "is-fail"}>
                      {r.passed ? <Check size={14} /> : <Close size={14} />}
                      <span><strong>{r.name}</strong>{r.message && <span className="code-check-msg">{r.message}</span>}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
