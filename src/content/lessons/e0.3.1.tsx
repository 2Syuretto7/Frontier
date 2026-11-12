import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TraceViz } from "@/components/viz/TraceViz";
import { code, steps } from "@/content/traces/e0.3.1";
import type { LessonContent } from "@/lib/types";
import { Playground } from "@/components/code/Playground";

export const lesson: LessonContent = {
  id: "e0.3.1",
  minutes: 40,
  links: {
    revisits: ["e0.1.1"],
    parallels: ["m0.3.1"],
    foreshadows: ["e1.3.2"],
  },

  puzzle: (
    <>
      <p>
        A recipe book has twenty recipes, and eleven of them begin: &ldquo;Boil water, add salt, add the pasta, cook for nine
        minutes, drain.&rdquo; Later you discover that the pasta needs eleven minutes, not nine.
      </p>
      <p>
        How many places must you correct? How could the book have been written so that the correction was needed in only one
        place?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A well-written book would describe &ldquo;cook the pasta&rdquo; once, and each recipe would just say &ldquo;cook the
        pasta&rdquo;. A <strong>function</strong> does this for programs: it gives a name to a block of code, and the rest of
        the program uses the name.
      </p>
      <p>
        Step through and watch the highlighted line. Defining the function does not run it; each call jumps into the body,
        and at the end of the body Python jumps back to just after the call.
      </p>
      <TraceViz code={code} steps={steps} />
    </>
  ),

  theory: (
    <>
      <Definition title="defining a function">
        <Code>{`
def name(parameter_1, parameter_2):
    body
`}</Code>
        <p>
          A <C>def</C> statement creates a function. The first line gives its name and, in brackets, its{" "}
          <strong>parameters</strong>: names that will hold the values passed in. The indented <strong>body</strong> is
          stored, not run. Function names follow the same rules as variable names, and are usually verbs:{" "}
          <C>greet</C>, <C>print_report</C>.
        </p>
      </Definition>

      <Definition title="calling a function">
        <p>
          A <strong>call</strong> is the function&rsquo;s name followed by brackets containing <strong>arguments</strong>,
          such as <C>greet(&quot;Asha&quot;)</C>. Python binds each parameter to the matching argument, runs the body, and
          then carries on from where the call was made. The brackets are essential: <C>greet</C> on its own names the
          function without calling it, and does nothing.
        </p>
      </Definition>

      <Example title="a function used in a loop">
        <Playground code={`
def line(n):
    print("*" * n)

for k in range(1, 4):
    line(k)
`} />
        <p>
          This prints a triangle of 1, 2 and 3 stars. To change how each row looks, for example to use <C>#</C> instead
          of <C>*</C>, you edit one line inside the function, and every row changes.
        </p>
      </Example>

      <Remark title="why functions matter">
        <p>
          Functions are the main tool for managing complexity. They avoid repetition, so a fix is made once. They give a
          name to an idea, so the program reads like a description of what it does. And they let you think about one piece at
          a time: once <C>greet</C> works, you can use it without remembering how. The rule of thumb is: if you have written
          the same few lines twice, consider a function; if three times, write one.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "when",
      rung: "check",
      prompt: <p>When does the body of a function run?</p>,
      answer: {
        kind: "choice",
        options: ["Each time the function is called", "Once, when Python reaches the def line", "Only at the end of the program"],
        correct: [0],
      },
    },
    {
      key: "brackets",
      rung: "check",
      prompt: <p>A program defines <C>hello</C>, then has the line <C>hello</C> with no brackets. What happens on that line?</p>,
      answer: { kind: "choice", options: ["Nothing visible: the function is named but not called", "The function runs", "Python stops with an error"], correct: [0] },
    },
    {
      key: "lines",
      rung: "apply",
      prompt: (
        <>
          <p>How many lines does this program print?</p>
          <Code>{`
def shout():
    print("Hey")
    print("Hey")

shout()
print("done")
shout()
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "stars",
      rung: "apply",
      prompt: <p>In the triangle example, how many stars are printed altogether?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "orderdef",
      rung: "apply",
      prompt: (
        <>
          <p>What happens when this program runs?</p>
          <Code>{`
greet("Asha")

def greet(name):
    print("Hello,", name)
`}</Code>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["It stops with a NameError, because greet is not yet defined on line 1", "It prints Hello, Asha", "It prints nothing"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def greet(name):
    print("Hello,", name)

r = greet("Ravi")
print(r)`}</Code>
          <p>A function that prints but has no return statement. What is the second line printed?</p>
        </>
      ),
      answer: { kind: "choice", options: ["None", "Hello, Ravi", "Ravi", "An error"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"
def shout(f, *args):
    return f(*args).upper()
print(greet("Ravi"), shout(greet, "Asha", "Hi"))`}</Code>
          <p>A default argument, and a function passed to another function. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["Hello, Ravi! HI, ASHA!", "Hello, Ravi! HELLO, ASHA!", "Hello, Ravi! Hi, Asha!", "Hello, Ravi! HI, ASHA"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>area(w, h)</C>, the area of a rectangle, and <C>perimeter(w, h)</C>. Return the values; do not print them.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def area(w, h):
    print(w * h)

def perimeter(w, h):
    print(2 * (w + h))
`,
        solution: `def area(w, h):
    return w * h

def perimeter(w, h):
    return 2 * (w + h)
`,
        tests: [
          { name: "area", code: `assert area(3, 4) == 12, 'area must return w × h, not print it.'` },
          { name: "perimeter", code: `assert perimeter(3, 4) == 14, 'perimeter is 2(w + h).'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Functions can call other functions. Write <C>square(x)</C>; <C>hypotenuse(a, b)</C>, the longest side of a right-angled triangle with shorter sides a and b, using <C>square</C> and <C>math.sqrt</C>; and <C>triangle_perimeter(a, b)</C>, the sum of all three sides, using <C>hypotenuse</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def square(x):
    return x

def hypotenuse(a, b):
    return a + b

def triangle_perimeter(a, b):
    return a + b
`,
        solution: `import math

def square(x):
    return x * x

def hypotenuse(a, b):
    return math.sqrt(square(a) + square(b))

def triangle_perimeter(a, b):
    return a + b + hypotenuse(a, b)
`,
        tests: [
          { name: "square", code: `assert square(3) == 9 and square(-4) == 16 and square(0.5) == 0.25` },
          { name: "hypotenuse", code: `assert hypotenuse(3, 4) == 5.0 and hypotenuse(5, 12) == 13.0 and abs(hypotenuse(1, 1) - 2 ** 0.5) < 1e-12, 'Pythagoras: the square root of a² + b².'` },
          { name: "perimeter", code: `assert triangle_perimeter(3, 4) == 12.0 and triangle_perimeter(6, 8) == 24.0, 'Add the two short sides and the hypotenuse.'` },
        ],
      },
    },
    {
      key: "why",
      rung: "prove",
      prompt: (
        <p>
          A program prints a formatted receipt in four different places, using the same six lines each time. Explain three
          concrete benefits of moving those lines into a function, and describe what the program would look like afterwards.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that a change or fix is made once, in the function, instead of in four places that could drift apart.",
          "Notes that a well-chosen name makes the calling code read as a description of what happens.",
          "Notes that the function can be understood and tested on its own.",
          "Describes one def with the six lines, possibly with parameters for what differs, and four short calls.",
        ],
      },
    },
    {
      key: "calls",
      rung: "stretch",
      prompt: (
        <>
          <p>How many times is <C>B</C> printed?</p>
          <Code>{`
def a():
    print("A")
    b()

def b():
    print("B")

a()
b()
a()
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 3 },
    },
  ],

  teachBack:
    "Explain to a friend what happens when Python reaches a def statement and when it reaches a call, and why functions make programs easier to change.",

  glimpse: (
    <p>
      Next, functions that take values in and hand results back with return. In Python, NumPy and the Command Line you will
      treat functions as values that can be passed to other functions and wrapped in decorators.
    </p>
  ),
};
