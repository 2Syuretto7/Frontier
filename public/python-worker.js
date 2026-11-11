/* Runs Python in the browser with Pyodide. One worker serves every editor on the page.
 * Nothing runs on Frontier's servers: Pyodide and its packages come from the jsDelivr CDN and are cached by the browser.
 *
 * Messages in:  { type: "warm" }
 *               { type: "run", id, code, setup, files, stdin, tests }
 *               { type: "lint", id, code }  { type: "complete", id, code, line, column }
 * Messages out: { type: "status", id, text }  { type: "running", id }  { type: "out", id, stream, text }
 *               { type: "done", id, error, info, figures, tests }  { type: "ready" }  { type: "reply", id, value }
 */
const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.29.5/full/";

let booting = null;
let harness = null;
let current = null;
let silent = false;

function stream(name) {
  const decoder = new TextDecoder();
  return {
    write(buffer) {
      const text = decoder.decode(buffer, { stream: true });
      if (current !== null && !silent && text) postMessage({ type: "out", id: current, stream: name, text });
      return buffer.length;
    },
  };
}

function boot(id) {
  if (!booting) {
    booting = (async () => {
      if (id !== undefined) postMessage({ type: "status", id, text: "Starting Python. The first run takes a few seconds." });
      importScripts(PYODIDE_URL + "pyodide.js");
      const [pyodide, source] = await Promise.all([
        self.loadPyodide({ indexURL: PYODIDE_URL }),
        fetch("/python/harness.py", { credentials: "same-origin" }).then((r) => {
          if (!r.ok) throw new Error("Could not load the Python harness.");
          return r.text();
        }),
      ]);
      pyodide.setStdout(stream("stdout"));
      pyodide.setStderr(stream("stderr"));
      const scope = pyodide.globals.get("dict")();
      pyodide.runPython(source, { globals: scope });
      harness = {
        pyodide,
        run: scope.get("run_program"),
        tests: scope.get("run_tests"),
        syntax: scope.get("check_syntax"),
        complete: scope.get("complete"),
      };
      postMessage({ type: "ready" });
      return harness;
    })();
    booting.catch(() => { booting = null; });
  }
  return booting;
}

function friendly(message) {
  const m = /Loading (.+)/.exec(message);
  if (!m) return null;
  const names = m[1].split(",").map((s) => s.trim()).filter((s) => s && !/^(packaging|micropip|six|pyparsing|python-dateutil|pytz|tzdata|kiwisolver|cycler|fonttools|contourpy|pillow|joblib|threadpoolctl|openblas|libopenblas|mpmath)$/i.test(s));
  return names.length ? `Loading ${names.join(", ")}. This happens once.` : null;
}

async function run(message) {
  const { id, code, setup = "", files = {}, stdin = "", tests = null } = message;
  current = id;
  silent = false;
  try {
    const h = await boot(id);
    const all = [setup, code, ...(tests || []).map((t) => t.code)].join("\n");
    try {
      await h.pyodide.loadPackagesFromImports(all, {
        messageCallback: (text) => { const f = friendly(text); if (f) postMessage({ type: "status", id, text: f }); },
        errorCallback: () => {},
      });
    } catch {
      // A failed import shows up as an ordinary ModuleNotFoundError when the program runs.
    }
    postMessage({ type: "running", id });
    const pyFiles = h.pyodide.toPy(files);
    const program = JSON.parse(h.run(code, setup, pyFiles, stdin));
    pyFiles.destroy();
    let results = null;
    if (tests) {
      silent = true;
      const pyTests = h.pyodide.toPy(tests);
      results = JSON.parse(h.tests(pyTests));
      pyTests.destroy();
      silent = false;
    }
    postMessage({ type: "done", id, error: program.error, info: program.info, figures: program.figures, tests: results });
  } catch (error) {
    postMessage({
      type: "done", id, figures: [], tests: null,
      error: booting === null
        ? "Python could not start. Check your internet connection, then press Run again."
        : `Something went wrong while running Python: ${error && error.message ? error.message : error}`,
    });
  } finally {
    current = null;
    silent = false;
  }
}

let jediLoading = null;

async function assist(message) {
  const { id } = message;
  let value = null;
  try {
    if (message.type === "lint") {
      // Never starts Python just to lint; editors warm Python when they are touched.
      if (harness) value = JSON.parse(harness.syntax(message.code));
    } else if (message.type === "complete") {
      const h = await boot();
      jediLoading ??= h.pyodide.loadPackage(["jedi"]).catch(() => { jediLoading = null; });
      await jediLoading;
      try { await h.pyodide.loadPackagesFromImports(message.code); } catch { /* ignore */ }
      value = JSON.parse(h.complete(message.code, message.line, message.column));
    }
  } catch {
    value = null;
  }
  postMessage({ type: "reply", id, value });
}

let queue = Promise.resolve();
self.onmessage = (event) => {
  const message = event.data;
  if (message.type === "warm") boot().catch(() => {});
  if (message.type === "run") queue = queue.then(() => run(message));
  if (message.type === "lint" || message.type === "complete") assist(message);
};
