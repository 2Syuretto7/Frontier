import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DraftTreeViz } from "@/components/viz/DraftTreeViz";
import type { LessonContent } from "@/lib/types";

const HEADS = `import numpy as np
from itertools import product

def medusa_heads(h, Ws):
    return [int(np.argmax(W @ h)) for W in Ws]      # head k guesses the token k + 1 steps ahead

def topk_candidates(logit_lists, ks):
    tops = [list(np.argsort(l)[::-1][:k]) for l, k in zip(logit_lists, ks)]
    return [tuple(int(t) for t in c) for c in product(*tops)]   # every combination of each head's top guesses

def accept_longest(candidates, target_next):
    best = ()
    for c in candidates:
        n = 0
        while n < len(c) and c[n] == target_next.get(c[:n]):
            n += 1                                  # keep drafts while they match the target's own choice
        if n > len(best):
            best = c[:n]
    return best`;

const TREE = `import numpy as np

def tree_nodes(ks):
    total, width = 0, 1
    for k in ks:
        width *= k                                  # nodes at this depth
        total += width
    return total

def tree_mask(parents):
    n = len(parents)
    m = np.zeros((n, n), dtype=bool)
    for i in range(n):
        j = i
        while j != -1:
            m[i, j] = True                          # a node sees itself and its ancestors only
            j = parents[j]
    return m

def expected_accept(acc_probs):
    total, p = 0.0, 1.0
    for a in acc_probs:
        p *= a                                      # reaching depth d needs every earlier depth accepted
        total += p
    return total`;

