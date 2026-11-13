import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AutodiffGraphViz } from "@/components/viz/AutodiffGraphViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.3.1",
  minutes: 50,
  links: {
    requires: ["m5.2.5", "m4.3.4"],
    revisits: ["e2.6.2"],
    foreshadows: ["m5.3.2", "m5.3.3", "e5.1.1"],
  },

  puzzle: (
    <>
      <p>
        A computer cannot differentiate &ldquo;a function&rdquo;. It can only run a program: a finite list of additions,
        multiplications, sines and exponentials, each feeding later ones.
      </p>
      <p>What is the right picture of such a program, so that the chain rule can be applied to it mechanically?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Draw each elementary operation as a node and each use of a value as an edge. The result is a directed acyclic graph: a
        computational graph. Evaluating the function means visiting the nodes so that every node comes after its inputs.
      </p>
      <AutodiffGraphViz mode="eval" />
      <p>
        Notice that x feeds two nodes and y feeds two. A graph lets a value be computed once and used many times, which an
        expression written out as a tree cannot do. The next two lessons push derivatives through this same graph, forwards and
        backwards.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="computational graph">
        <p>
          A computational graph for <M>{"f : \\mathbb R^n \\to \\mathbb R^m"}</M> is a finite directed acyclic graph whose
          nodes are variables <M>{"v_1, \\dots, v_N"}</M>. The first n are the inputs. Each other node is{" "}
          <M>{"v_i = \\phi_i(v_{j} : j \\in \\mathrm{pa}(i))"}</M>, an elementary function of its parents, and some nodes are
          marked as outputs.
        </p>
        <p>
          A <em>topological order</em> lists the nodes so that every parent comes before its children. Evaluating in such an
          order is called the forward pass. Written as a list of (name, operation, arguments) in that order, the graph is a{" "}
          <em>tape</em> or Wengert list.
        </p>
      </Definition>

      <Theorem title="evaluation is well defined">
        <p>
          A directed graph has a topological order if and only if it has no directed cycle. Every topological order of a
          computational graph gives the same value at every node.
        </p>
      </Theorem>
      <Proof>
        <p>
          If there is a cycle, its first node in any proposed order has a parent on the cycle listed later, so no order works.
          If there is no cycle, some node has no parents (otherwise walking backwards through parents forever would repeat a
          node in a finite graph and give a cycle); list it first, delete it, and repeat. For the second claim, induct along any
          order: a node's value is <M>{"\\phi_i"}</M> of its parents' values, which by induction do not depend on the order.
        </p>
      </Proof>

      <Example title="a tape">
        <p>The function in the picture, <M>{"f(x, y) = (xy + \\sin x)\\,y"}</M>, is the tape</p>
        <Code>{`a = mul(x, y)
b = sin(x)
c = add(a, b)
f = mul(c, y)`}</Code>
        <p>
          Each line is one elementary operation whose derivative we know. The chain rule for the whole program will be assembled
          from these local derivatives.
        </p>
      </Example>

      <Remark title="trees versus graphs">
        <p>
          Writing <M>{"f_k = f_{k-1} \\cdot f_{k-1}"}</M> with <M>{"f_0 = x"}</M> as a tree duplicates the subexpression at every
          level, so the tree for <M>{"f_k = x^{2^k}"}</M> has <M>{"2^k - 1"}</M> multiplications. The graph has k. Sharing is
          also why symbolic differentiation of large expressions can blow up while automatic differentiation on the graph does
          not.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "count",
      rung: "check",
      prompt: (
        <p>
          How many nodes, including the two inputs, does the computational graph of <M>{"f(x, y) = (x + y)(x - y)"}</M> have,
          with one node per input and one per operation?
        </p>
      ),
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "order",
      rung: "check",
      prompt: (
        <p>
          For the tape a = mul(x, y), b = sin(x), c = add(a, b), f = mul(c, y), which order of the non-input nodes is also a
          valid topological order?
        </p>
      ),
      answer: { kind: "choice", options: ["b, a, c, f", "a, c, b, f", "c, a, b, f", "a, b, f, c"], correct: [0] },
    },
    {
      key: "eval",
      rung: "apply",
      prompt: <p>Evaluate the tape above at x = 0, y = 3.</p>,
      answer: { kind: "numeric", value: 0, tolerance: 1e-12 },
    },
    {
      key: "share",
      rung: "apply",
      prompt: (
        <p>
          <M>{"f(x) = \\sin^2 x + \\sin x"}</M>. How many operation nodes (not counting the input) does a graph need if{" "}
          <M>{"\\sin x"}</M> is computed once and squaring is one multiplication?
        </p>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
OPS = {"add": lambda a, b: a + b, "mul": lambda a, b: a * b, "sin": math.sin}
tape = [("a", "mul", ["x", "y"]), ("b", "add", ["a", "x"]), ("f", "mul", ["b", "b"])]
vals = {"x": 2.0, "y": 3.0}
for name, op, args in tape:
    vals[name] = OPS[op](*[vals[a] for a in args])
print(vals["a"], vals["b"], vals["f"])`}</Code>
          <p>Running a tape. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["6.0 8.0 64.0", "6.0 8.0 16.0", "5.0 7.0 49.0", "6.0 6.0 36.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`deps = {"x": [], "y": [], "a": ["x", "y"], "b": ["x"], "c": ["a", "b"], "f": ["c", "y"]}
done, order = set(), []
while len(order) < len(deps):
    ready = sorted(n for n in deps if n not in done and all(p in done for p in deps[n]))
    order.append(ready[0])
    done.add(ready[0])
print(" ".join(order))`}</Code>
          <p>A topological sort that always takes the alphabetically first ready node. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["x b y a c f", "x y a b c f", "a b c f x y", "x y b a c f"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>run_tape(tape, inputs)</C>. inputs is a dict from input names to numbers. tape is a list of{" "}
          <C>(name, op, args)</C> in topological order, with op one of <C>&quot;add&quot;</C>, <C>&quot;mul&quot;</C>,{" "}
          <C>&quot;sin&quot;</C>, <C>&quot;exp&quot;</C> and args a list of earlier names. Return a new dict of every value,
          inputs included, without changing inputs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def run_tape(tape, inputs):
    return dict(inputs)
`,
        solution: `import math

OPS = {"add": lambda a, b: a + b, "mul": lambda a, b: a * b, "sin": math.sin, "exp": math.exp}

def run_tape(tape, inputs):
    vals = dict(inputs)
    for name, op, args in tape:
        vals[name] = OPS[op](*[vals[a] for a in args])
    return vals
`,
        tests: [
          { name: "the lesson's function", code: `import math
tape = [("a", "mul", ["x", "y"]), ("b", "sin", ["x"]), ("c", "add", ["a", "b"]), ("f", "mul", ["c", "y"])]
inp = {"x": 1.0, "y": 2.0}
v = run_tape(tape, inp)
assert abs(v["f"] - (2 + math.sin(1)) * 2) < 1e-12 and v["a"] == 2.0
assert inp == {"x": 1.0, "y": 2.0}, 'Do not change the inputs dict.'` },
          { name: "exp and reuse", code: `import math
tape = [("s", "exp", ["x"]), ("q", "mul", ["s", "s"]), ("f", "add", ["q", "s"])]
v = run_tape(tape, {"x": 0.5})
assert abs(v["f"] - (math.exp(1) + math.exp(0.5))) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>topo_order(deps)</C>, where deps maps each node to the list of its parents. Return a topological order as a
          list, choosing the alphabetically smallest ready node at each step. If no node is ready but some remain, the graph has
          a cycle: raise <C>ValueError</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def topo_order(deps):
    return sorted(deps)
`,
        solution: `def topo_order(deps):
    done, order = set(), []
    while len(order) < len(deps):
        ready = sorted(n for n in deps if n not in done and all(p in done for p in deps[n]))
        if not ready:
            raise ValueError("cycle")
        order.append(ready[0])
        done.add(ready[0])
    return order
`,
        tests: [
          { name: "order", code: `deps = {"x": [], "y": [], "a": ["x", "y"], "b": ["x"], "c": ["a", "b"], "f": ["c", "y"]}
assert topo_order(deps) == ["x", "b", "y", "a", "c", "f"], topo_order(deps)
assert topo_order({"z": [], "a": ["z"]}) == ["z", "a"], 'Parents come first, whatever their names.'` },
          { name: "cycle", code: `try:
    topo_order({"a": ["b"], "b": ["a"], "c": []})
    assert False, 'A cycle must raise ValueError.'
except ValueError:
    pass` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let <M>{"f_0 = x"}</M> and <M>{"f_k = f_{k-1} \\cdot f_{k-1}"}</M>. Prove that the expression tree for{" "}
          <M>{"f_k"}</M>, in which each use of <M>{"f_{k-1}"}</M> is a separate copy, has <M>{"2^k - 1"}</M> multiplication
          nodes, while a computational graph needs only k.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Sets up the recurrence T(k) = 2T(k − 1) + 1 with T(0) = 0 for the tree, because f_k's tree is one multiplication with two copies of f_{k−1}'s tree.",
          "Solves it by induction: 2(2^{k−1} − 1) + 1 = 2^k − 1.",
          "For the graph, notes each f_j is computed once from the single node f_{j−1}, giving k multiplications.",
        ],
      },
    },
    {
      key: "tree",
      rung: "stretch",
      prompt: <p>How many multiplication nodes are in the expression tree for <M>{"f_{10}"}</M> in the exercise above?</p>,
      answer: { kind: "numeric", value: 1023 },
    },
  ],

  teachBack:
    "Explain to a friend what a computational graph is, why it must be acyclic, and why a graph can be much smaller than the expression tree of the same function.",

  glimpse: (
    <p>
      Each node has a local derivative we know. Carrying a derivative alongside each value as the forward pass runs is
      forward-mode differentiation: next.
    </p>
  ),
};
