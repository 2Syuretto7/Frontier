import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TraceViz } from "@/components/viz/TraceViz";
import { code, steps } from "@/content/traces/e0.3.2";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e0.3.2",
  minutes: 45,
  links: {
    revisits: ["e0.3.1"],
    parallels: ["m0.3.1", "m0.3.4"],
    foreshadows: ["e1.3.5", "e4.1.1"],
  },

  puzzle: (
    <>
      <p>
        Here is a function that prints the area of a rectangle:
      </p>
      <Code>{`
def area(width, height):
    print(width * height)
`}</Code>
      <p>
        You now want the total area of two rectangles, 3 by 4 and 5 by 2. Can you write <C>area(3, 4) + area(5, 2)</C>?
        What is missing from this function that a calculator&rsquo;s square-root button, for instance, does have?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Printing shows a value to a person, but the rest of the program never gets it. A square-root button hands its answer
        back so you can keep calculating with it. In Python, a function hands a value back with <C>return</C>, and the call
        itself then stands for that value, just like <em>&radic;9</em> stands for 3 in <em>&radic;9 + 1</em>.
      </p>
      <p>
        In the program below, <C>cost</C> uses the value returned by <C>area</C>. Watch the call on line 9 descend into{" "}
        <C>cost</C>, then into <C>area</C>, and the values come back up.
      </p>
      <TraceViz code={code} steps={steps} />
    </>
  ),

  theory: (
    <>
      <Definition title="return">
        <p>
          The statement <C>return expression</C> ends the function at once and makes the value of the expression the value
          of the call. A function may have several <C>return</C> statements, for example in different branches of an{" "}
          <C>if</C>; whichever runs first decides the result.
        </p>
      </Definition>

      <Definition title="None">
        <p>
          A function that ends without running a <C>return</C> statement returns the special value <C>None</C>, which means
          &ldquo;no value&rdquo;. Its type is <C>NoneType</C>. A common bug is to print a result inside a function and then
          try to use the function&rsquo;s value, which is <C>None</C>.
        </p>
      </Definition>

      <Definition title="arguments">
        <p>Arguments can be passed in three ways:</p>
        <Code>{`
def price(amount, discount=0.1):
    return amount * (1 - discount)

price(200)                       # 180.0: discount takes its default value
price(200, 0.25)                 # 150.0: arguments matched by position
price(discount=0.5, amount=80)   # 40.0: arguments matched by name
`}</Code>
        <p>
          A parameter with <C>=</C> in the definition has a <strong>default value</strong>, used when the caller leaves it
          out. Passing arguments by name, called <strong>keyword arguments</strong>, makes calls with many arguments
          easier to read.
        </p>
      </Definition>

      <Example title="functions built from functions">
        <p>
          Because <C>area</C> returns its answer, it can be used inside any expression: <C>area(3, 4) + area(5, 2)</C> is
          22, and <C>cost</C> is a one-line function built on top of it. Large programs are towers of small functions, each
          using the values returned by the ones below.
        </p>
      </Example>

      <Remark title="return, not print">
        <p>
          A function that takes its inputs as parameters and gives its output by <C>return</C>, without printing or changing
          anything else, is easy to reuse, combine and test: call it with some values and check what comes back. Keep printing
          for the outermost part of the program, which talks to the user. This mirrors the mathematical idea of a function: an
          input goes in, an output comes out, and nothing else happens.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "none",
      rung: "check",
      prompt: <p>What does a function return if its body has no <C>return</C> statement?</p>,
      answer: { kind: "choice", options: ["None", "0", "The last value it printed", "An error"], correct: [0] },
    },
    {
      key: "ends",
      rung: "check",
      prompt: <p>What happens to the lines after a <C>return</C> statement that runs?</p>,
      answer: { kind: "choice", options: ["They do not run: the function ends immediately", "They run, then the value is returned", "They run only if the value is None"], correct: [0] },
    },
    {
      key: "nest",
      rung: "apply",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
def f(x):
    return x * x + 1

print(f(f(2)))
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 26 },
    },
    {
      key: "default",
      rung: "apply",
      prompt: <p>Using the <C>price</C> function of the lesson, what is <C>price(300)</C>?</p>,
      answer: { kind: "numeric", value: 270 },
    },
    {
      key: "printnone",
      rung: "apply",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
def show(x):
    print(x * 2)

y = show(4)
print(y)
`}</Code>
        </>
      ),
      answer: { kind: "choice", options: ["8, then None", "8, then 8", "None, then 8", "Only 8"], correct: [0] },
    },
    {
      key: "printreturn",
      rung: "prove",
      prompt: (
        <p>
          Explain the difference between a function that prints its result and one that returns it. Give a short example of
          something you can do with the second that you cannot do with the first, and explain why returning makes a function
          easier to test.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains that print shows a value to the person running the program, while return passes the value back to the code that called the function.",
          "Notes that a printing function returns None, so its result cannot be used in further calculation.",
          "Gives an example such as adding two results, passing one result into another function, or storing it in a variable.",
          "Explains that a returned value can be compared automatically with the expected value, while printed output must be read by a person.",
        ],
      },
    },
    {
      key: "early",
      rung: "stretch",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
def first_even_multiple(limit):
    for n in range(1, limit):
        if n % 7 == 0 and n % 2 == 0:
            return n
    return -1

print(first_even_multiple(10) + first_even_multiple(30))
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 13 },
    },
  ],

  teachBack:
    "Explain to a friend the difference between returning a value and printing it, what None is, and how default and keyword arguments work.",

  glimpse: (
    <p>
      Next, scope: which names a function can see, and why a variable inside a function is separate from one outside it. In
      Python, NumPy and the Command Line you will add type hints that say what a function takes and returns, and Software
      Engineering for ML Research builds on small, testable functions throughout.
    </p>
  ),
};
