import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GradCostViz } from "@/components/viz/GradCostViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.3.5",
  minutes: 55,
  links: {
    requires: ["m5.3.3", "m5.3.4"],
    revisits: ["e4.5.2"],
    foreshadows: ["l3.2.2", "m5.4.5"],
  },

  puzzle: (
    <>
      <p>
        A loss with a billion parameters takes one second to evaluate. Estimating its gradient by finite differences would take
        a billion seconds, over thirty years.
      </p>
      <p>Reverse mode does it in a few seconds. Is that a lucky property of neural networks, or true of every program?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every elementary operation has a backward rule that costs a small constant times the operation itself. The backward
        pass runs one such rule per operation of the forward pass. So the gradient costs a constant times the function, for any
        program, however many inputs it has.
      </p>
      <GradCostViz />
      <p>
        The bill comes in memory instead: the backward pass needs every intermediate value. Checkpointing trades a little
        recomputation for a lot of memory, and is how very deep models fit on a GPU.
      </p>
    </>
  ),

  theory: (
    <>
      <Theorem title="cheap gradient principle">
        <p>
          Let f : <M>{"\\mathbb R^n \\to \\mathbb R"}</M> be computed by a tape of N elementary operations, each with at most two
          arguments. Then reverse mode computes f and <M>{"\\nabla f"}</M> with at most <M>{"c \\cdot N"}</M> operations, for a
          constant c that depends only on the set of elementary operations (about 5 for +, ×, sin, exp), not on n.
        </p>
      </Theorem>
      <Proof>
        <p>
          The forward pass costs N. The backward pass visits each tape entry once. For c = a + b it does{" "}
          <M>{"\\bar a \\mathrel{+}= \\bar c"}</M>, <M>{"\\bar b \\mathrel{+}= \\bar c"}</M>: 2 operations. For c = ab, two
          multiplications and two additions: 4. For c = sin a, a cosine, a multiplication and an addition: 3. For c = exp a, a
          multiplication (reusing c) and an addition: 2. So the backward pass costs at most 4N, and the total at most 5N.
          Initialising the adjoints adds a pass over the nodes, also O(N).
        </p>
      </Proof>

      <Remark title="what the principle does not say">
        <p>
          It is about one scalar output. A function with m outputs needs m reverse sweeps for its full Jacobian, and the cost of
          a Hessian is not a constant times the cost of f. In practice the constant is larger than the operation count suggests,
          because memory traffic, not arithmetic, often dominates.
        </p>
      </Remark>

      <Definition title="checkpointing">
        <p>
          A chain of n layers stores n activations for the backward pass. Instead, store only the input of every k-th layer,{" "}
          <M>{"\\lceil n/k \\rceil"}</M> checkpoints. During the backward pass, rerun each segment of k layers forward from its
          checkpoint, store its k activations, and backpropagate through it. The peak memory is about
        </p>
        <MD>{"\\lceil n / k \\rceil + k,"}</MD>
        <p>
          minimised near <M>{"k = \\sqrt n"}</M>, at about <M>{"2\\sqrt n"}</M>, for the price of one extra forward pass.
        </p>
      </Definition>

      <Example title="a hundred layers">
        <p>
          With n = 100 and k = 10, memory drops from 100 stored activations to 10 + 10 = 20, and the compute rises from about
          3 forward passes&rsquo; worth to about 4.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "ratio",
      rung: "check",
      prompt: (
        <p>
          Evaluating a scalar loss of a million parameters takes 10 ms. Roughly how long does reverse mode take for the loss and
          its full gradient?
        </p>
      ),
      answer: {
        kind: "choice",
        options: ["A few times 10 ms", "A million times 10 ms", "A thousand times 10 ms", "Exactly 10 ms"],
        correct: [0],
      },
    },
    {
      key: "mem",
      rung: "check",
      prompt: <p>What does the memory of plain reverse mode grow with?</p>,
      answer: {
        kind: "choice",
        options: [
          "The number of intermediate values from the forward pass",
          "The number of inputs only",
          "The number of outputs only",
          "Nothing: it is constant",
        ],
        correct: [0],
      },
    },
    {
      key: "fd",
      rung: "apply",
      prompt: (
        <p>
          A function of <M>{"10^6"}</M> inputs takes 1 second to evaluate. How many days does a forward-difference gradient take
          (n + 1 evaluations)? Give one decimal place.
        </p>
      ),
      answer: { kind: "numeric", value: 11.6, tolerance: 0.06 },
    },
    {
      key: "ckpt",
      rung: "apply",
      prompt: (
        <p>
          A chain of 400 layers is checkpointed every 20 layers. What is the peak number of stored activations,{" "}
          <M>{"\\lceil n/k \\rceil + k"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 40 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`COST = {"add": (1, 2), "mul": (1, 4), "sin": (1, 3)}
tape = [("a", "mul"), ("b", "sin"), ("c", "add"), ("d", "mul"), ("e", "mul")]
fwd = sum(COST[op][0] for _, op in tape)
bwd = sum(COST[op][1] for _, op in tape)
print(fwd, bwd, (fwd + bwd) / fwd)`}</Code>
          <p>Counting operations on a tape: (forward, backward) per operation. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["5 17 4.4", "5 17 3.4", "5 12 3.4", "5 22 5.4"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
def peak(n, k):
    return math.ceil(n / k) + k
print([peak(64, k) for k in (1, 4, 8, 16, 64)])`}</Code>
          <p>Peak memory of checkpointing for several segment lengths. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[65, 20, 16, 20, 65]", "[64, 20, 16, 20, 64]", "[65, 16, 16, 16, 65]", "[65, 20, 16, 20, 1]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>peak_memory(n, k)</C>, returning <M>{"\\lceil n/k \\rceil + \\min(k, n)"}</M>, and <C>best_k(n)</C>, the
          segment length k in 1..n with the smallest peak memory (the smallest such k on ties).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def peak_memory(n, k):
    return n

def best_k(n):
    return 1
`,
        solution: `def peak_memory(n, k):
    return -(-n // k) + min(k, n)

def best_k(n):
    best = 1
    for k in range(2, n + 1):
        if peak_memory(n, k) < peak_memory(n, best):
            best = k
    return best
`,
        tests: [
          { name: "peak", code: `assert [peak_memory(64, k) for k in (1, 4, 8, 16, 64)] == [65, 20, 16, 20, 65]
assert peak_memory(10, 3) == 4 + 3, 'Round n / k up: a partial segment still needs a checkpoint.'
assert peak_memory(5, 9) == 1 + 5` },
          { name: "best", code: `assert best_k(100) == 10 and peak_memory(100, best_k(100)) == 20
assert best_k(1) == 1
k = best_k(1000)
assert peak_memory(1000, k) == min(peak_memory(1000, j) for j in range(1, 1001)) and 25 <= k <= 40` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Backpropagation by hand for a two-layer network. With <M>{"h = \\tanh(W_1 x)"}</M>, <M>{"y = W_2 h"}</M> and{" "}
          <M>{"L = \\tfrac12 \\|y - t\\|^2"}</M>, write <C>mlp_grads(W1, W2, x, t)</C> returning (L, gradient in W1, gradient in
          W2). Use the VJP rules: <M>{"\\bar y = y - t"}</M>, then the linear layer, then tanh, then the first linear layer.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def mlp_grads(W1, W2, x, t):
    return 0.0, np.zeros_like(W1), np.zeros_like(W2)
`,
        solution: `import numpy as np

def mlp_grads(W1, W2, x, t):
    z = W1 @ x
    h = np.tanh(z)
    y = W2 @ h
    L = 0.5 * np.sum((y - t) ** 2)
    y_bar = y - t
    gW2 = np.outer(y_bar, h)
    h_bar = W2.T @ y_bar
    z_bar = h_bar * (1 - h ** 2)
    gW1 = np.outer(z_bar, x)
    return L, gW1, gW2
`,
        tests: [
          { name: "shapes and loss", code: `import numpy as np
rng = np.random.default_rng(0)
W1, W2 = rng.standard_normal((4, 3)), rng.standard_normal((2, 4))
x, t = rng.standard_normal(3), rng.standard_normal(2)
L, g1, g2 = mlp_grads(W1, W2, x, t)
assert g1.shape == (4, 3) and g2.shape == (2, 4)
assert abs(L - 0.5 * np.sum((W2 @ np.tanh(W1 @ x) - t) ** 2)) < 1e-12` },
          { name: "matches finite differences", code: `import numpy as np
rng = np.random.default_rng(1)
W1, W2 = rng.standard_normal((4, 3)), rng.standard_normal((2, 4))
x, t = rng.standard_normal(3), rng.standard_normal(2)
L, g1, g2 = mlp_grads(W1, W2, x, t)
f = lambda A, B: 0.5 * np.sum((B @ np.tanh(A @ x) - t) ** 2)
E = np.zeros((4, 3)); E[2, 1] = 1e-6
F = np.zeros((2, 4)); F[1, 3] = 1e-6
assert abs(g1[2, 1] - (f(W1 + E, W2) - f(W1 - E, W2)) / 2e-6) < 1e-6
assert abs(g2[1, 3] - (f(W1, W2 + F) - f(W1, W2 - F)) / 2e-6) < 1e-6` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove the cheap gradient principle for tapes built from +, ×, sin and exp: if the forward pass has N operations, the
          forward and backward passes together need at most 5N operations, plus O(N) to initialise the adjoints.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that the backward pass visits each tape entry exactly once, in reverse order.",
          "Counts the backward cost of each operation: + needs 2, × needs 4, sin needs 3, exp needs 2 (or bounds each by 4).",
          "Sums to at most 4N for the backward pass and adds N for the forward pass.",
          "Observes the bound does not depend on the number of inputs n.",
        ],
      },
    },
    {
      key: "big",
      rung: "stretch",
      prompt: (
        <p>
          For a chain of n = 10,000 layers, what is the smallest possible peak memory <M>{"\\lceil n/k \\rceil + k"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 200 },
    },
  ],

  teachBack:
    "Explain to a friend why the gradient of any program costs only a few times as much as running it, and what checkpointing trades to save memory.",

  glimpse: (
    <p>
      Neural networks are made of matrices, and differentiating them entry by entry is error-prone. Chapter 4 develops matrix
      calculus: differentials, layouts, and the gradients that appear in every model.
    </p>
  ),
};
