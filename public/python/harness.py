"""Runs a learner's program and the checks on it.

Used in the browser by /python-worker.js (inside Pyodide) and on the server side by tests/code.test.ts
(with the local python3), so both run code in exactly the same way.
"""

import base64
import builtins
import io
import json
import linecache
import os
import sys
import traceback
import warnings

FILENAME = "main.py"

warnings.filterwarnings("ignore", message=".*non-interactive.*")
warnings.filterwarnings("ignore", message=".*FigureCanvasAgg.*")
os.environ.setdefault("MPLBACKEND", "Agg")

_state = {"ns": None, "printed": "", "error": None}
_jedi = {"module": None}
_stdin = []


class _Tee(io.TextIOBase):
    """Passes writes through to the real stream and keeps a copy for the checks."""

    def __init__(self, target):
        self.target = target
        self.parts = []

    def writable(self):
        return True

    def write(self, text):
        self.parts.append(text)
        self.target.write(text)
        return len(text)

    def flush(self):
        self.target.flush()

    def value(self):
        return "".join(self.parts)


def _input(prompt=""):
    sys.stdout.write(str(prompt))
    if not _stdin:
        sys.stdout.flush()
        raise EOFError("The program asked for input, but there is none left. Type each input on its own line in the Input box.")
    line = _stdin.pop(0)
    sys.stdout.write(line + "\n")
    return line


def _format_error(error, filename):
    te = traceback.TracebackException.from_exception(error)
    te.stack = traceback.StackSummary.from_list([f for f in te.stack if f.filename == filename])
    te.__suppress_context__ = True
    return "".join(te.format())


def _error_info(error, filename):
    """The exception's type, message and the line of the learner's program it points at (or None)."""
    line = None
    column = None
    if isinstance(error, SyntaxError) and error.filename == filename:
        line, column = error.lineno, error.offset
    else:
        frames = [f for f in traceback.extract_tb(error.__traceback__) if f.filename == filename]
        if frames:
            line = frames[-1].lineno
    message = error.msg if isinstance(error, SyntaxError) else str(error)
    return {"type": type(error).__name__, "message": message, "line": line, "column": column}


def _close_figures():
    plt = sys.modules.get("matplotlib.pyplot")
    if plt is not None:
        plt.close("all")


def _figures():
    plt = sys.modules.get("matplotlib.pyplot")
    if plt is None:
        return []
    images = []
    for number in plt.get_fignums()[:8]:
        buffer = io.BytesIO()
        plt.figure(number).savefig(buffer, format="png", dpi=110, bbox_inches="tight")
        images.append(base64.b64encode(buffer.getvalue()).decode("ascii"))
    plt.close("all")
    return images


def run_program(code, setup="", files=None, stdin=""):
    """Runs setup then the learner's code in a fresh namespace. Returns JSON: error text (or null) and figures."""
    for path, text in dict(files or {}).items():
        folder = os.path.dirname(path)
        if folder:
            os.makedirs(folder, exist_ok=True)
        with open(path, "w") as handle:
            handle.write(text)
    _stdin[:] = stdin.splitlines() if stdin else []
    builtins.input = _input
    _close_figures()

    ns = {"__name__": "__main__", "__builtins__": builtins}
    error = None
    info = None
    tee = _Tee(sys.stdout)
    real = sys.stdout
    sys.stdout = tee
    try:
        if setup:
            try:
                exec(compile(setup, "setup.py", "exec"), ns)
            except BaseException as e:  # noqa: BLE001
                error = "The lesson's setup code failed, which is not your fault:\n" + "".join(traceback.format_exception(e))
        if error is None:
            linecache.cache[FILENAME] = (len(code), None, code.splitlines(True), FILENAME)
            try:
                exec(compile(code, FILENAME, "exec"), ns)
            except SystemExit:
                pass
            except BaseException as e:  # noqa: BLE001
                error = _format_error(e, FILENAME)
                info = _error_info(e, FILENAME)
    finally:
        sys.stdout = real
        try:
            real.flush()
        except Exception:  # noqa: BLE001
            pass

    _state.update(ns=ns, printed=tee.value(), error=error)
    figures = []
    try:
        figures = _figures()
    except Exception:  # noqa: BLE001
        pass
    return json.dumps({"error": error, "info": info, "figures": figures})


def check_syntax(code):
    """Returns JSON: the first syntax error in the code, or null."""
    try:
        compile(code, FILENAME, "exec")
        return "null"
    except SyntaxError as e:
        return json.dumps(_error_info(e, FILENAME))
    except Exception:  # noqa: BLE001
        return "null"


def complete(code, line, column):
    """Returns JSON: completions at a position (1-based line, 0-based column), using jedi when it is installed."""
    if _jedi["module"] is None:
        try:
            import jedi  # noqa: PLC0415

            _jedi["module"] = jedi
        except ImportError:
            return "[]"
    jedi = _jedi["module"]
    try:
        found = jedi.Script(code, path=FILENAME).complete(line, column)
    except Exception:  # noqa: BLE001
        return "[]"
    out = []
    for k, c in enumerate(found[:120]):
        if c.name.startswith("_"):
            continue
        item = {"label": c.name, "type": c.type, "detail": ""}
        if k < 12:
            try:
                sigs = c.get_signatures()
                if sigs:
                    item["detail"] = sigs[0].to_string()[:120]
                doc = c.docstring(raw=True)
                if doc:
                    item["info"] = doc.strip().split("\n\n")[0][:400]
            except Exception:  # noqa: BLE001
                pass
        out.append(item)
    return json.dumps(out)


def run_tests(tests):
    """Runs each check after run_program, in the program's namespace. Returns JSON: a result per check."""
    tests = [dict(t) for t in tests]
    if _state["ns"] is None or _state["error"] is not None:
        message = "Your program stopped with an error, so this check could not run. Fix the error first."
        return json.dumps([{"name": t["name"], "passed": False, "message": message} for t in tests])

    ns = _state["ns"]
    results = []
    real = sys.stdout
    sys.stdout = io.StringIO()
    try:
        for t in tests:
            ns["printed"] = _state["printed"]
            try:
                exec(compile(t["code"], "check.py", "exec"), ns)
                results.append({"name": t["name"], "passed": True})
            except AssertionError as e:
                results.append({"name": t["name"], "passed": False, "message": str(e) or "This check did not pass."})
            except BaseException as e:  # noqa: BLE001
                results.append({"name": t["name"], "passed": False, "message": f"{type(e).__name__}: {e}"})
    finally:
        sys.stdout = real
        _close_figures()
    return json.dumps(results)
