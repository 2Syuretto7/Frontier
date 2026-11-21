import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { IrLevelsViz } from "@/components/viz/IrLevelsViz";
import type { LessonContent } from "@/lib/types";

const GRAPH = `def users(ir):
    out = {n: [] for n in ir}
    for n, (op, ins) in ir.items():
        for i in ins:
            out[i].append(n)                               # n reads i
    return out

def dce(ir, outputs):
    live, stack = set(), list(outputs)
    while stack:
        n = stack.pop()
        if n not in live:
            live.add(n)
            stack.extend(ir[n][1])                         # whatever an output depends on stays
    return {n: v for n, v in ir.items() if n in live}

def topo_order(ir):
    indeg = {n: len(ins) for n, (op, ins) in ir.items()}
    us, order = users(ir), []
    ready = sorted(n for n, d in indeg.items() if d == 0)
    while ready:
        n = ready.pop(0)
        order.append(n)
        for u in us[n]:
            indeg[u] -= 1
            if indeg[u] == 0:
                ready.append(u)
                ready.sort()                               # ties broken by name
    return order`;

const LOWER = `def lower_elementwise(op, out, a, b, shape):
    sym = {"add": "+", "mul": "*"}[op]
    lines = [" " * 4 * d + f"for i{d} in range({s}):" for d, s in enumerate(shape)]
    idx = "".join(f"[i{d}]" for d in range(len(shape)))
    lines.append(" " * 4 * len(shape) + f"{out}{idx} = {a}{idx} {sym} {b}{idx}")
    return lines

def lower_matmul(m, n, k):
    return [f"for i in range({m}):",
            f"    for j in range({n}):",
            "        acc = 0",
            f"        for p in range({k}):",
            "            acc += A[i][p] * B[p][j]",
            "        C[i][j] = acc"]

def execute(lines, env):
    exec("\\n".join(lines), env)                            # run the generated loop nest
    return env`;

