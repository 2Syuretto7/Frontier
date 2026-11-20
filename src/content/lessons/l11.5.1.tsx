import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AttributionPruneViz } from "@/components/viz/AttributionPruneViz";
import type { LessonContent } from "@/lib/types";

const GRAPH = `def direct_effect(a, dec, enc):
    return a * sum(x * y for x, y in zip(dec, enc))

def path_sum(A):
    n = len(A)
    total = [[0.0] * n for _ in range(n)]
    power = [row[:] for row in A]
    while any(v != 0 for row in power for v in row):
        total = [[t + p for t, p in zip(tr, pr)] for tr, pr in zip(total, power)]
        power = [[sum(power[i][k] * A[k][j] for k in range(n)) for j in range(n)] for i in range(n)]
    return total

def prune(A, target, keep):
    inf = [abs(row[target]) for row in path_sum(A)]
    order = sorted(range(len(A)), key=lambda i: (-inf[i], i))
    total, acc, kept = sum(inf), 0.0, []
    for i in order:
        if acc >= keep * total - 1e-12:
            break
        kept.append(i)
        acc += inf[i]
    return sorted(kept)`;

const CHECKS = `def replacement_score(influence, is_error):
    total = sum(abs(v) for v in influence)
    return sum(abs(v) for v, e in zip(influence, is_error) if not e) / total

def attribution(grad, act):
    return [g * a for g, a in zip(grad, act)]

def intervention_effect(f, x, i, scale):
    y = list(x)
    y[i] *= scale
    return f(y) - f(x)`;

