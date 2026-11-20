import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { NearOrthogonalViz } from "@/components/viz/NearOrthogonalViz";
import type { LessonContent } from "@/lib/types";

const STREAM = `def residual_sum(embed, outputs):
    total = list(embed)
    for out in outputs:
        total = [a + b for a, b in zip(total, out)]
    return total

def logit_diff_direction(U, a, b):
    return [x - y for x, y in zip(U[a], U[b])]

def direct_logit_attribution(outputs, direction, scale=1.0):
    return [sum(o * d for o, d in zip(out, direction)) / scale for out in outputs]`;

const CHANNEL = `import math

def cosine(u, v):
    dot = sum(a * b for a, b in zip(u, v))
    return dot / math.sqrt(sum(a * a for a in u) * sum(b * b for b in v))

def max_interference(vectors):
    n = len(vectors)
    return max(abs(cosine(vectors[i], vectors[j])) for i in range(n) for j in range(i + 1, n))

def compose(W_read, W_write):
    return [[sum(r[k] * W_write[k][j] for k in range(len(r))) for j in range(len(W_write[0]))] for r in W_read]`;

export const lesson: LessonContent = {
  id: "l11.2.1",
  minutes: 50,
  links: {
    requires: ["l11.1.4", "l5.2.4"],
    revisits: ["l11.1.3", "m6.2.2", "l5.2.5"],
    foreshadows: ["l11.2.2", "l11.3.1", "l11.3.3"],
  },

  puzzle: (
    <>
      <p>
        A model with a 512-dimensional residual stream has 96 attention heads and 12 MLP layers writing into it, and must also carry
        information about tens of thousands of tokens and countless facts. If each piece of information needed its own dimension, the
        stream would run out of room immediately. How does so much fit through so narrow a channel?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In a transformer, no component talks to another directly. Each one reads from the residual stream and adds its output back, so
        the stream is a shared channel, and its final value is just the sum of everything written to it. That linearity is what makes
        transformers readable: the contribution of each component to an output can be measured separately. The channel is narrow, but
        in high dimensions there are far more nearly orthogonal directions than dimensions, so components can write in different
        directions with only small interference.
      </p>
      <NearOrthogonalViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the stream as a sum">
        <p>
          With embedding <M>{"x_0"}</M> and component outputs <M>{"o_1, \\dots, o_n"}</M> in order, the final stream is{" "}
          <M>{"x_L = x_0 + \\sum_c o_c"}</M> (<C>residual_sum</C>), because each block adds its output (l5.2.4). The logit for token t is{" "}
          <M>{"U_t^\\top \\mathrm{norm}(x_L)"}</M>. Freezing the final normalisation&apos;s scale s for a given input makes this linear, so
          the direct logit attribution of component c is <M>{"U_t^\\top o_c / s"}</M> (<C>direct_logit_attribution</C>), and for a
          comparison between tokens a and b the direction is <M>{"U_a - U_b"}</M> (<C>logit_diff_direction</C>).
        </p>
        <Code>{STREAM}</Code>
      </Definition>

      <Remark title="what direct attribution misses">
        <p>
          Direct logit attribution counts only the path from a component straight to the output. A head whose output is read by a later
          head, which then writes the answer, gets credit only through the later head. Composition between components is the subject of
          the next lesson; the patching methods of l11.2.4 measure total rather than direct effects.
        </p>
      </Remark>

      <Definition title="reading, writing and composition">
        <p>
          A component reads the stream through a matrix <M>{"W_{\\text{read}}"}</M> and writes through <M>{"W_{\\text{write}}"}</M>. The
          virtual weight from an earlier component&apos;s writing to a later component&apos;s reading is the product{" "}
          <M>{"W_{\\text{read}}^{(\\text{later})} W_{\\text{write}}^{(\\text{earlier})}"}</M> (<C>compose</C>): it says how strongly what one
          writes is seen by the other. If the earlier one writes in directions orthogonal to what the later one reads, the virtual weight
          is zero and they do not communicate. How much two directions overlap is measured by their cosine (<C>cosine</C>), and the worst
          overlap in a set by <C>max_interference</C>.
        </p>
        <Code>{CHANNEL}</Code>
      </Definition>

      <Theorem title="random directions are nearly orthogonal">
        <p>
          If u and v are independent and uniformly distributed on the unit sphere in <M>{"\\mathbb{R}^d"}</M>, then{" "}
          <M>{"E[u^\\top v] = 0"}</M> and <M>{"E[(u^\\top v)^2] = 1/d"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Condition on u. The distribution of v is unchanged by any orthogonal map, so we may rotate u to the first basis vector, giving{" "}
          <M>{"u^\\top v = v_1"}</M>. Reflecting <M>{"v_1 \\mapsto -v_1"}</M> preserves the distribution, so <M>{"E[v_1] = 0"}</M>. By
          symmetry all <M>{"E[v_i^2]"}</M> are equal, and they sum to <M>{"E[\\|v\\|^2] = 1"}</M>, so each is 1/d. The conditional answers
          do not depend on u, so they hold unconditionally. With d = 512, the typical cosine is about 0.044, and since a cosine is a sum of
          many weakly dependent terms, large cosines are exponentially rare, so exponentially many directions in d fit with all pairwise
          cosines below any fixed threshold.
        </p>
      </Proof>

      <Remark title="bandwidth and memory management">
        <p>
          The stream has more demand than dimensions, so components share it. Nearly orthogonal directions let many signals coexist,
          at the cost of small interference whenever several are active at once, which is the starting point of superposition (l11.3.1).
          Some heads and MLP neurons appear to erase information that is no longer needed, writing the negative of what earlier
          components wrote. And because components only add, a direction once written persists unless something removes it, which is
          why a lens can read early layers at all (l11.1.3).
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Each component reads and writes in its own small subspace, and different pieces of information use different directions. In
          512 dimensions random directions have cosines around 0.04, so thousands of them can share the stream while each is read with
          little interference, provided only a few are active at a time.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "dla",
      rung: "check",
      prompt: (
        <p>
          A head writes (1, 3, −1) into the stream. The unembedding rows are (2, 0, 1) for token a and (0, 1, 1) for token b, and the
          final normalisation divides by 2 for this input. What is the head&apos;s direct contribution to the logit of a minus the logit
          of b?
        </p>
      ),
      answer: { kind: "numeric", value: -0.5, tolerance: 0.001 },
    },
    {
      key: "rms",
      rung: "check",
      prompt: (
        <p>
          Two independent random unit directions are drawn in a 400-dimensional stream. What is the root-mean-square of their cosine?
        </p>
      ),
      answer: { kind: "numeric", value: 0.05, tolerance: 0.0005 },
    },
    {
      key: "direct",
      rung: "apply",
      prompt: (
        <p>
          Head 3.2 has a large direct logit attribution for the correct answer, while head 1.5 has almost none. Ablating head 1.5 destroys
          the model&apos;s performance. What is the most likely explanation?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Head 1.5 acts indirectly, writing information that a later head such as 3.2 reads to produce the answer",
          "Direct logit attribution is wrong because the stream is not linear",
          "Ablation is unreliable, so head 1.5 does not matter",
          "Head 3.2 is redundant with head 1.5",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def residual_sum(embed, outputs):
    total = list(embed)
    for out in outputs:
        total = [a + b for a, b in zip(total, out)]
    return total

def logit_diff_direction(U, a, b):
    return [x - y for x, y in zip(U[a], U[b])]

def direct_logit_attribution(outputs, direction, scale=1.0):
    return [sum(o * d for o, d in zip(out, direction)) / scale for out in outputs]

outs = [[1, 0], [0, 2], [-1, 1]]
print(residual_sum([1, 1], outs), direct_logit_attribution(outs, logit_diff_direction([[1, 1], [0, 1]], 0, 1), 2.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 4] [0.5, 0.0, -0.5]",
          "[0, 3] [0.5, 0.0, -0.5]",
          "[1, 4] [1.0, 0.0, -1.0]",
          "[1, 4] [0.5, 1.0, 0.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def cosine(u, v):
    dot = sum(a * b for a, b in zip(u, v))
    return dot / math.sqrt(sum(a * a for a in u) * sum(b * b for b in v))

def max_interference(vectors):
    n = len(vectors)
    return max(abs(cosine(vectors[i], vectors[j])) for i in range(n) for j in range(i + 1, n))

def compose(W_read, W_write):
    return [[sum(r[k] * W_write[k][j] for k in range(len(r))) for j in range(len(W_write[0]))] for r in W_read]

V = [[1, 0], [0, 1], [1, 1]]
print(round(cosine([1, 0], [1, 1]), 3), round(max_interference(V), 3), compose([[1, 1]], [[1, 0], [0, 1]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.707 0.707 [[1, 1]]",
          "0.707 1.0 [[1, 1]]",
          "0.5 0.707 [[1, 1]]",
          "0.707 0.707 [[1], [1]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>residual_sum(embed, outputs)</C>; <C>logit_diff_direction(U, a, b)</C>, the row of U for token a minus the row for b;
          and <C>direct_logit_attribution(outputs, direction, scale=1.0)</C>, each output&apos;s dot product with the direction divided
          by the scale.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def residual_sum(embed, outputs):
    return list(embed)

def logit_diff_direction(U, a, b):
    return U[a]

def direct_logit_attribution(outputs, direction, scale=1.0):
    return [0.0] * len(outputs)
`,
        solution: STREAM,
        tests: [
          { name: "sum", code: `assert residual_sum([0.5, -1.0, 2.0], [[1.0, 1.0, 1.0], [-0.5, 0.0, 2.0]]) == [1.0, 0.0, 5.0]\nassert logit_diff_direction([[1, 2], [3, 5], [0, 1]], 2, 1) == [-3, -4]` },
          { name: "dla", code: `assert direct_logit_attribution([[1.0, 2.0], [3.0, -1.0]], [0.5, 0.5], 0.5) == [3.0, 2.0]\nassert direct_logit_attribution([[2.0, 0.0]], [1.0, 1.0]) == [2.0]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cosine(u, v)</C>; <C>max_interference(vectors)</C>, the largest absolute cosine over distinct pairs; and{" "}
          <C>compose(W_read, W_write)</C>, the matrix product of the two, given as lists of rows.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def cosine(u, v):
    return 0.0

def max_interference(vectors):
    return 0.0

def compose(W_read, W_write):
    return W_read
`,
        solution: CHANNEL,
        tests: [
          { name: "cosine", code: `assert abs(cosine([1, 2, 2], [2, 1, -2])) < 1e-12 and abs(cosine([3, 4], [6, 8]) - 1) < 1e-12\nassert abs(max_interference([[1, 0, 0], [0, 1, 0], [1, 1, 0.5], [0, 0, 1]]) - 2 / 3) < 1e-12` },
          { name: "compose", code: `assert compose([[1, 2], [0, 1], [1, 0]], [[1, 0, 2], [3, 1, 0]]) == [[7, 2, 2], [3, 1, 0], [1, 0, 2]]` },
        ],
      },
    },
    {
      key: "noise",
      rung: "stretch",
      prompt: (
        <p>
          A 100-dimensional stream stores many features, each along its own random unit direction. On some input, 25 other features are
          active with value 1 besides feature i. Reading feature i by a dot product with its direction picks up interference from them.
          What is the standard deviation of that interference?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        An attention head both decides where to read and what to move. The next lesson splits it into those two circuits, each a
        single matrix that can be studied on its own.
      </p>
    </>
  ),
};