export const lesson: LessonContent = {
  id: "e12.3.2",
  minutes: 50,
  links: {
    requires: ["e12.3.1", "l5.3.4"],
    revisits: ["e2.4.4", "e12.1.3"],
    foreshadows: ["e12.3.3"],
  },

  puzzle: (
    <>
      <p>
        Speculative decoding needs a draft model: one more model to train, keep aligned with the target as it is updated, and serve
        beside it, with its own KV cache. Yet the target&apos;s final hidden state already encodes a great deal about what comes after
        the next token. Can a few small layers on top of that state do the drafting, and can several guesses per position be checked
        at once instead of a single chain?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Draft heads are small networks attached to the target&apos;s last hidden state, each trained to predict a token further ahead:
        head 1 the token after next, head 2 the one after that, and so on, as in Medusa. Methods such as EAGLE instead run a single light
        layer autoregressively on the target&apos;s features, which is more accurate. Either way the guesses are cheap. Rather than
        betting on one chain, the top few guesses at each depth are arranged as a tree, and the target scores every node in one pass
        using an attention mask in which each node sees only its ancestors, like the branches of a trie (e2.4.4). The longest path the
        target agrees with is kept.
      </p>
      <DraftTreeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="heads and candidates">
        <p>
          <C>medusa_heads</C> applies each head&apos;s weight matrix to the hidden state h and returns each head&apos;s top token.{" "}
          <C>topk_candidates</C> forms every combination of the top <M>{"k_i"}</M> tokens of head i, the paths of the candidate tree.{" "}
          <C>accept_longest</C> takes candidates and a map from a prefix of drafted tokens to the target&apos;s greedy choice after it,
          and returns the longest accepted prefix over all candidates.
        </p>
        <Code>{HEADS}</Code>
      </Definition>

      <Theorem title="one pass verifies the whole tree">
        <p>
          Give each tree node the position of its depth and let it attend to the cached context, its ancestors and itself. Then its output
          equals the output the target would compute for the sequence formed by the context and that node&apos;s path.
        </p>
      </Theorem>
      <Proof>
        <p>
          In a causal transformer a position&apos;s output depends only on the tokens it attends to and their positions (e12.1.3). Under
          the tree mask, a node at depth d attends to exactly the context and the d − 1 tokens on its path, at the same positions they
          would occupy in the linear sequence; by induction over layers, every hidden state equals the one in that sequence. So each node
          receives the target&apos;s distribution for the next token after its path, and a candidate is accepted for as long as its tokens
          agree with these distributions.
        </p>
      </Proof>

      <Definition title="size and benefit of a tree">
        <p>
          <C>tree_nodes</C> counts the nodes of a full tree with branching <M>{"k_1, k_2, \\dots"}</M> by depth. <C>tree_mask</C> builds
          the boolean mask from a list of parent indices, with −1 for children of the current token. <C>expected_accept</C> gives the
          expected number of accepted draft tokens when depth d is accepted with probability <M>{"a_d"}</M> given that all earlier depths
          were.
        </p>
        <Code>{TREE}</Code>
      </Definition>

      <Theorem title="expected accepted length">
        <p>
          If depth d is accepted with conditional probability <M>{"a_d"}</M>, the expected number of accepted draft tokens is{" "}
          <M>{"\\sum_d \\prod_{j \\le d} a_j"}</M>, and a tree with <M>{"\\prod_{j \\le D} k_j"}</M> leaves costs{" "}
          <M>{"\\sum_{d \\le D} \\prod_{j \\le d} k_j"}</M> verified tokens.
        </p>
      </Theorem>
      <Proof>
        <p>
          For a non-negative integer N, <M>{"\\mathbb{E}[N] = \\sum_{d \\ge 1} P(N \\ge d)"}</M>, and N ≥ d requires acceptance at depths 1
          to d, with probability <M>{"\\prod_{j \\le d} a_j"}</M>. The node count adds the <M>{"\\prod_{j \\le d} k_j"}</M> nodes at each
          depth. Wider trees raise each <M>{"a_d"}</M>, since the true token is more likely among the top few guesses, but the number of
          verified tokens grows multiplicatively, so practical trees are pruned to the most probable few dozen paths.
        </p>
      </Proof>

      <Remark title="draft heads in practice">
        <p>
          Medusa heads are one or two layers each and can be trained on a frozen target in hours. EAGLE and its successors draft with a
          single transformer layer fed the target&apos;s features and reach higher acceptance; several serving engines support them, and
          some models ship with multi-token prediction heads trained during pre-training that can be reused for drafting. Tree shapes are
          chosen from measured acceptance rates, and the extra verified tokens are nearly free only while decode is memory-bound.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Small heads on the target&apos;s hidden state replace the separate draft model, with no second model to serve or keep in step.
          Arranging their top guesses as a tree and verifying it in one masked pass means a wrong first guess no longer wastes the round,
          raising the expected accepted length at the cost of a few dozen extra tokens per pass.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "nodes",
      rung: "check",
      prompt: <p>A full candidate tree keeps the top 3 guesses at depth 1, 2 at depth 2 and 2 at depth 3. How many nodes does it have?</p>,
      answer: { kind: "numeric", value: 21, tolerance: 0 },
    },
    {
      key: "per_pass",
      rung: "check",
      prompt: (
        <p>
          Depth 1 is accepted with probability 0.7 and depth 2, given depth 1, with probability 0.5. Counting the target&apos;s own extra
          token, how many tokens does a pass yield on average? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.05, tolerance: 0.001 },
    },
    {
      key: "why_heads",
      rung: "apply",
      prompt: <p>What is the main practical advantage of draft heads over a separate draft model?</p>,
      answer: {
        kind: "choice",
        options: [
          "They reuse the target's own hidden state, so there is no second model to train separately, serve or keep in sync",
          "They make the output distribution differ from the target's",
          "They remove the need for verification",
          "They need no training at all",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
from itertools import product

def medusa_heads(h, Ws):
    return [int(np.argmax(W @ h)) for W in Ws]      # head k guesses the token k + 1 steps ahead

def topk_candidates(logit_lists, ks):
    tops = [list(np.argsort(l)[::-1][:k]) for l, k in zip(logit_lists, ks)]
    return [tuple(int(t) for t in c) for c in product(*tops)]   # every combination of each head's top guesses

def accept_longest(candidates, target_next):
    best = ()
    for c in candidates:
        n = 0
        while n < len(c) and c[n] == target_next.get(c[:n]):
            n += 1                                  # keep drafts while they match the target's own choice
        if n > len(best):
            best = c[:n]
    return best

h = np.array([1.0, 0.0]); Ws = [np.array([[0, 1], [2, 0], [1, 1.0]]), np.array([[3, 0], [0, 1], [1, 0.0]])]
print(medusa_heads(h, Ws), len(topk_candidates([[0.1, 0.5, 0.4], [0.3, 0.2, 0.9]], [2, 2])), accept_longest([(1, 2), (1, 0), (2, 0)], {(): 1, (1,): 0, (2,): 0, (1, 0): 5}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[1, 0] 4 (1, 0)", "[1, 0] 4 (1,)", "[1, 0] 9 (1, 0)", "[0, 1] 4 (1, 0)"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def tree_nodes(ks):
    total, width = 0, 1
    for k in ks:
        width *= k                                  # nodes at this depth
        total += width
    return total

def tree_mask(parents):
    n = len(parents)
    m = np.zeros((n, n), dtype=bool)
    for i in range(n):
        j = i
        while j != -1:
            m[i, j] = True                          # a node sees itself and its ancestors only
            j = parents[j]
    return m

def expected_accept(acc_probs):
    total, p = 0.0, 1.0
    for a in acc_probs:
        p *= a                                      # reaching depth d needs every earlier depth accepted
        total += p
    return total

parents = [-1, -1, 0, 2, 1]
print(tree_nodes([2, 3]), tree_mask(parents).sum(), round(expected_accept([0.8, 0.6, 0.5]), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["8 9 1.52", "6 9 1.52", "8 8 1.52", "8 9 1.9"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>medusa_heads(h, Ws)</C>, returning Python ints; <C>topk_candidates(logit_lists, ks)</C>, ordering each head&apos;s
          guesses from most to least likely and returning tuples of ints in <C>itertools.product</C> order; and{" "}
          <C>accept_longest(candidates, target_next)</C>, keeping the first candidate on ties.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np
from itertools import product

def medusa_heads(h, Ws):
    return [0 for W in Ws]

def topk_candidates(logit_lists, ks):
    return []

def accept_longest(candidates, target_next):
    return ()
`,
        solution: HEADS,
        tests: [
          { name: "heads", code: `h = np.array([0.0, 1.0])\nassert medusa_heads(h, [np.eye(2), np.array([[0, 5], [0, 1], [0, 9.0]])]) == [1, 2]\nassert topk_candidates([[1.0, 3.0, 2.0], [5.0, 4.0]], [2, 1]) == [(1, 0), (2, 0)]` },
          { name: "accept", code: `t = {(): 4, (4,): 7, (4, 7): 1}\nassert accept_longest([(4, 2, 1), (4, 7, 1), (3, 7, 1)], t) == (4, 7, 1)\nassert accept_longest([(5,), (6,)], t) == () and accept_longest([(4, 9), (4, 8)], t) == (4,)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tree_nodes(ks)</C>, <C>tree_mask(parents)</C>, returning a boolean NumPy array, and{" "}
          <C>expected_accept(acc_probs)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def tree_nodes(ks):
    return sum(ks)

def tree_mask(parents):
    return np.eye(len(parents), dtype=bool)

def expected_accept(acc_probs):
    return sum(acc_probs)
`,
        solution: TREE,
        tests: [
          { name: "size", code: `assert tree_nodes([4]) == 4 and tree_nodes([2, 2, 2]) == 14 and tree_nodes([]) == 0\nassert abs(expected_accept([0.5, 0.5]) - 0.75) < 1e-12 and expected_accept([]) == 0` },
          { name: "mask", code: `m = tree_mask([-1, 0, 1, 0])\nassert m.dtype == bool and m.tolist() == [[True, False, False, False], [True, True, False, False], [True, True, True, False], [True, False, False, True]]` },
        ],
      },
    },
    {
      key: "wider",
      rung: "stretch",
      prompt: (
        <p>
          A chain of two draft tokens is accepted at depth 1 with probability 0.6 and at depth 2, given depth 1, with probability 0.5.
          Widening depth 1 to four guesses raises its acceptance to 0.9, with depth 2 unchanged. What is the new expected number of
          accepted draft tokens?
        </p>
      ),
      answer: { kind: "numeric", value: 1.35, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Draft heads still guess, and verification still decides. The last lesson of this chapter asks whether a model can produce several
        tokens at once by design: multi-token prediction, lookahead decoding, and diffusion-style parallel generation.
      </p>
    </>
  ),
};
