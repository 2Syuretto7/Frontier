import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AutodiffGraphViz } from "@/components/viz/AutodiffGraphViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.3.3",
  minutes: 60,
  links: {
    requires: ["m5.3.2"],
    revisits: ["m5.2.5"],
    foreshadows: ["m5.3.4", "m5.3.5", "e5.1.2", "l3.2.2"],
  },

  puzzle: (
    <>
      <p>
        A network&rsquo;s loss depends on ten million parameters. Forward mode would need ten million sweeps to get the
        gradient. Yet frameworks get the whole gradient in about the time of two or three evaluations of the loss.
      </p>
      <p>What do they compute instead, and in which direction do they walk the graph?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Instead of asking &ldquo;how does every node change when this one input moves?&rdquo;, ask &ldquo;how much does the
        output change when this node moves?&rdquo; That number is the node&rsquo;s adjoint. The output&rsquo;s adjoint is 1, and
        each node&rsquo;s adjoint follows from the adjoints of the nodes that use it.
      </p>
      <AutodiffGraphViz mode="reverse" />
      <p>
        One backward sweep gives the adjoint of every input, so the whole gradient, however many inputs there are. The price is
        that the backward pass needs the values from the forward pass, so they must be stored.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="adjoint, and reverse mode">
        <p>
          For a graph with a single scalar output f, the adjoint of node j is <M>{"\\bar v_j = \\partial f / \\partial v_j"}</M>,
          the sensitivity of f to <M>{"v_j"}</M> with everything upstream of it held fixed. Reverse mode first runs the forward
          pass and stores every value, sets <M>{"\\bar f = 1"}</M>, and then, in reverse topological order,
        </p>
        <MD>{"\\bar v_j = \\sum_{i \\,:\\, j \\in \\mathrm{pa}(i)} \\bar v_i \\, \\frac{\\partial \\phi_i}{\\partial v_j}."}</MD>
      </Definition>

      <Theorem title="paths and adjoints">
        <p>
          Label each edge <M>{"j \\to i"}</M> with the local partial <M>{"\\partial\\phi_i / \\partial v_j"}</M>. Then the
          derivative of the output with respect to an input is the sum, over all directed paths from the input to the output, of
          the product of the labels along the path. Reverse mode computes exactly this sum, and so does forward mode.
        </p>
      </Theorem>
      <Proof>
        <p>
          The chain rule for one node, <M>{"\\frac{\\partial f}{\\partial v_j} = \\sum_i \\frac{\\partial f}{\\partial v_i}\\frac{\\partial \\phi_i}{\\partial v_j}"}</M>{" "}
          over the children i of j, is the reverse-mode rule. Induct in reverse topological order: if each child&rsquo;s adjoint
          is the sum over paths from that child to the output, then multiplying by the edge label and summing over children
          gives the sum over all paths from j, since every path from j starts with exactly one edge to a child. The forward
          tangent recursion is the same argument read from the other end.
        </p>
      </Proof>

      <Example title="why not enumerate paths">
        <p>
          A graph with ten layers of two nodes, each connected to both nodes of the next layer, has <M>{"2^{10}"}</M> paths from
          input to output but only about forty edges. The adjoint recursion touches each edge once. Summing over paths by brute
          force is exponential; reverse mode is the dynamic programme that shares the common suffixes.
        </p>
      </Example>

      <Remark title="memory is the price">
        <p>
          The local partials <M>{"\\partial \\phi_i / \\partial v_j"}</M> need the forward values: for c = a · b,{" "}
          <M>{"\\bar a \\mathrel{+}= \\bar c\\, b"}</M>. So reverse mode stores the forward pass, its memory grows with the
          length of the computation, and this is the memory that dominates when training large models.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sweeps",
      rung: "check",
      prompt: <p>How many reverse-mode sweeps give the full gradient of a function from <M>{"\\mathbb R^{1000}"}</M> to ℝ?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "fan",
      rung: "check",
      prompt: <p>A node feeds two later nodes. How is its adjoint formed from theirs?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each child's adjoint times the local partial, then summed",
          "The larger of the two contributions",
          "The product of the two contributions",
          "Only the later child counts",
        ],
        correct: [0],
      },
    },
    {
      key: "adjc",
      rung: "apply",
      prompt: (
        <p>
          In the graph of <M>{"f = (xy + \\sin x)\\,y"}</M>, with c = xy + sin x and f = c · y, what is the adjoint of c at
          x = 1, y = 2?
        </p>
      ),
      answer: { kind: "numeric", value: 2, tolerance: 1e-12 },
    },
    {
      key: "adjy",
      rung: "apply",
      prompt: <p>In the same graph at x = 1, y = 2, what is the adjoint of y?</p>,
      answer: { kind: "numeric", value: 4 + Math.sin(1), tolerance: 1e-4 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`tape = [("a", "mul", ["x", "y"]), ("b", "add", ["a", "x"]), ("f", "mul", ["b", "b"])]
val = {"x": 2.0, "y": 3.0}
for n, op, (p, q) in tape:
    val[n] = val[p] * val[q] if op == "mul" else val[p] + val[q]
adj = {k: 0.0 for k in val}
adj["f"] = 1.0
for n, op, (p, q) in reversed(tape):
    if op == "mul":
        adj[p] += adj[n] * val[q]
        adj[q] += adj[n] * val[p]
    else:
        adj[p] += adj[n]
        adj[q] += adj[n]
print(adj["b"], adj["x"], adj["y"])`}</Code>
          <p>Reverse mode over a tape. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["16.0 64.0 32.0", "8.0 32.0 16.0", "16.0 48.0 32.0", "16.0 64.0 16.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`edges = {("x", "u"): 2.0, ("x", "w"): 3.0, ("u", "f"): 5.0, ("w", "f"): 7.0, ("u", "w"): 1.0}
def paths(a, b):
    if a == b:
        return 1.0
    return sum(d * paths(j, b) for (i, j), d in edges.items() if i == a)
print(paths("x", "f"), paths("u", "f"))`}</Code>
          <p>A derivative as a sum over paths. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["45.0 12.0", "31.0 5.0", "45.0 5.0", "38.0 12.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>grad_tape(tape, inputs)</C> for tapes of <C>(name, op, args)</C> with ops <C>&quot;add&quot;</C>,{" "}
          <C>&quot;mul&quot;</C>, <C>&quot;sin&quot;</C> and <C>&quot;exp&quot;</C>, whose last entry is the scalar output. Run
          the forward pass, then the backward pass, and return a dict from each input name to its partial derivative.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def grad_tape(tape, inputs):
    return {k: 0.0 for k in inputs}
`,
        solution: `import math

OPS = {"add": lambda a, b: a + b, "mul": lambda a, b: a * b, "sin": math.sin, "exp": math.exp}

def grad_tape(tape, inputs):
    val = dict(inputs)
    for name, op, args in tape:
        val[name] = OPS[op](*[val[a] for a in args])
    adj = {k: 0.0 for k in val}
    adj[tape[-1][0]] = 1.0
    for name, op, args in reversed(tape):
        g, a = adj[name], args[0]
        if op == "add":
            adj[a] += g
            adj[args[1]] += g
        elif op == "mul":
            adj[a] += g * val[args[1]]
            adj[args[1]] += g * val[a]
        elif op == "sin":
            adj[a] += g * math.cos(val[a])
        else:
            adj[a] += g * val[name]
    return {k: adj[k] for k in inputs}
`,
        tests: [
          { name: "the lesson's graph", code: `import math
tape = [("a", "mul", ["x", "y"]), ("b", "sin", ["x"]), ("c", "add", ["a", "b"]), ("f", "mul", ["c", "y"])]
g = grad_tape(tape, {"x": 1.0, "y": 2.0})
assert set(g) == {"x", "y"}
assert abs(g["x"] - (4 + 2 * math.cos(1))) < 1e-12 and abs(g["y"] - (4 + math.sin(1))) < 1e-12, g` },
          { name: "reuse and squaring", code: `import math
tape = [("s", "exp", ["x"]), ("q", "mul", ["s", "s"]), ("f", "add", ["q", "x"])]
g = grad_tape(tape, {"x": 0.5})
assert abs(g["x"] - (2 * math.exp(1) + 1)) < 1e-12, 'mul(s, s) sends two contributions to s: use +=.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>adjoints(edges, order, out)</C>. edges maps a pair <C>(j, i)</C> to the local partial of node i with respect
          to its parent j; order is a topological order of all nodes; out is the output node. Return a dict giving every
          node&rsquo;s adjoint, computed by the reverse recursion in one pass over the edges per node (no path enumeration).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def adjoints(edges, order, out):
    return {n: 0.0 for n in order}
`,
        solution: `def adjoints(edges, order, out):
    adj = {n: 0.0 for n in order}
    adj[out] = 1.0
    for i in reversed(order):
        for (j, k), d in edges.items():
            if k == i:
                adj[j] += adj[i] * d
    return adj
`,
        tests: [
          { name: "small graph", code: `edges = {("x", "u"): 2.0, ("x", "w"): 3.0, ("u", "f"): 5.0, ("w", "f"): 7.0, ("u", "w"): 1.0}
a = adjoints(edges, ["x", "u", "w", "f"], "f")
assert a == {"x": 45.0, "u": 12.0, "w": 7.0, "f": 1.0}, a` },
          { name: "ten-layer diamond", code: `edges, prev = {}, ["x"]
order = ["x"]
for L in range(10):
    layer = [f"n{L}a", f"n{L}b"]
    for p in prev:
        for q in layer:
            edges[(p, q)] = 1.0
    order += layer
    prev = layer
for p in prev:
    edges[(p, "f")] = 1.0
order.append("f")
a = adjoints(edges, order, "f")
assert a["x"] == 2.0 ** 10, 'With every label 1, the adjoint counts paths: 2 ** 10.'` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that the reverse-mode recursion gives <M>{"\\bar v_j"}</M> equal to the sum, over all directed paths from{" "}
          <M>{"v_j"}</M> to the output, of the product of the edge labels along the path.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Sets up induction in reverse topological order, with base case the output (adjoint 1, one empty path with product 1).",
          "Observes that every path from j to the output begins with exactly one edge j → i to a child i, followed by a path from i.",
          "Uses the induction hypothesis for each child and multiplies by the edge label, then sums over children, matching the recursion.",
        ],
      },
    },
    {
      key: "paths",
      rung: "stretch",
      prompt: (
        <p>
          In a graph with an input x, then 20 layers of 2 nodes each, every node joined to both nodes of the next layer (the
          first layer to x, the last to the output), how many directed paths go from x to the output?
        </p>
      ),
      answer: { kind: "numeric", value: 1048576 },
    },
  ],

  teachBack:
    "Explain to a friend what an adjoint is, how reverse mode computes all of them in one backward sweep, and why it must keep the values from the forward pass.",

  glimpse: (
    <p>
      In matrix language, forward mode multiplies the Jacobian by a vector on the right and reverse mode by a row vector on the
      left. Next, these two products, and how to compute them without ever forming the Jacobian.
    </p>
  ),
};
