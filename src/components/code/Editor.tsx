"use client";

import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import {
  EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, placeholder as placeholderExt,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab, indentMore, indentLess } from "@codemirror/commands";
import { bracketMatching, indentOnInput, indentUnit, syntaxHighlighting, syntaxTree, HighlightStyle } from "@codemirror/language";
import {
  autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap,
  type Completion as CmCompletion, type CompletionContext, type CompletionResult,
} from "@codemirror/autocomplete";
import { linter, forceLinting, lintGutter, type Diagnostic } from "@codemirror/lint";
import { globalCompletion, localCompletionSource, python } from "@codemirror/lang-python";
import { tags as t } from "@lezer/highlight";
import { runtime, type ErrorInfo } from "./runtime";
import { explainError } from "./explain";

const KINDS: Record<string, string> = {
  function: "function", module: "namespace", class: "class", instance: "variable", statement: "variable",
  keyword: "keyword", param: "variable", property: "property", path: "text",
};

function fallback(ctx: CompletionContext): CompletionResult | null {
  const results = [localCompletionSource(ctx), globalCompletion(ctx)].filter(Boolean) as CompletionResult[];
  if (!results.length) return null;
  const seen = new Set<string>();
  const options = results.flatMap((r) => r.options).filter((o) => !seen.has(o.label) && (seen.add(o.label), true));
  return { from: Math.min(...results.map((r) => r.from)), options, validFor: /^\w*$/ };
}

/** Completions from jedi running in the Python worker: names, methods of NumPy arrays, signatures and docs. */
async function pythonCompletions(ctx: CompletionContext): Promise<CompletionResult | null> {
  const node = syntaxTree(ctx.state).resolveInner(ctx.pos, -1);
  if (/Comment|String/.test(node.type.name)) return null;
  const word = ctx.matchBefore(/\w*/);
  if (!word) return null;
  const dotted = ctx.state.sliceDoc(Math.max(0, word.from - 1), word.from) === ".";
  if (!ctx.explicit && !dotted && word.from === word.to) return null;
  const py = runtime();
  if (!py.ready) { py.warm(); return dotted ? null : fallback(ctx); }
  const line = ctx.state.doc.lineAt(ctx.pos);
  const items = await py.complete(ctx.state.doc.toString(), line.number, ctx.pos - line.from);
  if (ctx.aborted) return null;
  if (!items?.length) return dotted ? null : fallback(ctx);
  const options: CmCompletion[] = items.map((c, i) => ({
    label: c.label, type: KINDS[c.type] ?? "variable", detail: c.detail || undefined, info: c.info || undefined, boost: -i / 1000,
  }));
  return { from: word.from, options, validFor: /^\w*$/ };
}

function toDiagnostic(view: EditorView, info: ErrorInfo, severity: "error" | "warning"): Diagnostic | null {
  if (!info.line || info.line < 1 || info.line > view.state.doc.lines) return null;
  const line = view.state.doc.line(info.line);
  const indent = /^\s*/.exec(line.text)![0].length;
  const from = Math.min(line.to, line.from + (info.column ? Math.max(0, info.column - 1) : indent));
  const to = info.column ? Math.min(line.to, from + 1) || line.to : line.to;
  return {
    from, to: Math.max(to, from), severity,
    message: `${info.type}: ${info.message}\n${explainError(info)}`,
  };
}

/** Colours come from the site's CSS variables, so the editor follows light and dark mode. */
const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.definitionKeyword, t.moduleKeyword], color: "var(--code-keyword)" },
  { tag: [t.string, t.special(t.string)], color: "var(--code-string)" },
  { tag: [t.number, t.bool, t.null], color: "var(--code-number)" },
  { tag: [t.comment, t.lineComment], color: "var(--text-faint)", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.definition(t.variableName))], color: "var(--code-function)" },
  { tag: [t.definition(t.className), t.className], color: "var(--code-function)" },
  { tag: [t.self, t.special(t.variableName)], color: "var(--code-keyword)" },
  { tag: [t.operator, t.punctuation, t.bracket], color: "var(--text-muted)" },
]);

