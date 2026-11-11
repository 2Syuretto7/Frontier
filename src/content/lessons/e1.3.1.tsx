import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ObjectsViz } from "@/components/viz/ObjectsViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.3.1",
  minutes: 50,
  links: {
    requires: ["e0.4.1"],
    revisits: ["e0.1.2", "e0.3.2"],
    foreshadows: ["e1.3.3", "e1.5.4"],
  },

  puzzle: (
    <>
      <p>Predict what this prints before reading on.</p>
      <Code>{`weights = [0.5, 0.5]
backup = weights
weights[0] = 0.9
print(backup)`}</Code>
      <p>
        Most people new to Python expect <C>[0.5, 0.5]</C>. It prints <C>[0.9, 0.5]</C>. What must <C>backup = weights</C>{" "}
        really mean for that to happen?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In Python, a variable is not a box holding a value. It is a <strong>name</strong> attached to an{" "}
        <strong>object</strong> that lives elsewhere. Assignment attaches a name to an object; it never copies. So{" "}
        <C>backup = weights</C> gives one list a second name, and a change through either name is a change to the one list.
      </p>
      <ObjectsViz />
      <p>
        Whether sharing can surprise you depends on whether the object can change. Lists can, so shared lists change under
        every name. Strings cannot, so &ldquo;changing&rdquo; one really builds a new object and moves one name to it.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="objects">
        <p>Every value in Python is an object with three properties:</p>
        <ul>
          <li>an <strong>identity</strong>, fixed for its lifetime, given by <C>id(x)</C> and compared with <C>is</C>;</li>
          <li>a <strong>type</strong>, given by <C>type(x)</C>, which decides what operations it supports;</li>
          <li>a <strong>value</strong>, compared with <C>==</C>.</li>
        </ul>
        <p>
          An object is <strong>mutable</strong> if its value can change after creation (lists, dictionaries, sets, most objects
          you define) and <strong>immutable</strong> otherwise (numbers, strings, tuples, frozensets).
        </p>
      </Definition>

      <Definition title="assignment and arguments">
        <p>
          <C>name = expression</C> evaluates the expression to an object and binds the name to it. Passing an argument to a
          function does the same: the parameter becomes another name for the caller&rsquo;s object. So a function can change a
          mutable argument in place, and the caller will see it, but rebinding the parameter to a new object affects only the
          function.
        </p>
      </Definition>

      <Example title="copies, shallow and deep">
        <Code>{`import copy
a = [[1, 2], [3, 4]]
b = list(a)            # shallow copy: a new outer list, the same inner lists
c = copy.deepcopy(a)   # deep copy: new objects all the way down
a[0].append(99)
print(b[0], c[0])      # [1, 2, 99] [1, 2]`}</Code>
      </Example>

      <Remark title="two classic traps">
        <p>
          <C>[[0] * 3] * 2</C> makes a list holding the <em>same</em> inner list twice, so setting one cell sets a cell in
          both rows; build grids with <C>[[0] * 3 for _ in range(2)]</C>. And a default argument such as{" "}
          <C>def add(item, bucket=[])</C> is evaluated once, when the function is defined, so every call shares one list. Use{" "}
          <C>bucket=None</C> and create the list inside the function.
        </p>
      </Remark>

      <Remark title="the data model">
        <p>
          Python&rsquo;s operators and built-in functions work by calling special methods on objects: <C>len(x)</C> calls{" "}
          <C>x.__len__()</C>, <C>x[i]</C> calls <C>x.__getitem__(i)</C>, <C>a + b</C> calls <C>a.__add__(b)</C>. This
          protocol, the <strong>data model</strong>, is why a NumPy array or a PyTorch tensor can behave like a built-in value.
          Only immutable objects, or ones that promise not to change their hash, may be dictionary keys.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "alias",
      rung: "check",
      prompt: <p>After <C>b = a</C>, where <C>a</C> is a list, what does <C>b.append(1)</C> do to <C>a</C>?</p>,
      answer: { kind: "choice", options: ["a gains the 1 too, because a and b name the same list", "Nothing; b is a copy", "It raises an error"], correct: [0] },
    },
    {
      key: "is",
      rung: "check",
      prompt: <p>What does <C>x is y</C> test?</p>,
      answer: { kind: "choice", options: ["Whether x and y refer to the same object", "Whether x and y have equal values", "Whether x and y have the same type"], correct: [0] },
    },
    {
      key: "zeros",
      rung: "apply",
      prompt: <p><C>x = [0] * 3</C>, <C>y = x</C>, <C>y[0] = 9</C>. What is <C>x[0]</C>?</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "default",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def add(item, bucket=[]):
    bucket.append(item)
    return bucket

add(1)
add(2)
print(len(add(3)))`}</Code>
          <p>What is printed?</p>
        </>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "grid",
      rung: "apply",
      prompt: <p><C>grid = [[0] * 3] * 2</C>, then <C>grid[0][0] = 1</C>. What is <C>sum(map(sum, grid))</C>?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "fix",
      rung: "prove",
      prompt: (
        <p>
          Explain exactly why the <C>add</C> function above keeps growing the same list, and rewrite it so that each call
          without a bucket gets a fresh one. Why is <C>None</C> a safe default when <C>[]</C> is not?
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains that the default expression is evaluated once, when def runs, creating one list stored with the function.",
          "Notes every call without a bucket binds the parameter to that same mutable list, so appends accumulate.",
          "Rewrites with bucket=None and, inside, if bucket is None: bucket = [].",
          "Explains None is immutable, so sharing it between calls can never leak state.",
        ],
      },
    },
    {
      key: "tuple",
      rung: "stretch",
      prompt: <p><C>a = (1, [2])</C>, then <C>a[1].append(3)</C>. Tuples are immutable, yet this runs. What is <C>len(a[1])</C>?</p>,
      answer: { kind: "numeric", value: 2 },
    },
  ],

  teachBack:
    "Explain to a friend why b = a does not copy a list, the difference between is and ==, and why mutable default arguments are a trap.",

  glimpse: (
    <p>
      Next, functions as objects: closures and decorators. NumPy&rsquo;s views, later in this course, are the same aliasing idea
      applied to arrays of numbers, with the same surprises.
    </p>
  ),
};
