import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LayoutSearchViz } from "@/components/viz/LayoutSearchViz";
import type { LessonContent } from "@/lib/types";

const CHAIN = `from itertools import product

def chain_cost(choice, node, edge):
    total = sum(node[l][s] for l, s in enumerate(choice))
    return total + sum(edge[a][b] for a, b in zip(choice, choice[1:]))   # resharding between layers

def brute_chain(node, edge):
    return min(product(range(len(node[0])), repeat=len(node)), key=lambda c: chain_cost(c, node, edge))

def best_chain(node, edge):
    S = range(len(node[0]))
    cost, back = list(node[0]), []
    for l in range(1, len(node)):
        prev = [min(S, key=lambda a: cost[a] + edge[a][b]) for b in S]   # best predecessor of each strategy
        cost = [cost[prev[b]] + edge[prev[b]][b] + node[l][b] for b in S]
        back.append(prev)
    s = min(S, key=lambda b: cost[b])
    best, choice = cost[s], [s]
    for prev in reversed(back):
        s = prev[s]
        choice.append(s)
    return best, tuple(reversed(choice))`;

const MESH = `def meshes(n):
    return [(d, t, n // (d * t)) for d in range(1, n + 1) if n % d == 0
            for t in range(1, n // d + 1) if (n // d) % t == 0]

def step_time(d, t, p, compute, tp_comm, dp_comm, micro):
    bubble = (p - 1) / micro                               # idle fraction of a one-forward-one-backward pipeline
    return compute / (d * t * p) * (1 + bubble) + tp_comm * (t - 1) / t + dp_comm * (d - 1) / d

def best_mesh(n, compute, tp_comm, dp_comm, micro, mem, cap):
    ok = [m for m in meshes(n) if mem / (m[1] * m[2]) <= cap]     # model state is split by tensor and pipeline
    return min(ok, key=lambda m: step_time(*m, compute, tp_comm, dp_comm, micro))`;

