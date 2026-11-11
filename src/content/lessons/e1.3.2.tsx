import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TraceViz } from "@/components/viz/TraceViz";
import { code, steps } from "@/content/traces/e1.3.2";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.3.2",
  minutes: 50,
  links: {
    requires: ["e1.3.1"],
    revisits: ["e0.3.1", "e0.3.3"],
    parallels: ["m1.7.3"],
    foreshadows: ["e1.3.3"],
  },

  puzzle: (
    <>
      <p>
        You want to know how many times each of a dozen functions in your training code is called, without editing any of
        their bodies.
      </p>
      <p>
        Could you write one function that takes another function and hands back a new one that behaves the same but also
        counts? Where would the count live between calls?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In Python, functions are objects: they can be passed in, returned and stored. A function defined inside another can
        use the outer function&rsquo;s variables, and keeps them alive after the outer function returns. That is a{" "}
        <strong>closure</strong>, and it is exactly where the count can live. Wrapping a function this way is so common that
        Python gives it special syntax, the <strong>decorator</strong>.
      </p>
      <TraceViz code={code} steps={steps} />
    </>
  ),

  theory: (
    <>
      <Definition title="first-class functions">
        <p>
          A function is an object like any other. You can pass one as an argument, as in <C>sorted(words, key=len)</C>, return
          one, or store it in a dictionary. A <C>lambda</C> is a small unnamed function written as an expression:{" "}
          <C>lambda x: x * x</C>.
        </p>
      </Definition>

      <Definition title="closures">
        <p>
          A <strong>closure</strong> is a function together with the variables it uses from an enclosing function. Those
          variables are looked up when the inner function runs, not when it is defined, and they survive as long as the inner
          function does. To <em>reassign</em> such a variable, rather than just read it, declare it <C>nonlocal</C>.
        </p>
      </Definition>

      <Example title="late binding">
        <Code>{`fs = [lambda: i for i in range(3)]
print(fs[0](), fs[1](), fs[2]())    # 2 2 2, not 0 1 2`}</Code>
        <p>
          All three lambdas close over the same variable <C>i</C>, which is 2 by the time they are called. Bind the current
          value with a default argument, <C>lambda i=i: i</C>, to capture it at definition time.
        </p>
      </Example>

      <Definition title="decorators">
        <p>Writing</p>
        <Code>{`@counted
def square(x):
    return x * x`}</Code>
        <p>
          is shorthand for defining <C>square</C> and then running <C>square = counted(square)</C>. A decorator is any callable
          that takes a function and returns a replacement. Inside, use <C>functools.wraps(fn)</C> on the wrapper so it keeps
          the original&rsquo;s name and documentation.
        </p>
      </Definition>

      <Remark title="decorators you will meet">
        <p>
          <C>@functools.lru_cache</C> remembers results so repeated calls are instant. <C>@torch.no_grad()</C> runs a function
          without recording gradients. <C>@dataclass</C> writes a class&rsquo;s boilerplate for you. <C>@pytest.mark.parametrize</C>{" "}
          runs a test on many inputs. Each is just a function applied to your function or class.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sugar",
      rung: "check",
      prompt: <p>Writing <C>@counted</C> above <C>def square</C> is equivalent to what?</p>,
      answer: { kind: "choice", options: ["square = counted(square), after defining square", "counted = square(counted)", "Calling counted every time square is defined"], correct: [0] },
    },
    {
      key: "nonlocal",
      rung: "check",
      prompt: <p>Why does <C>wrapper</C> need <C>nonlocal calls</C>?</p>,
      answer: { kind: "choice", options: ["calls += 1 reassigns calls, which would otherwise make it a new local variable", "To make calls global", "To speed up the lookup"], correct: [0] },
    },
    {
      key: "count",
      rung: "apply",
      prompt: <p>If the traced program called <C>square</C> five times in all, what would <C>calls</C> be after the last call?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "late",
      rung: "apply",
      prompt: <p>With <C>fs = [lambda: i for i in range(3)]</C>, what does <C>fs[0]()</C> return?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "cache",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from functools import lru_cache

@lru_cache
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

fib(10)`}</Code>
          <p>How many times does the body of <C>fib</C> run during <C>fib(10)</C>?</p>
        </>
      ),
      answer: { kind: "numeric", value: 11 },
    },
    {
      key: "timer",
      rung: "prove",
      prompt: (
        <p>
          Write a decorator <C>timed</C> that prints how long each call to the decorated function took, and returns its result
          unchanged. Explain where each piece of state lives, and why you would use <C>functools.wraps</C>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Defines timed(fn) returning an inner wrapper(*args, **kwargs) that records time.perf_counter() before and after calling fn.",
          "Returns fn's result from the wrapper, so behaviour is unchanged apart from the printing.",
          "Explains that fn is held in the wrapper's closure, while the start time is a local of each call.",
          "Explains functools.wraps copies fn's name and docstring onto the wrapper, so debugging and introspection still show the original.",
        ],
      },
    },
    {
      key: "mult",
      rung: "stretch",
      prompt: (
        <>
          <Code>{`def make(k):
    return lambda x: k * x

double, triple = make(2), make(3)`}</Code>
          <p>What is <C>double(triple(5))</C>?</p>
        </>
      ),
      answer: { kind: "numeric", value: 30 },
    },
  ],

  teachBack:
    "Explain to a friend what a closure is, what @decorator really does, and why all the lambdas in a loop can return the same value.",

  glimpse: (
    <p>
      Next, classes and the special methods that let your own types work with Python&rsquo;s operators. Functions that take and
      return functions are also the heart of automatic differentiation, which turns a function into its gradient.
    </p>
  ),
};
