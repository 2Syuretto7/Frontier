import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PathSumViz } from "@/components/viz/PathSumViz";
import type { LessonContent } from "@/lib/types";

const REV = `def path_gradient(local, src, dst):
    if src == dst:
        return 1.0
    return sum(d * path_gradient(local, v, dst) for (u, v), d in local.items() if u == src)

def reverse_adjoints(order, local, out):
    adj = {v: 0.0 for v in order}
    adj[out] = 1.0
    for v in reversed(order):
        for (u, w), d in local.items():
            if w == v:
                adj[u] += adj[v] * d
    return adj
`;

const FWD = `def forward_tangents(order, local, inp):
    tan = {v: 0.0 for v in order}
    tan[inp] = 1.0
    for v in order:
        for (u, w), d in local.items():
            if w == v:
                tan[v] += tan[u] * d
    return tan

def jacobian_passes(n_in, n_out):
    return ("forward", n_in) if n_in <= n_out else ("reverse", n_out)
`;

export const lesson: LessonContent = {
  id: "l3.2.1",
  minutes: 45,
  links: {
    requires: ["l3.1.4", "m5.3.3"],
    revisits: ["m5.3.1", "m5.3.2"],
    parallels: ["e5.1.2"],
    foreshadows: ["l3.2.2", "l3.2.3"],
  },

  puzzle: (
    <>
      <p>
        A variable x feeds into a computation along several routes that later merge again. Changing x a little changes the
        output through every route at once. How should the effects along the different routes be combined, and in which
        direction should a program walk the graph to compute them cheaply?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Along one route, small changes multiply: if a moves 4 times as fast as x and c moves 6 times as fast as a, then c moves
        24 times as fast as x through a. Different routes add. So a derivative is a sum over paths of products of local
        derivatives. Enumerating paths is exponential, but grouping them by their last steps gives a recurrence that visits
        each edge once.
      </p>
      <PathSumViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the chain rule as a sum over paths">
        <p>
          In a computational graph where each edge <M>{"u \\to v"}</M> carries the local derivative{" "}
          <M>{"\\partial v / \\partial u"}</M>,
        </p>
        <MD>{"\\frac{\\partial L}{\\partial x} = \\sum_{\\text{paths } x = v_0 \\to v_1 \\to \\dots \\to v_k = L} \\ \\prod_{j=1}^{k} \\frac{\\partial v_j}{\\partial v_{j-1}}."}</MD>
      </Theorem>
      <Proof>
        <p>
          By induction on the position of x, from the output backwards. For x = L the only path is empty, with product 1. Otherwise
          the multivariable chain rule gives <M>{"\\partial L/\\partial x = \\sum_{v} (\\partial v/\\partial x)(\\partial L/\\partial v)"}</M>,
          summing over the children v of x. By the induction hypothesis each{" "}
          <M>{"\\partial L/\\partial v"}</M> is the sum over paths from v to L; multiplying by the edge{" "}
          <M>{"x \\to v"}</M> and summing over v gives exactly the sum over paths from x to L, grouped by their first step.
        </p>
      </Proof>

      <Definition title="reverse mode: adjoints">
        <p>
          The <strong>adjoint</strong> <M>{"\\bar v = \\partial L/\\partial v"}</M> satisfies{" "}
          <M>{"\\bar v = \\sum_{w \\text{ child of } v} \\bar w\\, \\partial w/\\partial v"}</M>, with <M>{"\\bar L = 1"}</M>.
          Processing the nodes in reverse topological order computes every adjoint, for every input at once, with one visit
          per edge.
        </p>
        <Code>{REV}</Code>
      </Definition>

      <Definition title="forward mode: tangents">
        <p>
          The <strong>tangent</strong> <M>{"\\dot v = \\partial v/\\partial x"}</M> for one chosen input x satisfies{" "}
          <M>{"\\dot v = \\sum_{u \\text{ parent of } v} \\dot u\\, \\partial v/\\partial u"}</M>. Processing in topological
          order computes the derivative of every node with respect to that one input.
        </p>
        <Code>{FWD}</Code>
      </Definition>

      <Remark title="why training uses reverse mode">
        <p>
          A Jacobian of a function from <M>{"\\mathbb{R}^n"}</M> to <M>{"\\mathbb{R}^m"}</M> needs n forward passes, one per
          input, or m reverse passes, one per output. A loss has millions of inputs, the parameters, and one output, so a single
          reverse pass gives the whole gradient at a cost of a small constant times the forward pass. This is backpropagation.
        </p>
      </Remark>

      <Example title="the graph above">
        <p>
          With x = 2: <M>{"\\bar L = 1"}</M>, <M>{"\\bar c = 1"}</M>, <M>{"\\bar b = a\\,\\bar c = 4"}</M>,{" "}
          <M>{"\\bar a = b\\,\\bar c + \\bar L = 7"}</M>, and{" "}
          <M>{"\\bar x = 2x\\,\\bar a + 3\\,\\bar b = 28 + 12 = 40"}</M>. The three path products 24, 12 and 4 have been regrouped
          into two terms by sharing the common tail through a.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "sum",
      rung: "check",
      prompt: <p>x reaches L along two paths, with local derivatives 2 and 5 on the first, and 3 and −1 on the second. What is ∂L/∂x?</p>,
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "mode",
      rung: "check",
      prompt: <p>A loss depends on 10⁷ parameters. Which mode gives the full gradient in one pass?</p>,
      answer: { kind: "choice", options: ["Reverse mode", "Forward mode", "Both need 10⁷ passes", "Neither: finite differences are required"], correct: [0] },
    },
    {
      key: "paths",
      rung: "apply",
      prompt: <p>A graph has one input, three fully connected hidden layers of width 3, and one output. How many paths run from the input to the output?</p>,
      answer: { kind: "numeric", value: 27 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def path_gradient(local, src, dst):
    if src == dst:
        return 1.0
    return sum(d * path_gradient(local, v, dst) for (u, v), d in local.items() if u == src)

def reverse_adjoints(order, local, out):
    adj = {v: 0.0 for v in order}
    adj[out] = 1.0
    for v in reversed(order):
        for (u, w), d in local.items():
            if w == v:
                adj[u] += adj[v] * d
    return adj

def forward_tangents(order, local, inp):
    tan = {v: 0.0 for v in order}
    tan[inp] = 1.0
    for v in order:
        for (u, w), d in local.items():
            if w == v:
                tan[v] += tan[u] * d
    return tan

def jacobian_passes(n_in, n_out):
    return ("forward", n_in) if n_in <= n_out else ("reverse", n_out)

# x = 2: a = x**2, b = 3*x, c = a*b, L = c + a
x = 2.0
a, b = x ** 2, 3 * x
local = {("x", "a"): 2 * x, ("x", "b"): 3.0, ("a", "c"): b, ("b", "c"): a, ("c", "L"): 1.0, ("a", "L"): 1.0}
order = ["x", "a", "b", "c", "L"]
adj = reverse_adjoints(order, local, "L")
print(path_gradient(local, "x", "L"), adj["x"], adj["a"], forward_tangents(order, local, "x")["L"])`}</Code>
          <p>The graph from the figure, three ways. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["40.0 40.0 7.0 40.0", "40.0 40.0 6.0 40.0", "24.0 40.0 7.0 40.0", "40.0 28.0 7.0 40.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def forward_tangents(order, local, inp):
    tan = {v: 0.0 for v in order}
    tan[inp] = 1.0
    for v in order:
        for (u, w), d in local.items():
            if w == v:
                tan[v] += tan[u] * d
    return tan

def jacobian_passes(n_in, n_out):
    return ("forward", n_in) if n_in <= n_out else ("reverse", n_out)

print(jacobian_passes(1000, 1), jacobian_passes(3, 500), jacobian_passes(10, 10))`}</Code>
          <p>Which mode, and how many passes? What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "('reverse', 1) ('forward', 3) ('forward', 10)",
          "('reverse', 1000) ('forward', 500) ('forward', 10)",
          "('forward', 1) ('reverse', 3) ('reverse', 10)",
          "('reverse', 1) ('forward', 3) ('reverse', 10)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          A graph is a dict <C>local</C> mapping each edge (u, v) to <M>{"\\partial v/\\partial u"}</M>. Write{" "}
          <C>path_gradient(local, src, dst)</C>, the sum over all paths of the products, by recursion; and{" "}
          <C>reverse_adjoints(order, local, out)</C>, which takes the nodes in topological order and returns the dict of
          adjoints of every node.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def path_gradient(local, src, dst):
    return 0.0

def reverse_adjoints(order, local, out):
    return {v: 0.0 for v in order}
`,
        solution: REV,
        tests: [
          { name: "the lesson graph", code: `local = {("x", "a"): 4.0, ("x", "b"): 3.0, ("a", "c"): 6.0, ("b", "c"): 4.0, ("c", "L"): 1.0, ("a", "L"): 1.0}
adj = reverse_adjoints(["x", "a", "b", "c", "L"], local, "L")
assert adj == {"x": 40.0, "a": 7.0, "b": 4.0, "c": 1.0, "L": 1.0}, adj
assert path_gradient(local, "x", "L") == 40.0 and path_gradient(local, "b", "L") == 4.0` },
          { name: "a diamond chain", code: `local = {}
order = ["n0"]
for i in range(6):
    local[(f"n{i}", f"p{i}")] = 2.0
    local[(f"n{i}", f"q{i}")] = 1.0
    local[(f"p{i}", f"n{i+1}")] = 1.0
    local[(f"q{i}", f"n{i+1}")] = 1.0
    order += [f"p{i}", f"q{i}", f"n{i+1}"]
assert path_gradient(local, "n0", "n6") == 3.0 ** 6
assert reverse_adjoints(order, local, "n6")["n0"] == 3.0 ** 6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>forward_tangents(order, local, inp)</C>, returning the derivative of every node with respect to the input{" "}
          <C>inp</C>, and <C>jacobian_passes(n_in, n_out)</C>, returning ("forward", n_in) when n_in ≤ n_out and otherwise
          ("reverse", n_out).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def forward_tangents(order, local, inp):
    return {v: 0.0 for v in order}

def jacobian_passes(n_in, n_out):
    return ("forward", n_in)
`,
        solution: FWD,
        tests: [
          { name: "tangents", code: `local = {("x", "a"): 4.0, ("x", "b"): 3.0, ("a", "c"): 6.0, ("b", "c"): 4.0, ("c", "L"): 1.0, ("a", "L"): 1.0}
t = forward_tangents(["x", "a", "b", "c", "L"], local, "x")
assert t == {"x": 1.0, "a": 4.0, "b": 3.0, "c": 36.0, "L": 40.0}, t
t2 = forward_tangents(["x", "a", "b", "c", "L"], local, "b")
assert t2["x"] == 0.0 and t2["L"] == 4.0` },
          { name: "passes", code: `assert jacobian_passes(10 ** 6, 1) == ("reverse", 1)
assert jacobian_passes(2, 50) == ("forward", 2) and jacobian_passes(7, 7) == ("forward", 7)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that the adjoint recurrence <M>{"\\bar v = \\sum_w \\bar w\\,\\partial w/\\partial v"}</M> over the children w of
          v, with <M>{"\\bar L = 1"}</M>, gives for every node the sum over all paths from it to L of the product of the local
          derivatives.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Sets up induction in reverse topological order, with base case L (one empty path, product 1).",
          "For node v, splits the paths from v to L by their first edge v → w, each giving ∂w/∂v times a path from w to L.",
          "Applies the hypothesis to each child w and sums, matching the recurrence.",
        ],
      },
    },
    {
      key: "cost",
      rung: "stretch",
      prompt: <p>A function maps ℝ³ to ℝ⁵⁰⁰. What is the fewest passes of forward or reverse mode that give its full Jacobian?</p>,
      answer: { kind: "numeric", value: 3 },
    },
  ],

  teachBack:
    "Explain to a friend why a derivative through a graph is a sum over paths of products, how reverse mode avoids enumerating the paths, and why training uses reverse mode.",

  glimpse: (
    <p>
      Next, the same recurrence applied by hand to a small neural network, one number at a time, to see every gradient
      appear.
    </p>
  ),
};
