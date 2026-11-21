import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DesignBudgetViz } from "@/components/viz/DesignBudgetViz";
import type { LessonContent } from "@/lib/types";

const SHAPE = `def params(c):
    hd = c["d"] // c["heads"]
    attn = 2 * c["d"] * c["d"] + 2 * c["d"] * c["kv_heads"] * hd       # Q and O, then K and V
    mlp = 3 * c["d"] * c["ffn"]                                         # SwiGLU: gate, up and down
    body = c["layers"] * (attn + mlp + 2 * c["d"])                      # two RMSNorm gains per layer
    embed = c["vocab"] * c["d"] * (1 if c["tied"] else 2)
    return body + c["d"], embed                                         # final norm counted with the body

def train_flops_per_token(c, ctx):
    body, _ = params(c)
    head = 2 * c["vocab"] * c["d"]                                      # the output projection
    return 3 * (2 * body + head + 4 * c["layers"] * ctx * c["d"])       # forward, then backward at twice the cost

def kv_bytes(c, ctx, width):
    hd = c["d"] // c["heads"]
    return 2 * c["layers"] * c["kv_heads"] * hd * ctx * width`;

const DECIDE = `import operator

OPS = {"<=": operator.le, ">=": operator.ge}

def failures(design, reqs):
    return [name for name, key, op, bound in reqs if not OPS[op](design[key], bound)]

def score(design, weights):
    return sum(w * design[k] for k, w in weights.items())             # negative weights penalise a metric

def choose(designs, reqs, weights):
    ok = [d for d in designs if not failures(d, reqs)]
    if not ok:
        return None
    return max(ok, key=lambda d: score(d, weights))                    # the first of equal scores wins`;

