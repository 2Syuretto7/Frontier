import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TraceViz } from "@/components/viz/TraceViz";
import { code, steps } from "@/content/traces/e0.3.4";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e0.3.4",
  minutes: 50,
  links: {
    revisits: ["e0.3.2", "e0.2.1"],
    foreshadows: ["e4.4.2", "e2.7.1"],
  },

  puzzle: (
    <>
      <p>
        Your school wants a program that takes each student&rsquo;s three marks and prints a line such as{" "}
        <C>Asha: 84.7 (A)</C>, with the average to one decimal place and a letter grade.
      </p>
      <p>
        Before writing any code, break the job into smaller jobs, each simple enough to describe in one sentence. What are
        the pieces? What does each one need to be given, and what does it produce?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A natural split is: work out an average; turn a score into a letter; and put a student&rsquo;s line together using
        the other two. Each piece becomes a function. The main program then says what happens in one line per student, and
        each function hides one piece of detail.
      </p>
      <p>
        Step through and watch the calls go down from <C>report</C> into <C>average</C> and <C>grade</C>, and the results
        come back up.
      </p>
      <TraceViz code={code} steps={steps} />
    </>
  ),

  theory: (
    <>
      <Definition title="decomposition">
        <p>
          <strong>Decomposition</strong> is breaking a problem into smaller problems that can be solved separately. In a
          program, each smaller problem usually becomes a function with a clear name, clear inputs (its parameters) and a
          clear output (its return value).
        </p>
      </Definition>

      <Definition title="top-down design">
        <p>
          In <strong>top-down design</strong> you first write the main program as if helpful functions already existed, then
          write each of those functions, breaking them down further if they are still too large. Writing the top first keeps
          the purpose in view:
        </p>
        <Code>{`
def main():
    marks = read_marks()
    for name, a, b, c in marks:
        print(report(name, a, b, c))
`}</Code>
        <p>
          A function that does nothing yet except return a fixed value, such as <C>return &quot;A&quot;</C> for{" "}
          <C>grade</C>, is called a <strong>stub</strong>. Stubs let you run the program early and fill in the real work
          one function at a time.
        </p>
      </Definition>

      <Definition title="docstrings">
        <p>
          A string on the first line of a function&rsquo;s body is its <strong>docstring</strong>. It says what the
          function does, not how:
        </p>
        <Code>{`
def grade(score):
    """Return the letter grade, A, B or C, for a score out of 100."""
`}</Code>
      </Definition>

      <Example title="testing the pieces">
        <p>
          Because each function in the traced program returns a value, each can be checked on its own before the whole is
          assembled: <C>average(60, 70, 80)</C> should be <C>70.0</C>, <C>grade(80)</C> should be <C>&quot;A&quot;</C>, and{" "}
          <C>grade(79.9)</C> should be <C>&quot;B&quot;</C>. If the full report is wrong, these small checks tell you which
          piece is at fault.
        </p>
      </Example>

      <Remark title="where to draw the lines">
        <p>
          Good boundaries come with practice, but a few tests help. Can you name the function with a short verb phrase that
          says everything it does? If the name needs &ldquo;and&rdquo;, consider splitting it. Does it fit on one screen? Does
          each line inside it work at the same level of detail? A function that mixes the overall plan with fiddly arithmetic is
          usually hiding a smaller function.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "onejob",
      rung: "check",
      prompt: <p>Which is the best description of a well-designed function?</p>,
      answer: {
        kind: "choice",
        options: ["It does one clearly named job, with clear inputs and output", "It does as much as possible, to reduce the number of functions", "It uses global variables so it needs no parameters"],
        correct: [0],
      },
    },
    {
      key: "stub",
      rung: "check",
      prompt: <p>What is a stub?</p>,
      answer: {
        kind: "choice",
        options: ["A placeholder function that returns a fixed value until it is written properly", "A function with no parameters", "The first line of a function"],
        correct: [0],
      },
    },
    {
      key: "edge",
      rung: "apply",
      prompt: <p>Using the traced program, what does <C>grade(79.9)</C> return?</p>,
      answer: { kind: "choice", options: ["A", "B", "C"], correct: [1] },
    },
    {
      key: "meera",
      rung: "apply",
      prompt: <p>What does <C>report(&quot;Meera&quot;, 90, 70, 80)</C> return?</p>,
      answer: { kind: "choice", options: ["Meera: 80.0 (A)", "Meera: 80.0 (B)", "Meera: 80 (A)"], correct: [0] },
    },
    {
      key: "calls",
      rung: "apply",
      prompt: (
        <p>
          When <C>report(&quot;Asha&quot;, 78, 85, 91)</C> runs, how many calls are made to functions defined in the
          program, counting the call to <C>report</C> itself?
        </p>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def clean(s):
    return s.strip().lower()

def words(s):
    return clean(s).split()

print(len(words("  The Quick brown FOX  ")))`}</Code>
          <p>Two small functions build on each other. What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def clean(s):
    return s.strip().lower()
def words(s):
    return clean(s).split()
def longest(s):
    return max(words(s), key=len)
print(longest("  The quick Brown fox  "), len(words("a  b   c")))`}</Code>
          <p>Small functions built on each other. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["quick 3", "brown 3", "quick 5", "The 3"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Break the task into functions. Write <C>parse(line)</C>, which turns <C>"name,marks"</C> into a tuple (name, int marks), and <C>topper(lines)</C>, which uses <C>parse</C> to return the name with the highest marks.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def parse(line):
    return line.split(',')

def topper(lines):
    return lines[0]
`,
        solution: `def parse(line):
    name, marks = line.split(',')
    return (name, int(marks))

def topper(lines):
    best = max((parse(l) for l in lines), key=lambda t: t[1])
    return best[0]
`,
        tests: [
          { name: "parse", code: `assert parse('Meera,88') == ('Meera', 88), 'Split on the comma and convert the marks to int.'` },
          { name: "topper", code: `assert topper(['Meera,88', 'Arjun,92', 'Zoya,9']) == 'Arjun', 'Compare marks as numbers: as text, "9" beats "88".'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Build a marks report from small functions. Write <C>parse_line(line)</C>, turning <C>"Asha: 78, 91, 66"</C> into <C>("Asha", [78, 91, 66])</C> (spaces may vary); <C>average(marks)</C>; <C>letter(avg)</C>, which is <C>"A"</C> from 85, <C>"B"</C> from 70, <C>"C"</C> from 55 and otherwise <C>"F"</C>; and <C>report(lines)</C>, a list of strings like <C>"Asha 78.3 B"</C> (average to one decimal place) sorted by average from highest, then by name. <C>report</C> must use the other three.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def parse_line(line):
    return ('', [])

def average(marks):
    return 0.0

def letter(avg):
    return 'F'

def report(lines):
    return []
`,
        solution: `def parse_line(line):
    name, _, rest = line.partition(':')
    return (name.strip(), [int(x) for x in rest.split(',')])

def average(marks):
    return sum(marks) / len(marks)

def letter(avg):
    if avg >= 85:
        return 'A'
    if avg >= 70:
        return 'B'
    if avg >= 55:
        return 'C'
    return 'F'

def report(lines):
    rows = []
    for line in lines:
        name, marks = parse_line(line)
        a = average(marks)
        rows.append((-a, name, f'{name} {a:.1f} {letter(a)}'))
    return [r[2] for r in sorted(rows)]
`,
        tests: [
          { name: "parse", code: `assert parse_line('Asha: 78, 91, 66') == ('Asha', [78, 91, 66]) and parse_line(' Ravi :100,0 ') == ('Ravi', [100, 0])` },
          { name: "letters", code: `assert [letter(x) for x in (100, 85, 84.9, 70, 55, 54.99, 0)] == ['A', 'A', 'B', 'B', 'C', 'F', 'F'] and average([1, 2]) == 1.5` },
          { name: "report", code: `r = report(['Asha: 78, 91, 66', 'Zoya: 90, 80', 'Ravi: 85, 85', 'Dev: 40, 50, 60'])
assert r == ['Ravi 85.0 A', 'Zoya 85.0 A', 'Asha 78.3 B', 'Dev 50.0 F'], 'Highest average first; ties by name.'` },
        ],
      },
    },
    {
      key: "design",
      rung: "prove",
      prompt: (
        <p>
          A program must take a week of daily maximum temperatures and print the hottest day, the average, and the number of
          days above 35 degrees. Design it top-down: write the main program as calls to functions, then give each function a
          name, its parameters, what it returns and a one-sentence docstring. Explain why you split it as you did.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes a short main part that calls named functions rather than containing the detailed logic.",
          "Gives functions such as hottest, average and count_above, each with sensible parameters (for example the temperatures, and a threshold).",
          "States what each returns and gives a docstring saying what, not how.",
          "Justifies the split: each function does one job that can be named and tested on its own.",
        ],
      },
    },
    {
      key: "compose",
      rung: "stretch",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
def double(x):
    return 2 * x

def inc(x):
    return x + 1

def combo(x):
    return double(inc(double(x)))

print(combo(3) - combo(1))
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 8 },
    },
  ],

  teachBack:
    "Explain to a friend how to break a programming problem into functions top-down, what stubs and docstrings are for, and how to tell whether a function does too much.",

  glimpse: (
    <p>
      This completes Functions. Next, data structures, starting with lists. Software Engineering for ML Research returns to
      modular design for research code, and in Data Structures and Algorithms you will meet divide and conquer, where a
      problem is broken into smaller copies of itself.
    </p>
  ),
};