export const lesson: LessonContent = {
  id: "e14.5.2",
  minutes: 45,
  links: {
    requires: ["e14.5.1"],
    revisits: ["e10.7.2", "e10.5.3", "e14.3.2"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        Sharding propagation turns a few annotations into a full layout, but the annotations still come from a person
        who knows the tricks: data parallelism here, tensor parallelism inside each block, pipeline stages across nodes.
        For a new architecture or a new cluster that person must start again. The choices form a vast space: every
        layer can be split several ways, and the mesh itself can be factored many ways. Can the compiler search it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Give each layer a few candidate strategies, each with a cost from a model of compute, communication and memory,
        and charge for resharding whenever neighbouring layers disagree. Choosing a strategy per layer then becomes a
        shortest path through a trellis, which dynamic programming solves exactly in time linear in the depth. Above
        that sits a small outer search over how the devices are divided between data, tensor and pipeline parallelism,
        discarding the divisions whose memory does not fit.
      </p>
      <LayoutSearchViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the layer chain">
        <p>
          A network of L layers, each with S candidate strategies, has a node cost <M>{"c_l(s)"}</M> for running layer l
          with strategy s, and an edge cost <M>{"r(a, b)"}</M> for converting the output layout of strategy a into the
          input layout of strategy b, zero when they agree. A plan chooses one strategy per layer, and its cost is the
          sum of its node and edge costs (<C>chain_cost</C>). Trying all <M>{"S^L"}</M> plans (<C>brute_chain</C>) is
          hopeless beyond a few layers.
        </p>
      </Definition>

      <Theorem title="dynamic programming over the chain">
        <p>
          Let <M>{"F_1(s) = c_1(s)"}</M> and <M>{"F_l(b) = c_l(b) + \\min_a \\left(F_{l-1}(a) + r(a, b)\\right)"}</M>. Then{" "}
          <M>{"\\min_s F_L(s)"}</M> is the cost of the cheapest plan, and following the minimising a back from the last
          layer recovers it (<C>best_chain</C>), using <M>{"(L-1)S^2"}</M> evaluations of the bracket.
        </p>
        <Code>{CHAIN}</Code>
      </Theorem>
      <Proof>
        <p>
          By induction, <M>{"F_l(b)"}</M> is the cheapest cost of a plan for layers 1 to l that ends in strategy b. It
          holds for l = 1. A plan for the first l layers ending in b consists of a plan for the first l − 1 layers ending
          in some a, the edge from a to b and the node cost of b. The cost of the prefix enters only through its total,
          so the cheapest prefix ending in a is best for each a, which by induction costs <M>{"F_{l-1}(a)"}</M>; taking
          the best a gives the formula. Each of the L − 1 steps examines S predecessors for each of S strategies.
        </p>
      </Proof>

      <Definition title="the mesh search">
        <p>
          Above the per-layer choice is the division of n devices into data, tensor and pipeline degrees d · t · p = n{" "}
          (<C>meshes</C>). A simple cost model charges the compute time divided by n, inflated by the pipeline bubble{" "}
          <M>{"(p-1)/m"}</M> for m micro-batches as in e10.5.3, plus tensor-parallel communication growing like{" "}
          <M>{"(t-1)/t"}</M> and gradient all-reduce like <M>{"(d-1)/d"}</M> (<C>step_time</C>). Model state is split by
          tensor and pipeline parallelism, so a mesh is feasible only if that share fits in device memory. The search
          returns the fastest feasible mesh (<C>best_mesh</C>), much as an engineer does by hand in e10.7.2.
        </p>
        <Code>{MESH}</Code>
      </Definition>

      <Example title="automatic parallelisers">
        <p>
          Alpa splits the problem in two levels like this lesson: an integer linear program chooses the sharding of
          every operator within a stage, with resharding costs on edges, and dynamic programming chooses how to cut the
          layers into pipeline stages and assign each stage a submesh. XLA&apos;s auto-sharding pass solves a similar
          integer program over GSPMD shardings. FlexFlow searched a space of operator, sample and parameter splits with
          a simulator as its cost model. Each is only as good as its cost model, so the best tools calibrate it with
          measurements, as in e14.3.2.
        </p>
      </Example>

      <Remark title="where the chain assumption breaks">
        <p>
          A real model is a graph, not a chain: residual connections and attention branches let a value feed several
          later layers. Dynamic programming over a chain no longer suffices, and the general problem of choosing
          strategies on a graph with pairwise costs is NP-hard, which is why Alpa and XLA use integer programming with
          a solver and simplify the graph first, merging operators that obviously share a strategy. Since transformer
          blocks repeat, searching one block and repeating its plan is often enough. That closes the course: a compiler
          that captures a program, optimises it, generates and tunes its kernels and, finally, decides how to spread it
          across a cluster.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "evals",
      rung: "check",
      prompt: (
        <p>
          A model has 48 layers, each with 4 candidate strategies. How many evaluations of the bracket does the dynamic
          program of this lesson make?
        </p>
      ),
      answer: { kind: "numeric", value: 752, tolerance: 0 },
    },
    {
      key: "mesh",
      rung: "check",
      prompt: (
        <p>
          With the cost model of this lesson, 64 devices, compute 6400 s, tensor communication 80 s, data communication
          16 s and 16 micro-batches, model state of 640 GB and 80 GB per device, what is the step time in seconds of the
          fastest feasible mesh?
        </p>
      ),
      answer: { kind: "numeric", value: 157.75, tolerance: 0.001 },
    },
    {
      key: "greedy",
      rung: "apply",
      prompt: <p>Why can choosing each layer&apos;s cheapest strategy independently give a worse plan?</p>,
      answer: {
        kind: "choice",
        options: [
          "It ignores resharding costs, so it may switch layouts between layers more often than they are worth",
          "It picks strategies that do not fit in memory",
          "Layer costs depend on the number of layers",
          "It never changes strategy between layers",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import product

def chain_cost(choice, node, edge):
    total = sum(node[l][s] for l, s in enumerate(choice))
    return total + sum(edge[a][b] for a, b in zip(choice, choice[1:]))   # resharding between layers

def brute_chain(node, edge):
    return min(product(range(len(node[0])), repeat=len(node)), key=lambda c: chain_cost(c, node, edge))

def best_chain(node, edge):
    S = range(len(node[0]))
    cost, back = list(node[0]), []
    for l in range(1, len(node)):
        prev = [min(S, key=lambda a: cost[a] + edge[a][b]) for b in S]   # best predecessor of each strategy
        cost = [cost[prev[b]] + edge[prev[b]][b] + node[l][b] for b in S]
        back.append(prev)
    s = min(S, key=lambda b: cost[b])
    best, choice = cost[s], [s]
    for prev in reversed(back):
        s = prev[s]
        choice.append(s)
    return best, tuple(reversed(choice))

node = [[1, 5], [6, 2], [1, 4]]; edge = [[0, 3], [3, 0]]; print(chain_cost((0, 1, 0), node, edge), brute_chain(node, edge))
print(best_chain(node, edge), best_chain(node, [[0, 1], [1, 0]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "10 (0, 0, 0)\n(8, (0, 0, 0)) (6, (0, 1, 0))",
          "10 (0, 1, 0)\n(8, (0, 0, 0)) (6, (0, 1, 0))",
          "7 (0, 0, 0)\n(8, (0, 0, 0)) (6, (0, 1, 0))",
          "10 (0, 0, 0)\n(8, (0, 0, 0)) (8, (0, 0, 0))",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def meshes(n):
    return [(d, t, n // (d * t)) for d in range(1, n + 1) if n % d == 0
            for t in range(1, n // d + 1) if (n // d) % t == 0]

def step_time(d, t, p, compute, tp_comm, dp_comm, micro):
    bubble = (p - 1) / micro                               # idle fraction of a one-forward-one-backward pipeline
    return compute / (d * t * p) * (1 + bubble) + tp_comm * (t - 1) / t + dp_comm * (d - 1) / d

def best_mesh(n, compute, tp_comm, dp_comm, micro, mem, cap):
    ok = [m for m in meshes(n) if mem / (m[1] * m[2]) <= cap]     # model state is split by tensor and pipeline
    return min(ok, key=lambda m: step_time(*m, compute, tp_comm, dp_comm, micro))

print(meshes(4), step_time(2, 1, 2, 80, 6, 4, 4))
print(best_mesh(4, 80, 6, 4, 4, 100, 60), best_mesh(4, 80, 6, 4, 4, 100, 200))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(1, 1, 4), (1, 2, 2), (1, 4, 1), (2, 1, 2), (2, 2, 1), (4, 1, 1)] 27.0\n(1, 4, 1) (4, 1, 1)",
          "[(1, 1, 4), (1, 2, 2), (1, 4, 1), (2, 1, 2), (2, 2, 1), (4, 1, 1)] 32.0\n(1, 4, 1) (4, 1, 1)",
          "[(1, 1, 4), (1, 4, 1), (4, 1, 1)] 27.0\n(1, 4, 1) (4, 1, 1)",
          "[(1, 1, 4), (1, 2, 2), (1, 4, 1), (2, 1, 2), (2, 2, 1), (4, 1, 1)] 27.0\n(1, 2, 2) (1, 4, 1)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>chain_cost(choice, node, edge)</C>; <C>brute_chain(node, edge)</C>, the first cheapest plan in the order
          of <C>itertools.product</C>; and <C>best_chain(node, edge)</C>, returning the cheapest cost and a cheapest plan
          as a tuple.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from itertools import product

def chain_cost(choice, node, edge):
    return sum(node[l][s] for l, s in enumerate(choice))

def brute_chain(node, edge):
    return tuple(0 for _ in node)

def best_chain(node, edge):
    return 0, ()
`,
        solution: CHAIN,
        tests: [
          { name: "cost", code: `node = [[2, 1], [1, 9], [3, 3]]; edge = [[0, 5], [2, 0]]; assert chain_cost((1, 0, 0), node, edge) == 7 and brute_chain(node, edge) == (0, 0, 0)` },
          { name: "dp", code: `node = [[2, 1], [1, 9], [3, 3]]; edge = [[0, 5], [2, 0]]; assert best_chain(node, edge) == (6, (0, 0, 0)) and best_chain([[4, 2, 9]], [[0] * 3] * 3) == (2, (1,))` },
          { name: "agree", code: `import random; random.seed(3); node = [[random.randint(0, 9) for _ in range(3)] for _ in range(5)]; edge = [[0 if a == b else random.randint(1, 6) for b in range(3)] for a in range(3)]; c, p = best_chain(node, edge); assert c == chain_cost(p, node, edge) == chain_cost(brute_chain(node, edge), node, edge)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>meshes(n)</C>, all (d, t, p) with product n in increasing order of d and then t;{" "}
          <C>step_time(d, t, p, compute, tp_comm, dp_comm, micro)</C>; and{" "}
          <C>best_mesh(n, compute, tp_comm, dp_comm, micro, mem, cap)</C>, the first fastest feasible mesh.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def meshes(n):
    return [(n, 1, 1)]

def step_time(d, t, p, compute, tp_comm, dp_comm, micro):
    return compute / (d * t * p)

def best_mesh(n, compute, tp_comm, dp_comm, micro, mem, cap):
    return (n, 1, 1)
`,
        solution: MESH,
        tests: [
          { name: "meshes", code: `assert meshes(1) == [(1, 1, 1)] and len(meshes(8)) == 10 and meshes(3) == [(1, 1, 3), (1, 3, 1), (3, 1, 1)]` },
          { name: "time", code: `assert step_time(1, 1, 3, 30, 5, 5, 2) == 20 and step_time(3, 1, 1, 30, 5, 6, 2) == 14 and best_mesh(3, 30, 5, 6, 2, 9, 3) == (1, 3, 1)` },
        ],
      },
    },
    {
      key: "plan",
      rung: "stretch",
      prompt: (
        <p>
          Four layers each choose between two strategies, with node costs (5, 3), (4, 6), (7, 2) and (3, 8) for the first
          and second strategy, and a resharding cost of 4 whenever neighbouring layers differ. What does the cheapest plan
          cost?
        </p>
      ),
      answer: { kind: "numeric", value: 18, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        This ends the course on ML compilers. The capstone course puts the whole sequence to work by building a frontier
        model in miniature, from data to training to evaluation.
      </p>
    </>
  ),
};