export const lesson: LessonContent = {
  id: "e15.1.1",
  minutes: 45,
  links: {
    requires: ["e13.1.1", "l8.4.3", "e12.1.2"],
    revisits: ["l8.2.1", "l8.2.2", "e13.6.1"],
    foreshadows: ["e15.1.2", "e15.5.4"],
  },

  puzzle: (
    <>
      <p>
        This course builds a small language model end to end: data, tokeniser, pretraining, post-training, serving,
        evaluation and a technical report. A project that size goes wrong most often not in its code but in its
        decisions: a model too large for the budget, a context length the serving plan cannot afford, a goal nobody can
        measure. Before writing any training code, what should be written down, and how can it be checked?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A design document states what the model is for, the constraints it must meet and the shape chosen to meet them,
        with the arithmetic that connects them. Most of that arithmetic is simple: the parameter count follows from
        width, depth and vocabulary; the training cost per token from the parameter count and context; the serving
        memory from the key-value heads. Writing the requirements as checkable bounds turns the choice between
        candidate designs into a filter followed by a ranking, and makes every later change a visible edit to a number.
      </p>
      <DesignBudgetViz />
    </>
  ),

  theory: (
    <>
      <Definition title="what the document contains">
        <p>
          The capstone&apos;s design document has six parts. The goal: what the model should do and for whom, for
          example a 200-million-parameter English and code model that answers short questions and solves grade-school
          arithmetic with tools. The constraints: compute, memory, time and data available. The architecture: a decoder
          with RMSNorm, SwiGLU and rotary embeddings as in l8.2.1 and grouped-query attention as in l8.2.2, with its
          dimensions. The budget: tokens and FLOPs, worked out in the next lesson. The evaluation plan, in the lesson
          after. And the risks, with what will be done if each occurs, in the spirit of the postmortems of e13.6.1
          written in advance.
        </p>
      </Definition>

      <Definition title="the shape arithmetic">
        <p>
          With width d, h query heads of size d / h, g key-value heads, SwiGLU width f, L layers and vocabulary V, each
          layer has <M>{"2d^2 + 2dg(d/h)"}</M> attention weights, <M>{"3df"}</M> feed-forward weights and two norm gains
          of size d (<C>params</C>, which reports body and embedding parameters separately, since the embedding table
          costs memory but almost no compute). Training costs about six FLOPs per body parameter per token, plus the
          output projection and the attention scores, which grow with context (<C>train_flops_per_token</C>). The key-value
          cache stores two vectors per key-value head per layer per token (<C>kv_bytes</C>), as in e12.1.2.
        </p>
        <Code>{SHAPE}</Code>
      </Definition>

      <Theorem title="training FLOPs per token">
        <p>
          For a decoder with B body parameters, a V × d output projection, L layers and context T, a forward pass costs{" "}
          <M>{"2B + 2Vd + 4LTd"}</M> FLOPs per token, counting each multiply-add as two, with attention over the full
          context, and a training step costs three times as much.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each weight takes part in one multiply-add per token in the forward pass, giving 2B for the body and 2Vd for
          the output projection. In each layer, the scores <M>{"QK^\\top"}</M> cost one multiply-add per pair of query
          position and key position per dimension, which is Td per query token, and weighting the values costs the
          same, for 4Td FLOPs per token per layer in all. The backward pass computes gradients with respect to both
          activations and weights, two products for every product in the forward pass, so a training step costs three
          forward passes. With causal masking, kernels such as FlashAttention skip about half of the score work, which
          this count ignores as a margin.
        </p>
      </Proof>

      <Definition title="requirements as checks">
        <p>
          Each requirement is a named bound on a metric of the design, such as training memory at most 24 GB or KV cache
          at most 512 MiB per sequence (<C>failures</C>). Among designs that pass, preferences are a weighted sum, with
          negative weights for costs (<C>score</C>), and the choice is the best passing design (<C>choose</C>). Writing
          them this way keeps hard constraints separate from trade-offs, so that a design never wins on preferences while
          breaking a constraint.
        </p>
        <Code>{DECIDE}</Code>
      </Definition>

      <Example title="a capstone-sized model">
        <p>
          Width 1024, 16 layers, 16 query heads and 4 key-value heads, SwiGLU width 2816, and a 32768-token vocabulary
          with tied embeddings, is a model of a couple of hundred million parameters. A single modern GPU trains it on a
          few billion tokens in hours, which leaves room for the scaling ladder of e15.3.1 and repeated post-training
          experiments. Larger is possible, but the capstone is about doing every stage properly, and a model that trains
          in hours allows mistakes to be found and fixed.
        </p>
      </Example>

      <Remark title="keeping the document alive">
        <p>
          The document is versioned with the code. Every later lesson changes some number in it, the token count after
          building the corpus, the learning rate after the ladder, and each change is recorded with the evidence for it.
          The technical report of e15.5.4 is largely this document, completed with results.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "params",
      rung: "check",
      prompt: (
        <p>
          With the model of the example (width 1024, 16 layers, 16 query heads, 4 key-value heads, SwiGLU width 2816,
          vocabulary 32768, tied embeddings, two norm gains per layer and a final norm), how many millions of parameters
          does it have in total, to one decimal?
        </p>
      ),
      answer: { kind: "numeric", value: 213.9, tolerance: 0.05 },
    },
    {
      key: "kv",
      rung: "check",
      prompt: (
        <p>
          For the same model in bf16, how many MiB of key-value cache does one sequence of 6000 tokens need?
        </p>
      ),
      answer: { kind: "numeric", value: 93.75, tolerance: 0.001 },
    },
    {
      key: "hard",
      rung: "apply",
      prompt: <p>Why are requirements checked as bounds before designs are ranked by a weighted score?</p>,
      answer: {
        kind: "choice",
        options: [
          "So that a design breaking a hard constraint cannot win by scoring well on other metrics",
          "Because weighted scores cannot include memory",
          "Because bounds are cheaper to compute than scores",
          "So that the score never needs negative weights",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def params(c):
    hd = c["d"] // c["heads"]
    attn = 2 * c["d"] * c["d"] + 2 * c["d"] * c["kv_heads"] * hd       # Q and O, then K and V
    mlp = 3 * c["d"] * c["ffn"]                                         # SwiGLU: gate, up and down
    body = c["layers"] * (attn + mlp + 2 * c["d"])                      # two RMSNorm gains per layer
    embed = c["vocab"] * c["d"] * (1 if c["tied"] else 2)
    return body + c["d"], embed                                         # final norm counted with the body

def train_flops_per_token(c, ctx):
    body, _ = params(c)
    head = 2 * c["vocab"] * c["d"]                                      # the output projection
    return 3 * (2 * body + head + 4 * c["layers"] * ctx * c["d"])       # forward, then backward at twice the cost

def kv_bytes(c, ctx, width):
    hd = c["d"] // c["heads"]
    return 2 * c["layers"] * c["kv_heads"] * hd * ctx * width

c = {"d": 8, "heads": 2, "kv_heads": 1, "ffn": 16, "layers": 2, "vocab": 10, "tied": True}; print(params(c), kv_bytes(c, 5, 2))
print(train_flops_per_token(c, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(1192, 80) 160\n8400",
          "(1192, 160) 160\n8400",
          "(1176, 80) 160\n8400",
          "(1192, 80) 320\n8400",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import operator

OPS = {"<=": operator.le, ">=": operator.ge}

def failures(design, reqs):
    return [name for name, key, op, bound in reqs if not OPS[op](design[key], bound)]

def score(design, weights):
    return sum(w * design[k] for k, w in weights.items())             # negative weights penalise a metric

def choose(designs, reqs, weights):
    ok = [d for d in designs if not failures(d, reqs)]
    if not ok:
        return None
    return max(ok, key=lambda d: score(d, weights))                    # the first of equal scores wins

r = [("fits", "mem", "<=", 24), ("good", "acc", ">=", 0.5)]; print(failures({"mem": 30, "acc": 0.5}, r), score({"mem": 30, "acc": 0.5}, {"acc": 10, "mem": -0.1}))
ds = [{"n": "a", "mem": 20, "acc": 0.6}, {"n": "b", "mem": 10, "acc": 0.55}, {"n": "c", "mem": 40, "acc": 0.9}]; print(choose(ds, r, {"acc": 100, "mem": -0.1})["n"], choose(ds, r, {"acc": 10, "mem": -1})["n"])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['fits'] 2.0\na b",
          "['fits', 'good'] 2.0\na b",
          "['fits'] 2.0\nb b",
          "['fits'] 2.0\nc b",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>params(c)</C>, returning (body, embedding) parameter counts as defined above;{" "}
          <C>train_flops_per_token(c, ctx)</C>; and <C>kv_bytes(c, ctx, width)</C>. The config has keys d, heads,
          kv_heads, ffn, layers, vocab and tied.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def params(c):
    return c["layers"] * 12 * c["d"] ** 2, c["vocab"] * c["d"]

def train_flops_per_token(c, ctx):
    return 6 * sum(params(c))

def kv_bytes(c, ctx, width):
    return 2 * c["layers"] * c["d"] * ctx * width
`,
        solution: SHAPE,
        tests: [
          { name: "params", code: `c = {"d": 4, "heads": 2, "kv_heads": 2, "ffn": 6, "layers": 1, "vocab": 3, "tied": False}; assert params(c) == (148, 24) and kv_bytes(c, 3, 1) == 24` },
          { name: "flops", code: `c = {"d": 4, "heads": 2, "kv_heads": 1, "ffn": 6, "layers": 3, "vocab": 5, "tied": True}; assert params(c)[0] == 3 * (32 + 16 + 72 + 8) + 4 and train_flops_per_token(c, 2) == 3 * (2 * 388 + 40 + 96)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>failures(design, reqs)</C>, the names of requirements (name, key, op, bound) a design breaks, with op
          &quot;&lt;=&quot; or &quot;&gt;=&quot;; <C>score(design, weights)</C>; and <C>choose(designs, reqs, weights)</C>,
          the first highest-scoring passing design, or None.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import operator

OPS = {"<=": operator.le, ">=": operator.ge}

def failures(design, reqs):
    return []

def score(design, weights):
    return 0

def choose(designs, reqs, weights):
    return designs[0]
`,
        solution: DECIDE,
        tests: [
          { name: "checks", code: `r = [("small", "m", "<=", 5), ("fast", "t", ">=", 2)]; assert failures({"m": 6, "t": 1}, r) == ["small", "fast"] and failures({"m": 5, "t": 2}, r) == [] and score({"m": 2, "t": 3}, {"m": -1, "t": 2}) == 4` },
          { name: "choose", code: `r = [("small", "m", "<=", 5)]; ds = [{"m": 9, "t": 9}, {"m": 4, "t": 1}, {"m": 5, "t": 1}]; assert choose(ds, r, {"t": 1}) is ds[1] and choose(ds[:1], r, {"t": 1}) is None` },
        ],
      },
    },
    {
      key: "hours",
      rung: "stretch",
      prompt: (
        <p>
          The example model is trained on 20 tokens per parameter, counting all its parameters, at context 2048, using
          the FLOP count of this lesson, on one GPU sustaining 40% of 989 TFLOP/s. How many hours does it take, to two
          decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 5.07, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        The design fixes a shape. The next lesson fixes how much compute and data to spend on it, using the scaling laws
        and the budget arithmetic of the previous courses.
      </p>
    </>
  ),
};