export const lesson: LessonContent = {
  id: "l11.5.1",
  minutes: 55,
  links: {
    requires: ["l11.4.2", "l11.2.4"],
    revisits: ["l11.1.4", "l11.2.1"],
    foreshadows: ["l11.5.2"],
  },

  puzzle: (
    <>
      <p>
        Asked for the capital of the state that contains Dallas, a model answers Austin. Did it work out Texas on the way, or has it
        simply memorised a link between Dallas and Austin? Patching one component at a time (l11.2.4) can answer a question you already
        know to ask. Is there a way to draw the whole computation behind one answer, in terms of features, and then test the drawing?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Replace each MLP with a transcoder whose latents are interpretable features, freeze everything else that is nonlinear on this
        one prompt, and the network becomes a linear system in its features. In a linear system every feature&apos;s effect on every later
        feature is a single number, so the computation becomes a weighted graph from input tokens to the output logit. Most of the graph
        carries little influence and can be pruned. What is left is a hypothesis, such as Dallas leads to Texas leads to Austin, which you
        then test by intervening on the real model.
      </p>
      <AttributionPruneViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the local replacement model">
        <p>
          Fix a prompt. Replace every MLP with a cross-layer transcoder (l11.4.2) trained to imitate it, so that feature activations are
          read from the residual stream at one layer and written to all later layers. Freeze, at their values on this prompt, the
          attention patterns and the normalisation denominators. Finally add an error node at each layer and position: the difference
          between the true MLP output and the transcoder&apos;s. The result reproduces the model&apos;s output on this prompt exactly, and,
          given which features are active, every path from one feature to another is linear.
        </p>
      </Definition>

      <Definition title="edges and influence">
        <p>
          A source feature with activation <M>{"a_s"}</M> and decoder direction <M>{"d_s"}</M> writes <M>{"a_s d_s"}</M> into the residual
          stream; a later feature reads with encoder direction <M>{"e_t"}</M>. With nothing nonlinear in between, the direct effect is{" "}
          <M>{"A_{st} = a_s\\, d_s \\cdot e_t"}</M> (<C>direct_effect</C>); through a frozen attention head the residual path is replaced by
          the head&apos;s fixed OV map and attention weight, still linear. Collecting these gives a matrix <M>{"A"}</M> over all nodes. A
          node&apos;s total influence on another is the sum over every path of the product of its edge weights (<C>path_sum</C>). Pruning
          keeps the most influential nodes until a chosen share of the total influence on the output is covered (<C>prune</C>).
        </p>
        <Code>{GRAPH}</Code>
      </Definition>

      <Theorem title="influence as a matrix series">
        <p>
          If the nodes can be ordered so that every edge goes forwards, as layers and positions allow, then the matrix of total influences
          is <M>{"A + A^2 + A^3 + \\cdots = A(I - A)^{-1}"}</M>, and the series has at most n - 1 nonzero terms for n nodes.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction on k, <M>{"(A^k)_{ij}"}</M> is the sum over all paths of exactly k edges from i to j of the product of their weights:
          true for k = 1, and <M>{"(A^{k+1})_{ij} = \\sum_m (A^k)_{im} A_{mj}"}</M> extends each k-edge path to m by the edge from m to j,
          covering every (k + 1)-edge path once. Summing over k counts every path once. In the forward order <M>{"A"}</M> is strictly upper
          triangular, so a path has at most n - 1 edges and <M>{"A^n = 0"}</M>. Then <M>{"(I - A)(I + A + \\cdots + A^{n-1}) = I - A^n = I"}</M>,
          so <M>{"I - A"}</M> is invertible and <M>{"\\sum_{k=1}^{n-1} A^k = A(I - A)^{-1}"}</M>.
        </p>
      </Proof>

      <Remark title="attribution, error nodes and validation">
        <p>
          In a linear system, gradient times activation (l11.1.4) gives each input&apos;s exact contribution, which is why the frozen
          replacement model makes attribution trustworthy where it was not before (<C>attribution</C>). Two quantities say how far to trust
          the graph. The share of influence on the output that flows through features rather than error nodes (<C>replacement_score</C>)
          measures how much of the computation is explained at all. Interventions measure whether the explanation transfers to the real
          model: scale or remove a feature in the original network, with attention free to change, and compare the effect on the output
          with what the graph predicts (<C>intervention_effect</C>).
        </p>
        <Code>{CHECKS}</Code>
        <p>
          The graph explains one prompt, through a model of the model. It leaves out why each attention head attended where it did,
          because the patterns were frozen, and it can mislead where the real network is far from linear, for instance when removing a
          feature pushes another across its threshold.
        </p>
      </Remark>

      <Example title="reading one edge">
        <p>
          A Dallas feature fires at 3.0 with a decoder direction that, restricted to the relevant subspace, is (0.6, 0.8). A Texas feature
          in a later layer reads with encoder direction (0.5, 0.25). The direct edge is 3.0 &#215; (0.30 + 0.20) = 1.5. If the Texas
          feature in turn has an edge of 0.8 to the Austin logit and Dallas has no direct edge to it, the influence of Dallas through
          Texas is 1.2. Suppressing the Texas feature in the real model and injecting a California feature should then move the answer
          towards Sacramento, which is the kind of test published circuit-tracing work uses to check such a path.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "edge",
      rung: "check",
      prompt: (
        <p>
          A source feature has activation 1.5 and decoder direction (0.6, 0.8, 0). A later feature has encoder direction (0.5, 0.5, 1).
          With no nonlinearity in between, what is the direct effect of the source on the later feature?
        </p>
      ),
      answer: { kind: "numeric", value: 1.05, tolerance: 0.001 },
    },
    {
      key: "paths",
      rung: "check",
      prompt: (
        <p>
          Feature A has a direct effect of 0.5 on feature B and of 0.3 on the output. Feature B has a direct effect of 0.4 on the output.
          What is the total influence of A on the output?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5, tolerance: 0.001 },
    },
    {
      key: "freeze",
      rung: "apply",
      prompt: <p>Why does circuit tracing freeze attention patterns and normalisation denominators at their values on the prompt?</p>,
      answer: {
        kind: "choice",
        options: [
          "So that effects between features are linear, and edge weights add up exactly to each feature's input",
          "Because attention patterns carry no information about the computation",
          "To make the replacement model generalise to every other prompt",
          "To remove the need for error nodes",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def direct_effect(a, dec, enc):
    return a * sum(x * y for x, y in zip(dec, enc))

def path_sum(A):
    n = len(A)
    total = [[0.0] * n for _ in range(n)]
    power = [row[:] for row in A]
    while any(v != 0 for row in power for v in row):
        total = [[t + p for t, p in zip(tr, pr)] for tr, pr in zip(total, power)]
        power = [[sum(power[i][k] * A[k][j] for k in range(n)) for j in range(n)] for i in range(n)]
    return total

def prune(A, target, keep):
    inf = [abs(row[target]) for row in path_sum(A)]
    order = sorted(range(len(A)), key=lambda i: (-inf[i], i))
    total, acc, kept = sum(inf), 0.0, []
    for i in order:
        if acc >= keep * total - 1e-12:
            break
        kept.append(i)
        acc += inf[i]
    return sorted(kept)

A = [[0, 0.5, 0.1], [0, 0, 0.4], [0, 0, 0]]
print(direct_effect(2, [0.6, 0.8], [1, 0.5]), round(path_sum(A)[0][2], 3), prune(A, 2, 0.6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.0 0.3 [0, 1]",
          "2.0 0.1 [0, 1]",
          "2.0 0.3 [1]",
          "1.4 0.3 [0, 1]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def replacement_score(influence, is_error):
    total = sum(abs(v) for v in influence)
    return sum(abs(v) for v, e in zip(influence, is_error) if not e) / total

def attribution(grad, act):
    return [g * a for g, a in zip(grad, act)]

def intervention_effect(f, x, i, scale):
    y = list(x)
    y[i] *= scale
    return f(y) - f(x)

inf, err = [0.4, -0.2, 0.2, 0.2], [False, False, True, False]
print(round(replacement_score(inf, err), 3), attribution([2, -1], [3, 4]), intervention_effect(lambda v: v[0] * v[1], [2, 3], 0, 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.8 [6, -4] -6",
          "0.8 [6, -4] 6",
          "0.6 [6, -4] -6",
          "0.8 [5, 3] -6",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>direct_effect(a, dec, enc)</C>, the activation times the dot product; <C>path_sum(A)</C>, the matrix whose (i, j) entry
          sums the products of edge weights over every path from i to j in a graph with no cycles; and <C>prune(A, target, keep)</C>, which
          ranks nodes by the absolute value of their total influence on the target (ties by index), adds them in that order until the
          kept influence reaches the fraction keep of the total, and returns the kept indices sorted.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def direct_effect(a, dec, enc):
    return 0.0

def path_sum(A):
    return [row[:] for row in A]

def prune(A, target, keep):
    return list(range(len(A)))
`,
        solution: GRAPH,
        tests: [
          { name: "effects", code: `assert direct_effect(0.5, [1, 2, 2], [0, 1, 1]) == 2.0\nP = path_sum([[0, 2, 0], [0, 0, 3], [0, 0, 0]])\nassert P[0][2] == 6 and P[0][1] == 2` },
          { name: "prune", code: `A = [[0, 0, 0, 0.1], [0, 0, 0.5, 0.2], [0, 0, 0, 0.6], [0, 0, 0, 0]]\nassert prune(A, 3, 0.5) == [2] and prune(A, 3, 0.9) == [1, 2]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>replacement_score(influence, is_error)</C>, the share of total absolute influence that comes from non-error nodes;{" "}
          <C>attribution(grad, act)</C>, gradient times activation elementwise; and <C>intervention_effect(f, x, i, scale)</C>, the change
          in f when entry i of x is multiplied by scale, without modifying x.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def replacement_score(influence, is_error):
    return 1.0

def attribution(grad, act):
    return list(act)

def intervention_effect(f, x, i, scale):
    return 0.0
`,
        solution: CHECKS,
        tests: [
          { name: "scores", code: `assert abs(replacement_score([1, -1, 2], [True, False, False]) - 0.75) < 1e-12\nassert attribution([1, 2], [3, 4]) == [3, 8]` },
          { name: "intervene", code: `x = [3, 1]\nassert intervention_effect(lambda v: v[0] ** 2 + v[1], x, 0, 0) == -9 and x == [3, 1]` },
        ],
      },
    },
    {
      key: "series",
      rung: "stretch",
      prompt: (
        <p>
          Four nodes are in a fixed order, and each has a direct effect of 0.5 on every node after it. What is the total influence of the
          first node on the last? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.125, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Applied to production models, attribution graphs have exposed multi-step reasoning, planning ahead in verse, and shared
        multilingual features, and also where explanations break down. The next lesson walks through such case studies.
      </p>
    </>
  ),
};
