import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TracebackViz } from "@/components/viz/TracebackViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e0.6.3",
  minutes: 40,
  links: {
    revisits: ["e0.5.3", "e0.6.1"],
    foreshadows: ["e4.6.3", "e3.2.2"],
  },

  puzzle: (
    <>
      <p>
        Many beginners see a block of red text when their program crashes, feel a jolt of panic, and go straight back to
        the code to guess what is wrong, without reading the message.
      </p>
      <p>
        The message was written by the people who built Python, specifically to help. What information do you think it
        could contain that would save you from guessing?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A Python error message, called a <strong>traceback</strong>, tells you <em>what</em> went wrong, <em>where</em> in
        the code, and <em>how</em> the program got there. Most bugs that cause a crash can be found from the traceback alone,
        if you read it in the right order.
      </p>
      <p>
        Below are three real tracebacks. Click each line to see what it tells you and which line of the program it points
        to. Start with the TypeError, which is the most instructive.
      </p>
      <TracebackViz />
    </>
  ),

  theory: (
    <>
      <Definition title="traceback">
        <p>
          A <strong>traceback</strong> is printed when an exception is not caught. It lists the chain of calls that were in
          progress, from the oldest at the top to the newest at the bottom. For each, it gives the file, the line number,
          the function (<C>&lt;module&gt;</C> means the main program), the text of the line, and often markers under the
          part of the line that was running. The last line gives the <strong>type</strong> of the exception and a{" "}
          <strong>message</strong>.
        </p>
      </Definition>

      <Definition title="how to read one">
        <ol>
          <li>Read the <strong>last line</strong>: the exception type and message say what went wrong.</li>
          <li>Read the <strong>last File line</strong> and the code under it: that is where the program stopped.</li>
          <li>If that line looks correct, ask which <em>values</em> would make it fail, and walk <strong>up</strong> the traceback to see where those values came from.</li>
          <li>Look at any output printed before the traceback: it shows how far the program got.</li>
        </ol>
      </Definition>

      <Example title="syntax errors look different">
        <Code>{`
  File "grade.py", line 2
    if score > 50
                 ^
SyntaxError: expected ':'
`}</Code>
        <p>
          There is no chain of calls, because nothing ran. The caret marks where Python noticed the problem, which is
          sometimes just <em>after</em> the actual mistake: an unclosed bracket on one line may be reported on the next.
        </p>
      </Example>

      <Example title="where the error appears is not always where the bug is">
        <p>
          In the TypeError case, the program stopped on line 4, which is perfectly good code. The bug is the string{" "}
          <C>&quot;40&quot;</C> on line 7. The traceback shows where a wrong value finally caused a failure; your job is
          to find where the wrong value was made, using the debugging method of the previous lesson.
        </p>
      </Example>

      <Remark title="search wisely">
        <p>
          The last line of a traceback, with your own names removed, is an excellent search query: thousands of programmers
          have met the same message. But read the explanation you find, rather than pasting the first fix, and make sure
          you understand why the fix works. In large codebases, tracebacks can be dozens of calls deep; the frames that
          matter are usually the ones in your own code, and those are the ones to read first.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "order",
      rung: "check",
      prompt: <p>Which line of a traceback should you read first?</p>,
      answer: { kind: "choice", options: ["The last line, which names the exception", "The first line", "The line with the most markers"], correct: [0] },
    },
    {
      key: "stopped",
      rung: "check",
      prompt: <p>In the TypeError case of the visualisation, on which line of <C>shop.py</C> did the program stop?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "realbug",
      rung: "apply",
      prompt: <p>In the same case, which line should be changed to fix the bug?</p>,
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "concat",
      rung: "apply",
      prompt: (
        <>
          <p>With <C>age = 16</C>, this line fails:</p>
          <Code>{`
print("Age: " + age)
`}</Code>
          <p>
            with <C>TypeError: can only concatenate str (not &quot;int&quot;) to str</C>. Which change fixes it?
          </p>
        </>
      ),
      answer: { kind: "choice", options: ['print("Age: " + str(age))', 'print("Age: " + int(age))', 'print(int("Age: ") + age)'], correct: [0] },
    },
    {
      key: "keyerror",
      rung: "apply",
      prompt: <p>A program working with a dictionary of marks stops with <C>KeyError: &apos;phsyics&apos;</C>. What is the most likely cause?</p>,
      answer: { kind: "choice", options: ["The key was misspelt, so the dictionary has no such key", "The dictionary is empty", "A mark is not a number"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`try:
    {"a": 1}["b"]
except Exception as e:
    print(type(e).__name__, e)`}</Code>
          <p>Every error has a type and a message. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["KeyError 'b'", "IndexError b", "KeyError a", "NameError 'b'"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import traceback
def a(x):
    return b(x) + 1
def b(x):
    return [1, 2, 3][x]
try:
    a(5)
except Exception as e:
    tb = traceback.extract_tb(e.__traceback__)
    print(type(e).__name__, e, [f.name for f in tb])`}</Code>
          <p>The exception type, its message, and the chain of function calls from the traceback. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["IndexError list index out of range ['<module>', 'a', 'b']", "IndexError list index out of range ['b', 'a', '<module>']", "KeyError 5 ['<module>', 'a', 'b']", "IndexError 5 ['a', 'b']"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Running this program stops with <C>TypeError: can only concatenate str (not "int") to str</C>. Read the message, find the line, and fix it so it prints <C>Total: 30</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `a = 10
b = 20
print("Total: " + a + b)
`,
        solution: `a = 10
b = 20
print("Total: " + str(a + b))
`,
        tests: [
          { name: "output", code: `assert printed.strip() == 'Total: 30', 'Add the numbers first, then turn the sum into text with str().'` },
          { name: "values", code: `assert a == 10 and b == 20, 'Fix the printing, not the numbers.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>error_summary(code)</C>, which compiles the text <C>code</C> with the file name <C>"&lt;snippet&gt;"</C>, runs it with <C>exec</C> in a fresh dictionary, and returns <C>None</C> if it finishes, or the tuple (exception class name, message, line number) otherwise. The line number is that of the last traceback frame (from <C>traceback.extract_tb</C>) whose file name is <C>"&lt;snippet&gt;"</C>; for a <C>SyntaxError</C>, which happens before running, use the exception&rsquo;s own <C>lineno</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def error_summary(code):
    return None
`,
        solution: `import traceback

def error_summary(code):
    try:
        compiled = compile(code, '<snippet>', 'exec')
    except SyntaxError as e:
        return ('SyntaxError', e.msg, e.lineno)
    try:
        exec(compiled, {})
    except Exception as e:
        frames = [f for f in traceback.extract_tb(e.__traceback__) if f.filename == '<snippet>']
        return (type(e).__name__, str(e), frames[-1].lineno)
    return None
`,
        tests: [
          { name: "fine", code: `assert error_summary('x = 1\\ny = x + 1') is None` },
          { name: "runtime", code: `code = 'def f(d):\\n    return d["k"]\\n\\nx = 1\\nf({})\\n'
assert error_summary(code) == ('KeyError', "'k'", 2), 'Point at the line inside f, not the call.'
assert error_summary('a = 1\\nb = a + "2"')[:1] == ('TypeError',) and error_summary('a = 1\\nb = a + "2"')[2] == 2` },
          { name: "syntax", code: `name, msg, line = error_summary('x = 1\\nif x > 0\\n    print(x)\\n')
assert name == 'SyntaxError' and line == 2, 'A missing colon is reported on line 2.'` },
          { name: "zero", code: `assert error_summary('\\n\\nprint(1 / 0)') == ('ZeroDivisionError', 'division by zero', 3)` },
        ],
      },
    },
    {
      key: "procedure",
      rung: "prove",
      prompt: (
        <p>
          Describe a step-by-step procedure for going from a traceback to the cause of a crash. Use the TypeError case to
          explain why the line where the program stopped is not always the line that must be changed.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Reads the exception type and message on the last line first.",
          "Finds the last File line to see where the program stopped, and reads that code.",
          "Asks which values would cause that line to fail, and works back up the call chain or through the data to where those values came from.",
          "Applies it to the example: line 4 failed because p was the string \"40\", which came from the list on line 7, so line 7 is the bug.",
        ],
      },
    },
    {
      key: "deep",
      rung: "stretch",
      prompt: (
        <>
          <p>Read this traceback. How many items were in <C>nums</C> when the error happened?</p>
          <Code>{`
Traceback (most recent call last):
  File "report.py", line 20, in <module>
    print(report(name, []))
          ~~~~~~^^^^^^^^^^
  File "report.py", line 12, in report
    avg = average(marks)
          ~~~~~~~^^^^^^^
  File "report.py", line 3, in average
    return sum(nums) / len(nums)
           ~~~~~~~~~~^~~~~~~~~~~
ZeroDivisionError: division by zero
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 0 },
    },
  ],

  teachBack:
    "Explain to a friend how to read a Python traceback from the bottom up, and why the line where a program crashed may not be the line with the bug.",

  glimpse: (
    <p>
      Next, the last lesson of this course: a small project that uses everything so far. In Software Engineering for ML
      Research you will find your way around codebases far larger than anything here, where reading tracebacks well saves
      hours, and in Computer Systems you will see the call stack that a traceback describes.
    </p>
  ),
};
