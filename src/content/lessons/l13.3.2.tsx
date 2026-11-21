import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CompactionViz } from "@/components/viz/CompactionViz";
import type { LessonContent } from "@/lib/types";

const MEMORY = `import math

def recency(hours, decay=0.995):
    return decay ** hours

def memory_score(mem, query_vec, now, w):
    u, v = mem["vec"], query_vec
    cos = sum(a * b for a, b in zip(u, v)) / math.sqrt(sum(a * a for a in u) * sum(b * b for b in v))
    return w[0] * recency(now - mem["t"]) + w[1] * mem["imp"] / 10 + w[2] * cos

def retrieve(mems, query_vec, now, w, k):
    order = sorted(range(len(mems)), key=lambda i: -memory_score(mems[i], query_vec, now, w))
    return order[:k]                                       # the k memories to put back in context`;

const COMPACT = `def context_trace(T, P, o, C, s):
    ctx, reads = P, []
    for _ in range(T):
        reads.append(ctx)
        ctx += o
        if ctx > C:
            ctx = P + s                                    # compact: keep the prompt and a summary
    return reads

def n_compactions(T, P, o, C, s):
    reads = context_trace(T + 1, P, o, C, s)
    return sum(b < a for a, b in zip(reads, reads[1:]))

def total_read(T, P, o, C, s):
    return sum(context_trace(T, P, o, C, s))`;