export const lesson: LessonContent = {
  id: "e14.1.2",
  minutes: 45,
  links: {
    requires: ["e14.1.1"],
    revisits: ["e5.1.2", "e5.5.1"],
    foreshadows: ["e14.1.3", "e14.4.3"],
  },

  puzzle: (
    <>
      <p>
        To fuse a bias and an activation into a matrix multiplication, a compiler needs to know that a node is a
        matrix multiplication. To tile that multiplication for shared memory, it needs to see its loops. To use the
        tensor cores, it needs to see individual instructions. No single representation shows all three. How do
        compilers resolve this, and what is lost each time they move from one representation to the next?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A compiler holds the program in an intermediate representation (IR) and transforms it in steps. ML compilers
        use a ladder of IRs: a graph of tensor operations at the top, loop nests or tiles in the middle, and machine
        instructions at the bottom. Each optimisation is done at the level where it is easiest to state, and the program
        is then lowered one rung. Lowering is easy; going back up, recognising a loop nest as a matrix multiplication,
        is hard, so decisions that need the big picture are made early.
      </p>
      <IrLevelsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a graph IR">
        <p>
          A graph IR maps each value&apos;s name to the operation that produces it and the names of its inputs, with
          shapes and types alongside. Passes need the reverse map from each value to the operations that read it{" "}
          (<C>users</C>); dead-code elimination keeps only values that some output depends on (<C>dce</C>); and most
          passes visit nodes in a topological order, in which every node comes after its inputs (<C>topo_order</C>).
        </p>
        <Code>{GRAPH}</Code>
      </Definition>

      <Theorem title="topological order exists exactly for acyclic graphs">
        <p>
          Kahn&apos;s algorithm, which repeatedly emits a node with no unemitted inputs, emits every node of a directed
          graph, each once and after all of its inputs, if and only if the graph has no cycle.
        </p>
      </Theorem>
      <Proof>
        <p>
          A node is emitted only when its count of unemitted inputs reaches zero, so it follows all its inputs, and it
          is emitted at most once because it enters the ready list once. If the graph is acyclic, then whenever some
          nodes remain unemitted, one of them has no unemitted input: otherwise following unemitted inputs backwards
          from any remaining node would never stop among finitely many nodes, and would revisit a node, giving a cycle.
          So the algorithm continues until all nodes are emitted. Conversely, no node on a cycle can be emitted first
          among its cycle, since its predecessor on the cycle is unemitted, so a cyclic graph leaves nodes behind.
          Dataflow graphs of a traced program are acyclic by construction, since each node refers only to earlier ones.
        </p>
      </Proof>

      <Example title="a ladder of IRs">
        <p>
          XLA lowers its graph IR, HLO, to loop-level code and then to LLVM IR; TorchInductor turns FX graphs into its
          own loop-level IR and generates Triton or C++; TVM moves from a graph IR to a tensor-level IR of loop nests.
          Lowering one operation means emitting a loop nest that computes it, which can then be run (<C>lower_elementwise</C>,{" "}
          <C>lower_matmul</C>, <C>execute</C>). Here the loop nests are Python source; real compilers emit code for the
          target.
        </p>
        <Code>{LOWER}</Code>
      </Example>

      <Remark title="what each level is for">
        <p>
          At the graph level, an operation is one node, so fusion, layout choices, memory planning and sharding are
          stated over a few hundred nodes. At the loop level, the same program is thousands of loops, but tiling, the
          order of loops and vectorisation become expressible. Machine-level IRs handle registers and instruction
          selection. MLIR, the subject of e14.4.3, makes the ladder itself a framework: each level is a dialect, and
          one program may mix several while it is being lowered.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "macs",
      rung: "check",
      prompt: (
        <p>
          A graph IR has one node computing the attention scores <C>Q @ K.T</C> for 16 heads, sequence length 1024 and
          head dimension 64. Lowered to a loop nest per head, how many times does its innermost multiply-add run in
          total?
        </p>
      ),
      answer: { kind: "numeric", value: 1073741824, tolerance: 0 },
    },
    {
      key: "live",
      rung: "check",
      prompt: (
        <p>
          A graph has x and w as inputs, then a = matmul(x, w), b = relu(a), c = exp(a), d = add(b, x) and e = mul(c, c).
          The only output is d. How many nodes, inputs included, survive dead-code elimination?
        </p>
      ),
      answer: { kind: "numeric", value: 5, tolerance: 0 },
    },
    {
      key: "level",
      rung: "apply",
      prompt: <p>Why do compilers decide operator fusion on the graph IR rather than on lowered loop nests?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each operation is a single node there, so whether two operations can share a kernel is a question about a few nodes rather than about many loops",
          "Loop nests cannot be fused",
          "The graph IR is closer to the hardware",
          "Lowered code no longer computes the same function",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def users(ir):
    out = {n: [] for n in ir}
    for n, (op, ins) in ir.items():
        for i in ins:
            out[i].append(n)                               # n reads i
    return out

def dce(ir, outputs):
    live, stack = set(), list(outputs)
    while stack:
        n = stack.pop()
        if n not in live:
            live.add(n)
            stack.extend(ir[n][1])                         # whatever an output depends on stays
    return {n: v for n, v in ir.items() if n in live}

def topo_order(ir):
    indeg = {n: len(ins) for n, (op, ins) in ir.items()}
    us, order = users(ir), []
    ready = sorted(n for n, d in indeg.items() if d == 0)
    while ready:
        n = ready.pop(0)
        order.append(n)
        for u in us[n]:
            indeg[u] -= 1
            if indeg[u] == 0:
                ready.append(u)
                ready.sort()                               # ties broken by name
    return order

ir = {"x": ("input", []), "y": ("input", []), "t": ("mul", ["x", "y"]), "u": ("add", ["t", "x"]), "dead": ("exp", ["y"])}
print(users(ir)["x"], sorted(dce(ir, ["u"])), topo_order(ir))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['t', 'u'] ['t', 'u', 'x', 'y'] ['x', 'y', 'dead', 't', 'u']",
          "['t', 'u'] ['dead', 't', 'u', 'x', 'y'] ['x', 'y', 'dead', 't', 'u']",
          "['t', 'u'] ['t', 'u', 'x', 'y'] ['x', 'y', 't', 'u', 'dead']",
          "['u', 't'] ['t', 'u', 'x', 'y'] ['x', 'y', 'dead', 't', 'u']",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def lower_elementwise(op, out, a, b, shape):
    sym = {"add": "+", "mul": "*"}[op]
    lines = [" " * 4 * d + f"for i{d} in range({s}):" for d, s in enumerate(shape)]
    idx = "".join(f"[i{d}]" for d in range(len(shape)))
    lines.append(" " * 4 * len(shape) + f"{out}{idx} = {a}{idx} {sym} {b}{idx}")
    return lines

def lower_matmul(m, n, k):
    return [f"for i in range({m}):",
            f"    for j in range({n}):",
            "        acc = 0",
            f"        for p in range({k}):",
            "            acc += A[i][p] * B[p][j]",
            "        C[i][j] = acc"]

def execute(lines, env):
    exec("\\n".join(lines), env)                            # run the generated loop nest
    return env

print(lower_elementwise("mul", "z", "x", "y", (2, 3))[-1].strip(), len(lower_matmul(4, 4, 4)))
env = execute(lower_matmul(2, 2, 1), {"A": [[1], [2]], "B": [[3, 4]], "C": [[0, 0], [0, 0]]}); print(env["C"])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "z[i0][i1] = x[i0][i1] * y[i0][i1] 6\n[[3, 4], [6, 8]]",
          "z[i0][i1] = x[i0][i1] * y[i0][i1] 4\n[[3, 4], [6, 8]]",
          "z[i0][i1] = x[i0][i1] * y[i0][i1] 6\n[[3, 6], [4, 8]]",
          "z[i1][i0] = x[i1][i0] * y[i1][i0] 6\n[[3, 4], [6, 8]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>users(ir)</C>, listing for every node the nodes that read it, once per use; <C>dce(ir, outputs)</C>;
          and <C>topo_order(ir)</C>, Kahn&apos;s algorithm taking the alphabetically first ready node each time.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def users(ir):
    return {}

def dce(ir, outputs):
    return ir

def topo_order(ir):
    return list(ir)
`,
        solution: GRAPH,
        tests: [
          { name: "users", code: `assert users({"b": ("input", []), "a": ("input", []), "s": ("mul", ["a", "a"]), "t": ("add", ["s", "b"])}) == {"b": ["t"], "a": ["s", "s"], "s": ["t"], "t": []}` },
          { name: "dce_topo", code: `ir = {"b": ("input", []), "a": ("input", []), "s": ("mul", ["a", "a"]), "t": ("add", ["s", "b"]), "z": ("neg", ["b"])}; assert sorted(dce(ir, ["t"])) == ["a", "b", "s", "t"] and topo_order(ir) == ["a", "b", "s", "t", "z"] and topo_order({}) == []` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lower_elementwise(op, out, a, b, shape)</C>, one loop per dimension indented by four spaces per
          level, named i0, i1 and so on, around a statement indexing each array as <C>x[i0][i1]</C>;{" "}
          <C>lower_matmul(m, n, k)</C>, the six lines shown in the lesson; and <C>execute(lines, env)</C>, which runs the
          lines in env and returns it.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def lower_elementwise(op, out, a, b, shape):
    return []

def lower_matmul(m, n, k):
    return []

def execute(lines, env):
    return env
`,
        solution: LOWER,
        tests: [
          { name: "lower", code: `assert lower_elementwise("add", "o", "p", "q", (4,)) == ["for i0 in range(4):", "    o[i0] = p[i0] + q[i0]"] and lower_elementwise("add", "o", "p", "q", ()) == ["o = p + q"]` },
          { name: "exec", code: `assert execute(lower_elementwise("add", "o", "p", "q", (2, 2)), {"p": [[1, 2], [3, 4]], "q": [[10, 20], [30, 40]], "o": [[0, 0], [0, 0]]})["o"] == [[11, 22], [33, 44]] and execute(lower_matmul(1, 1, 3), {"A": [[1, 2, 3]], "B": [[4], [5], [6]], "C": [[0]]})["C"] == [[32]]` },
        ],
      },
    },
    {
      key: "orders",
      rung: "stretch",
      prompt: (
        <p>
          For the graph in the second check, before dead-code elimination, how many different orders of all seven nodes
          are topological orders?
        </p>
      ),
      answer: { kind: "numeric", value: 12, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every value in these graphs is assigned exactly once. The next lesson makes that property the definition of an
        IR, and shows what it buys when the program has loops and branches.
      </p>
    </>
  ),
};