const theme = EditorView.theme({
  "&": { color: "var(--text)", backgroundColor: "var(--bg-subtle)", fontSize: "var(--code-size)", height: "100%" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.6", overflow: "auto" },
  ".cm-content": { padding: "12px 0", caretColor: "var(--text)" },
  ".cm-line": { padding: "0 16px 0 8px" },
  ".cm-gutters": { backgroundColor: "var(--bg-subtle)", color: "var(--text-faint)", border: "none", borderRight: "1px solid var(--border)" },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 8px 0 12px", minWidth: "32px" },
  ".cm-activeLine": { backgroundColor: "var(--overlay)" },
  ".cm-activeLineGutter": { backgroundColor: "var(--overlay)", color: "var(--text)" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--text)", borderLeftWidth: "2px" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "var(--code-selection) !important" },
  ".cm-matchingBracket": { backgroundColor: "var(--accent-soft)", outline: "1px solid var(--accent)" },
  ".cm-placeholder": { color: "var(--text-faint)" },
});

export type EditorHandle = {
  insert: (text: string) => void;
  indent: (more: boolean) => void;
  focus: () => void;
  setValue: (text: string) => void;
  /** Marks the line a run's error points at, with an explanation; null clears it. */
  showError: (info: ErrorInfo | null) => void;
};

export function Editor({ initial, onChange, onRun, onFocus, label, readOnly, handle }: {
  initial: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onFocus?: (focused: boolean) => void;
  label: string;
  readOnly?: boolean;
  handle?: (h: EditorHandle) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onChange, onRun, onFocus });
  callbacks.current = { onChange, onRun, onFocus };

  useEffect(() => {
    let runError: ErrorInfo | null = null;
    const view: EditorView = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: initial,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          drawSelection(),
          history(),
          indentUnit.of("    "),
          EditorState.tabSize.of(4),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          python(),
          autocompletion({ override: [pythonCompletions], icons: true, activateOnTypingDelay: 120 }),
          lintGutter(),
          linter(async (v) => {
            const out: Diagnostic[] = [];
            const syntax = await runtime().lint(v.state.doc.toString());
            const s = syntax && toDiagnostic(v, syntax, "error");
            if (s) out.push(s);
            const r = !s && runError && toDiagnostic(v, runError, "error");
            if (r) out.push(r);
            return out;
          }, { delay: 600 }),
          syntaxHighlighting(highlight),
          placeholderExt("# Write your code here"),
          keymap.of([
            { key: "Mod-Enter", run: () => { callbacks.current.onRun(); return true; } },
            ...closeBracketsKeymap,
            ...completionKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            indentWithTab,
          ]),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) { runError = null; callbacks.current.onChange(u.state.doc.toString()); }
            if (u.focusChanged) callbacks.current.onFocus?.(u.view.hasFocus);
          }),
          EditorView.contentAttributes.of({ "aria-label": label, autocapitalize: "off", autocorrect: "off", spellcheck: "false" }),
          EditorState.readOnly.of(!!readOnly),
          theme,
        ],
      }),
    });
    handle?.({
      insert: (text) => {
        const { from, to } = view.state.selection.main;
        const pairs: Record<string, string> = { "(": ")", "[": "]", "{": "}", '"': '"', "'": "'" };
        const close = pairs[text];
        view.dispatch({
          changes: { from, to, insert: close ? text + close : text },
          selection: { anchor: from + text.length },
          scrollIntoView: true,
          userEvent: "input.type",
        });
        view.focus();
      },
      indent: (more) => { (more ? indentMore : indentLess)(view); view.focus(); },
      focus: () => view.focus(),
      setValue: (text) => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } }),
      showError: (info) => { runError = info; forceLinting(view); },
    });
    return () => view.destroy();
    // The editor is created once; later changes to `initial` are applied through setValue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={host} className="code-editor" />;
}