export const lesson: LessonContent = {
  id: "l13.3.2",
  minutes: 50,
  links: {
    requires: ["l13.3.1", "l13.2.3"],
    revisits: ["l8.7.3"],
    foreshadows: ["l13.3.3", "l13.4.2"],
  },

  puzzle: (
    <>
      <p>
        An agent migrating a codebase works for six hours, through hundreds of tool calls, and its context window fills in
        the first forty minutes. Truncating the oldest messages throws away the decision, made early, to keep the old API
        for one module. Starting afresh loses everything. People handle long projects with a plan, a notebook and a memory
        that keeps what matters. What are the equivalents for an agent, and what does each cost?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A plan turns a long task into short ones and makes progress visible, so that it can be written down and survive
        when the details are discarded. Memory comes in layers: the context window is working memory, small and expensive;
        outside it are notes, logs and documents the agent can write and later search. When the window fills, the agent can
        compact it, replacing the history with a summary, which bounds the cost of every step at the price of forgetting
        whatever the summary leaves out.
      </p>
      <CompactionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="planning">
        <p>
          A planning agent first writes a decomposition of the task into steps, then works through them, marking each done
          and revising the plan when a step fails or reveals something new. Keeping the plan as an explicit list in the
          context, or in a file, gives the agent a compact statement of where it is that survives summarisation. Plans help
          most when the task has long-range structure; for short tasks reacting step by step is enough, and a rigid plan can
          stop the agent from adapting.
        </p>
      </Definition>

      <Definition title="kinds of memory">
        <p>
          Working memory is the context window. Episodic memory is the record of what happened, in this task or earlier
          ones. Semantic memory holds facts and notes the agent decided to keep. Procedural memory holds skills, for example a
          library of programs the agent wrote and verified and can call again, as in Voyager, which accumulated such a
          library while exploring a game world. The outer memories are stored as text or embeddings and brought back into
          context by retrieval.
        </p>
      </Definition>

      <Definition title="scoring memories">
        <p>
          Generative Agents retrieved memories by a weighted sum of three scores: recency, decaying exponentially with the
          hours since the memory was last used (<C>recency</C>); importance, a rating from 1 to 10 the model gave when the
          memory was stored; and relevance, the cosine similarity between the memory&apos;s embedding and the current query{" "}
          (<C>memory_score</C>). The top few memories are placed in context (<C>retrieve</C>). Periodically the agent also
          reflects, writing higher-level conclusions from many memories, which are stored as memories themselves.
        </p>
        <Code>{MEMORY}</Code>
      </Definition>

      <Theorem title="compaction bounds the cost of a step">
        <p>
          Let the prompt have P tokens, each step add o tokens, and the context be replaced by the prompt and a summary of s
          tokens whenever it exceeds C, with <M>{"P + s + o \\le C"}</M>. Then no step reads more than C tokens, so T steps read
          at most TC in total, and after the first compaction one occurs every
        </p>
        <MD>{"\\Big\\lfloor \\frac{C - P - s}{o} \\Big\\rfloor + 1"}</MD>
        <p>steps (<C>context_trace</C>, <C>n_compactions</C>).</p>
      </Theorem>
      <Proof>
        <p>
          The context is checked after every step and reset whenever it exceeds C, so at the start of each step it is at most
          C. After a compaction it holds <M>{"P + s"}</M> tokens and after n further steps <M>{"P + s + no"}</M>, which first
          exceeds C when <M>{"n = \\lfloor (C - P - s)/o \\rfloor + 1"}</M>. The bound TC on the total (<C>total_read</C>) is
          linear in T, against the quadratic growth without compaction. The summary length s trades the two concerns of the
          figure: a longer summary preserves more but leaves room for fewer steps before the next compaction, and each
          compaction costs a model call of its own.
        </p>
        <Code>{COMPACT}</Code>
      </Proof>

      <Example title="learning from failure">
        <p>
          Reflexion lets an agent attempt a task, receive feedback such as failing tests, and write a short reflection on what
          went wrong, which is stored and placed in context on the next attempt. On a code-generation benchmark this raised
          first-attempt success on later trials substantially, using no weight updates at all. Memory of this kind turns
          repeated attempts into a crude form of learning, limited by how well the model diagnoses its own mistakes.
        </p>
      </Example>

      <Remark title="what a summary must keep">
        <p>
          A useful compaction keeps the goal, the plan and its status, decisions and their reasons, unresolved problems, and
          pointers such as file names, and drops raw tool output that can be fetched again. Writing progress to a file that
          outlives the context, and rereading it after each compaction, is often more reliable than any summary held only in
          the window.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rec",
      rung: "check",
      prompt: <p>With a recency decay of 0.995 per hour, what weight does a memory last used 48 hours ago receive?</p>,
      answer: { kind: "numeric", value: 0.7862, tolerance: 0.001 },
    },
    {
      key: "period",
      rung: "check",
      prompt: (
        <p>
          The window is 100,000 tokens, the prompt 5,000, the summary 3,000, and each step adds 2,000. How many steps pass
          between one compaction and the next?
        </p>
      ),
      answer: { kind: "numeric", value: 47, tolerance: 0 },
    },
    {
      key: "plan",
      rung: "apply",
      prompt: <p>Why does writing the plan down help an agent that compacts its context?</p>,
      answer: {
        kind: "choice",
        options: [
          "The plan is a compact statement of progress that can be carried through compaction while the detailed history is dropped",
          "Plans make every tool call cheaper",
          "A written plan guarantees that the steps are correct",
          "The model cannot act without a plan",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def recency(hours, decay=0.995):
    return decay ** hours

def memory_score(mem, query_vec, now, w):
    u, v = mem["vec"], query_vec
    cos = sum(a * b for a, b in zip(u, v)) / math.sqrt(sum(a * a for a in u) * sum(b * b for b in v))
    return w[0] * recency(now - mem["t"]) + w[1] * mem["imp"] / 10 + w[2] * cos

def retrieve(mems, query_vec, now, w, k):
    order = sorted(range(len(mems)), key=lambda i: -memory_score(mems[i], query_vec, now, w))
    return order[:k]                                       # the k memories to put back in context

m = [{"t": 0, "imp": 8, "vec": [1, 0]}, {"t": 90, "imp": 2, "vec": [0, 1]}]; print(round(recency(100), 4), [round(memory_score(x, [0, 1], 100, (1, 1, 1)), 4) for x in m])
print(retrieve(m, [1, 0], 100, (1, 1, 1), 1), retrieve(m, [1, 0], 100, (0, 0, 1), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.6058 [1.4058, 2.1511]\n[0] [0, 1]",
          "0.6058 [2.4058, 1.1511]\n[0] [0, 1]",
          "0.6058 [1.4058, 2.1511]\n[1] [0, 1]",
          "0.5 [1.4058, 2.1511]\n[0] [1, 0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def context_trace(T, P, o, C, s):
    ctx, reads = P, []
    for _ in range(T):
        reads.append(ctx)
        ctx += o
        if ctx > C:
            ctx = P + s                                    # compact: keep the prompt and a summary
    return reads

def n_compactions(T, P, o, C, s):
    reads = context_trace(T + 1, P, o, C, s)
    return sum(b < a for a, b in zip(reads, reads[1:]))

def total_read(T, P, o, C, s):
    return sum(context_trace(T, P, o, C, s))

print(context_trace(6, 100, 50, 250, 20), n_compactions(6, 100, 50, 250, 20))
print(total_read(6, 100, 50, 250, 20), total_read(6, 100, 50, 10 ** 9, 20))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[100, 150, 200, 250, 120, 170] 1\n990 1350",
          "[100, 150, 200, 120, 170, 220] 1\n960 1350",
          "[100, 150, 200, 250, 120, 170] 2\n990 1350",
          "[100, 150, 200, 250, 300, 350] 0\n1350 1350",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Memories are dictionaries with keys t (hour stored), imp (1 to 10) and vec. Write <C>recency(hours, decay=0.995)</C>,{" "}
          <C>memory_score(mem, query_vec, now, w)</C> as w[0] times recency plus w[1] times imp/10 plus w[2] times the cosine
          similarity, and <C>retrieve(mems, query_vec, now, w, k)</C>, the indices of the k best, earlier first on ties.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def recency(hours, decay=0.995):
    return 1.0

def memory_score(mem, query_vec, now, w):
    return mem["imp"] / 10

def retrieve(mems, query_vec, now, w, k):
    return list(range(k))
`,
        solution: MEMORY,
        tests: [
          { name: "score", code: `assert recency(0) == 1 and abs(memory_score({"t": 5, "imp": 5, "vec": [3, 4]}, [3, 4], 5, (1, 2, 3)) - 5) < 1e-12` },
          { name: "top", code: `assert retrieve([{"t": 0, "imp": 1, "vec": [1]}, {"t": 0, "imp": 9, "vec": [1]}], [1], 0, (1, 1, 1), 1) == [1]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>context_trace(T, P, o, C, s)</C>, the context size read at each of T steps when the context is reset to P +
          s after any step that takes it above C; <C>n_compactions(T, P, o, C, s)</C>, counting resets during the T steps; and{" "}
          <C>total_read(T, P, o, C, s)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def context_trace(T, P, o, C, s):
    return [P + t * o for t in range(T)]

def n_compactions(T, P, o, C, s):
    return 0

def total_read(T, P, o, C, s):
    return sum(context_trace(T, P, o, C, s))
`,
        solution: COMPACT,
        tests: [
          { name: "trace", code: `assert context_trace(3, 10, 5, 18, 1) == [10, 15, 11]` },
          { name: "count", code: `assert n_compactions(3, 10, 5, 18, 1) == 1 and total_read(3, 10, 5, 18, 1) == 36` },
        ],
      },
    },
    {
      key: "total",
      rung: "stretch",
      prompt: (
        <p>
          With a 5,000-token prompt, 2,000 tokens per step, a 100,000-token window and a 3,000-token summary, how many tokens
          does the agent read over 200 steps?
        </p>
      ),
      answer: { kind: "numeric", value: 10308000, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Plans and memory let an agent work for hours through text and tools. Many tasks, though, live behind graphical
        interfaces built for people, and the next lesson gives the agent a screen, a mouse and a keyboard.
      </p>
    </>
  ),
};
