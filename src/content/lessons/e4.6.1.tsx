import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DocLayersViz } from "@/components/viz/DocLayersViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e4.6.1",
  minutes: 45,
  links: {
    requires: ["e4.5.3"],
    revisits: ["e1.3.5", "e0.3.2"],
    foreshadows: ["e4.6.2", "e4.6.3"],
  },

  puzzle: (
    <>
      <p>
        You find the function you need in a colleague&rsquo;s repository: <C>def agg(x, m, d=-1)</C>. Its only comment says{" "}
        <C># aggregate</C>. To use it you read its body, two helpers and a test, and you still do not know what it returns when
        m is all False.
      </p>
      <p>What would have saved you the half hour?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Documentation exists to answer a reader&rsquo;s questions without making them read the code: what does this do, how
        do I call it, what comes back, what can go wrong. Each layer, from the name to an executable example, answers more of
        them.
      </p>
      <DocLayersViz />
      <p>
        The most useful layer is the one that cannot go stale: an example that a tool runs, so the documentation is checked
        every time the tests are.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="levels of documentation">
        <ul>
          <li>
            <strong>Names and types</strong>: <C>masked_mean(x, mask, axis)</C> with type hints says most of what{" "}
            <C>agg(x, m, d)</C> hides.
          </li>
          <li>
            <strong>Docstrings</strong> state the contract: what the function does, each argument with its meaning, shape and
            units, what it returns, what it raises, and edge cases.
          </li>
          <li>
            <strong>Comments</strong> explain <em>why</em>: a non-obvious choice, a workaround, a reference to the paper or
            the issue. The code already says what.
          </li>
          <li>
            <strong>A README</strong> per repository: what it is for, how to install it, how to reproduce the main results
            with exact commands, and where things live.
          </li>
        </ul>
      </Definition>

      <Example title="a docstring">
        <Code>{`def masked_mean(x: np.ndarray, mask: np.ndarray, axis: int = -1) -> np.ndarray:
    """Mean of x over axis, counting only positions where mask is True.

    Args:
        x: values, shape (..., n).
        mask: booleans with the same shape as x.
        axis: the axis to average over.

    Returns:
        x's shape without axis. Rows with no True entries give nan.

    >>> masked_mean(np.array([[1., 2., 9.]]), np.array([[True, True, False]]))
    array([1.5])
    """
    # Sum then divide, rather than np.mean(x[mask]), so that the batch axes survive.
    return (x * mask).sum(axis) / mask.sum(axis)`}</Code>
        <p>
          This is the Google style; NumPy style uses headed sections instead. Pick one per project. Running{" "}
          <C>python -m doctest file.py</C>, or <C>pytest --doctest-modules</C>, checks every <C>&gt;&gt;&gt;</C> example.
        </p>
      </Example>

      <Definition title="documentation rot">
        <p>
          Prose drifts from the code as the code changes, and wrong documentation is worse than none, because it is believed.
          Defences: keep documentation next to the code it describes, make examples executable, prefer types and assertions
          that a tool checks over sentences that nobody does, and delete documentation for things that no longer exist.
        </p>
      </Definition>

      <Remark title="for research code">
        <p>
          The README that matters most says how to reproduce each reported number: the command, the config, the commit, the
          expected value and its spread across seeds. Write it when you get the number, not when the paper is due.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "why",
      rung: "check",
      prompt: <p>Which comment is most useful?</p>,
      answer: {
        kind: "choice",
        options: [
          "# Clamp to 1e-6: log(0) in the loss gave NaN on fully masked rows (issue #41)",
          "# Add 1 to i",
          "# Loop over the batch",
          "# This function computes the loss",
        ],
        correct: [0],
      },
    },
    {
      key: "repo",
      rung: "apply",
      prompt: <p>Which belong in the README of a research repository?</p>,
      answer: {
        kind: "choice",
        options: [
          "The exact command and config that reproduce each reported result",
          "How to install the pinned dependencies",
          "A map of the main directories",
          "The full history of every experiment you tried",
        ],
        correct: [0, 1, 2],
      },
    },
    {
      key: "shapes",
      rung: "apply",
      prompt: <p>Which docstring line is most useful for <C>attention(q, k, v, mask)</C>?</p>,
      answer: {
        kind: "choice",
        options: [
          "mask: bool, shape (batch, T, T); True where query i may attend to key j.",
          "mask: the mask.",
          "mask: a tensor.",
          "mask: see the code.",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`doc = '''Clip x to [lo, hi].

>>> clip(5, 0, 3)
3
>>> clip(-1, 0, 3)
0
'''
examples = [l[4:] for l in doc.splitlines() if l.startswith('>>> ')]
print(len(examples), examples[1])`}</Code>
          <p>Pulling the examples out of a docstring. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2 clip(-1, 0, 3)", "2 0", "4 clip(-1, 0, 3)", "2 >>> clip(-1, 0, 3)"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def scale(x: float, factor: float = 2.0) -> float:
    """Multiply x by factor."""
    return x * factor

print(scale.__doc__, scale.__annotations__['factor'].__name__, scale.__defaults__)`}</Code>
          <p>Documentation is data that tools can read. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["Multiply x by factor. float (2.0,)", "None float (2.0,)", "Multiply x by factor. float 2.0", "Multiply x by factor. factor (2.0,)"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write a small doctest. <C>run_examples(doc, namespace)</C> scans the docstring for lines that, after stripping, start
          with <C>&gt;&gt;&gt; </C>. The following stripped lines, up to a blank line or the next <C>&gt;&gt;&gt; </C>, are the
          expected output. If there is expected output, evaluate the source with <C>eval</C> in namespace and compare its{" "}
          <C>repr</C> with the expected lines joined by newlines; otherwise run it with <C>exec</C>. Return a list of (source,
          expected, got) for each mismatch.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def run_examples(doc, namespace):
    return []
`,
        solution: `def run_examples(doc, namespace):
    failures, lines, i = [], doc.splitlines(), 0
    while i < len(lines):
        line = lines[i].strip()
        i += 1
        if not line.startswith('>>> '):
            continue
        source, expected = line[4:], []
        while i < len(lines) and lines[i].strip() and not lines[i].strip().startswith('>>> '):
            expected.append(lines[i].strip())
            i += 1
        if expected:
            got = repr(eval(source, namespace))
            if got != '\\n'.join(expected):
                failures.append((source, '\\n'.join(expected), got))
        else:
            exec(source, namespace)
    return failures
`,
        tests: [
          { name: "checks examples", code: `doc = '''Clip.

    >>> clip(5, 0, 3)
    3
    >>> y = clip(-1, 0, 3)
    >>> y
    0
    >>> clip(2.5, 0, 3)
    2
    >>> 'a' + 'b'
    'ab'
'''
ns = {'clip': lambda x, lo, hi: max(lo, min(x, hi))}
got = run_examples(doc, ns)
assert got == [('clip(2.5, 0, 3)', '2', '2.5')], got
assert ns['y'] == 0, 'Statements without output run with exec in the namespace.'` },
          { name: "multi-line output", code: `d2 = """
>>> 'line1\\\\nline2'.split('\\\\n')
['line1', 'line2']
>>> 3 + 4
7
"""
assert run_examples(d2, {}) == []
d3 = """
>>> 2 + 2
5
"""
assert run_examples(d3, {}) == [('2 + 2', '5', '4')]
d4 = """
>>> sorted({3: 'c', 1: 'a'}.items())
[(1, 'a'),
 (3, 'c')]
"""
assert run_examples(d4, {}) == [("sorted({3: 'c', 1: 'a'}.items())", "[(1, 'a'),\\n(3, 'c')]", "[(1, 'a'), (3, 'c')]")]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>check_docstring(func)</C>, comparing a function&rsquo;s parameters (from <C>inspect.signature</C>) with
          its Google-style <C>Args:</C> section (from <C>inspect.getdoc</C>, which removes the common indentation). Inside
          the section, an entry is a line indented by exactly four spaces, named by the text before the first colon and before
          any <C> (type)</C>; deeper lines continue an entry; the section ends at a non-blank line with no indentation.
          Return (missing, extra) as sorted lists.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import inspect

def check_docstring(func):
    return [], []
`,
        solution: `import inspect

def check_docstring(func):
    params = set(inspect.signature(func).parameters)
    documented, inside = set(), False
    for line in (inspect.getdoc(func) or '').splitlines():
        if line.strip() == 'Args:':
            inside = True
        elif inside and line and not line.startswith(' '):
            inside = False
        elif inside and line.startswith('    ') and not line.startswith('     '):
            documented.add(line.strip().split(':')[0].split(' (')[0])
    return sorted(params - documented), sorted(documented - params)
`,
        tests: [
          { name: "finds gaps", code: `def f(x, mask, axis=-1):
    """Mean.

    Args:
        x (ndarray): values,
            over several lines: still x.
        maks: typo.

    Returns:
        mask: not an argument, just text in Returns.
    """
assert check_docstring(f) == (['axis', 'mask'], ['maks']), check_docstring(f)` },
          { name: "complete and empty", code: `def g(a, b):
    """Add.

    Args:
        a: first.
        b (int): second.
    """
    return a + b
assert check_docstring(g) == ([], [])
def h(p, q=1):
    return p
assert check_docstring(h) == (['p', 'q'], [])` },
        ],
      },
    },
    {
      key: "rot",
      rung: "prove",
      prompt: (
        <p>
          Argue why an example checked by doctest on every test run cannot silently go out of date while a sentence in a
          docstring can, and name one kind of claim that a doctest example still cannot check.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that a doctest is executed against the current code, so a change that alters the output makes the test fail.",
          "Notes that prose is never executed, so nothing fails when it becomes false.",
          "Names a valid uncheckable kind of claim, such as a statement about all inputs, performance, intent or the reason for a design choice.",
        ],
      },
    },
    {
      key: "best",
      rung: "stretch",
      prompt: (
        <p>
          A function returns nan for rows with no True entries in the mask. Where should that fact be recorded so that it is
          most likely to stay true?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "In the docstring, together with a doctest example of a fully masked row",
          "In a comment in the calling code",
          "In the README",
          "In the commit message that introduced it",
        ],
        correct: [0],
      },
    },
  ],

  teachBack:
    "Explain to a friend what a good docstring for a numerical function contains, and why an executable example is the most trustworthy part of documentation.",

  glimpse: (
    <p>
      Doctests and unit tests only help if they run. Next, continuous integration: running every check automatically on every
      change, so that a broken main branch is caught in minutes rather than weeks.
    </p>
  ),
};
