import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TraceViz } from "@/components/viz/TraceViz";
import { code, steps } from "@/content/traces/e0.5.3";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e0.5.3",
  minutes: 50,
  links: {
    revisits: ["e0.1.4", "e0.5.2"],
    foreshadows: ["e0.6.3", "e4.2.1"],
  },

  puzzle: (
    <>
      <p>
        A program reads ten thousand rows of survey answers and adds up the ages. Row 7,312 has &ldquo;seven&rdquo; typed
        in the age column, and the program stops with an error, having produced nothing.
      </p>
      <p>
        What would you rather the program did at row 7,312? Is there any situation in which stopping is the right thing to
        do? How could the program know which kind of problem it has met?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        When an operation cannot be done, such as converting &ldquo;seven&rdquo; to an int, Python <strong>raises an
        exception</strong>: it abandons the current line and, unless something catches the exception, stops the program
        with an error message. A <C>try</C> statement lets a program catch a particular kind of exception and decide what to
        do instead.
      </p>
      <p>
        Step through and watch what happens to the flow at the entries that are not numbers.
      </p>
      <TraceViz code={code} steps={steps} />
    </>
  ),

  theory: (
    <>
      <Definition title="syntax errors">
        <p>
          A <strong>syntax error</strong> means the text is not valid Python: a missing colon, an unclosed bracket, a
          wrongly indented line. Python finds it before running anything, and nothing runs until it is fixed.
        </p>
      </Definition>

      <Definition title="exceptions">
        <p>
          An <strong>exception</strong> happens while a valid program is running. Each kind has a name that says what went
          wrong:
        </p>
        <Code>{`
[1, 2, 3][3]       # IndexError: list index out of range
{"a": 1}["b"]      # KeyError: 'b'
"2" + 2            # TypeError: can only concatenate str (not "int") to str
int("x")           # ValueError: invalid literal for int() with base 10: 'x'
1 / 0              # ZeroDivisionError: division by zero
undefined_name     # NameError: name 'undefined_name' is not defined
open("missing")    # FileNotFoundError
`}</Code>
      </Definition>

      <Definition title="try and except">
        <Code>{`
try:
    risky lines
except SomeError:
    what to do if SomeError is raised
else:
    what to do if nothing was raised
finally:
    what to do in every case
`}</Code>
        <p>
          If a line in the <C>try</C> block raises an exception of the named kind, the rest of the block is skipped and the{" "}
          <C>except</C> block runs; then the program carries on after the whole statement. An exception of any other kind is
          not caught and still stops the program. The <C>else</C> and <C>finally</C> parts are optional.
        </p>
      </Definition>

      <Definition title="raise">
        <p>
          Your own code can raise an exception when it is given something it cannot handle:{" "}
          <C>raise ValueError(&quot;age must not be negative&quot;)</C>. This is better than returning a made-up value,
          because the problem cannot be silently ignored.
        </p>
      </Definition>

      <Example title="asking until the answer is valid">
        <Code>{`
while True:
    text = input("Age? ")
    try:
        age = int(text)
        break
    except ValueError:
        print("Please type a whole number.")
`}</Code>
        <p>
          The loop repeats until <C>int</C> succeeds, at which point <C>break</C> leaves it. The user can type anything
          without crashing the program.
        </p>
      </Example>

      <Remark title="catch narrowly">
        <p>
          A bare <C>except:</C>, with no exception named, catches everything, including mistakes in your own code such as a
          misspelt variable. The program then carries on with wrong results and no sign of trouble. Catch only the exceptions
          you expect and know how to handle, and keep the <C>try</C> block small. An error that stops the program loudly is
          far easier to fix than one that silently corrupts its output.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "syntax",
      rung: "check",
      prompt: <p>Which kind of error is found before any of the program runs?</p>,
      answer: { kind: "choice", options: ["SyntaxError", "ValueError", "ZeroDivisionError", "KeyError"], correct: [0] },
    },
    {
      key: "seven",
      rung: "check",
      prompt: <p>Which exception does <C>int(&quot;seven&quot;)</C> raise?</p>,
      answer: { kind: "choice", options: ["ValueError", "TypeError", "NameError", "IndexError"], correct: [0] },
    },
    {
      key: "match",
      rung: "apply",
      prompt: <p>Which exception does <C>[1, 2, 3][3]</C> raise?</p>,
      answer: { kind: "choice", options: ["IndexError", "KeyError", "ValueError", "None: it gives 3"], correct: [0] },
    },
    {
      key: "safediv",
      rung: "apply",
      prompt: (
        <>
          <p>What number does this program print?</p>
          <Code>{`
def safe_div(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return 0

print(safe_div(9, 3) + safe_div(5, 0))
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "flow",
      rung: "apply",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
try:
    x = int("42")
except ValueError:
    print("bad")
else:
    print("good")
finally:
    print("done")
`}</Code>
        </>
      ),
      answer: { kind: "choice", options: ["good, then done", "bad, then done", "good", "done"], correct: [0] },
    },
    {
      key: "bare",
      rung: "prove",
      prompt: (
        <p>
          A colleague wraps a whole 200-line program in <C>try:</C> &hellip; <C>except: pass</C> &ldquo;so that it never
          crashes&rdquo;. Explain what can go wrong, and describe a better way to handle the bad survey rows of the
          puzzle.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains that a bare except catches every exception, including bugs such as NameError or TypeError in the program itself.",
          "Explains that pass hides the problem, so the program may stop partway or give wrong results with no message.",
          "Proposes catching only the expected exception (ValueError) around the conversion of a single row.",
          "Proposes reporting or counting the skipped rows, so that the problem is visible.",
        ],
      },
    },
    {
      key: "entries",
      rung: "stretch",
      prompt: (
        <p>
          In the traced program, the list is changed to <C>[&quot;5&quot;, &quot;5.5&quot;, &quot;-3&quot;, &quot; 7 &quot;]</C>.
          What total is printed? (<C>int</C> accepts a minus sign and ignores spaces around the digits.)
        </p>
      ),
      answer: { kind: "numeric", value: 9 },
    },
  ],

  teachBack:
    "Explain to a friend the difference between a syntax error and an exception, how try and except let a program recover, and why you should catch only the exceptions you expect.",

  glimpse: (
    <p>
      This completes Files and errors. Next, the last chapter: thinking like a programmer, starting with debugging by
      experiment. Reading error messages has a lesson of its own there, and Software Engineering for ML Research treats
      debugging as a science.
    </p>
  ),
};
