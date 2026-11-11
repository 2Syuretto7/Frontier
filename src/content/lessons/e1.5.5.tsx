import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EinsumViz } from "@/components/viz/EinsumViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.5.5",
  minutes: 55,
  links: {
    requires: ["e1.5.3"],
    revisits: ["e1.5.2"],
    parallels: ["m3.3.2"],
    foreshadows: ["e1.5.6"],
  },

  puzzle: (
    <>
      <p>
        In attention, queries <C>Q</C> have shape (batch, heads, query position, dimension) and keys <C>K</C> have shape
        (batch, heads, key position, dimension). You need, for every batch, head, query and key, the dot product over the
        dimension.
      </p>
      <p>
        With <C>@</C>, <C>.T</C> and <C>reshape</C> this takes some thought about which axes to swap. Could you instead just
        name the axes and say which one to sum over?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        <C>np.einsum</C> lets you do exactly that. Give each axis a letter; letters that appear in the output are kept, letters
        that appear only in the inputs are summed over. The attention scores are{" "}
        <C>np.einsum(&quot;bhqd,bhkd-&gt;bhqk&quot;, Q, K)</C>. Every einsum is a set of nested loops, and seeing those loops
        makes the notation obvious.
      </p>
      <EinsumViz />
    </>
  ),

  theory: (
    <>
      <Definition title="einsum notation">
        <p>
          In <C>np.einsum(&quot;ij,jk-&gt;ik&quot;, A, B)</C>, each input gets one letter per axis. A letter shared by two
          inputs must have the same size in both. The output is
        </p>
        <MD>{"C_{ik} = \\sum_j A_{ij} B_{jk},"}</MD>
        <p>
          that is, multiply the inputs entry by entry and sum over every letter missing from the output. This is the Einstein
          summation convention of physics, made explicit.
        </p>
      </Definition>

      <Example title="a phrasebook">
        <ul>
          <li><C>&quot;ij-&gt;ji&quot;</C>: transpose. <C>&quot;ij-&gt;i&quot;</C>: row sums. <C>&quot;ii-&gt;&quot;</C>: trace.</li>
          <li><C>&quot;i,i-&gt;&quot;</C>: dot product. <C>&quot;i,j-&gt;ij&quot;</C>: outer product.</li>
          <li><C>&quot;ij,j-&gt;i&quot;</C>: matrix times vector. <C>&quot;bij,bjk-&gt;bik&quot;</C>: a batch of matrix products.</li>
        </ul>
      </Example>

      <Remark title="counting the work">
        <p>
          The loops run over every combination of all the letters, so an einsum performs the product of all the letter sizes in
          multiply-adds. For <C>&quot;ij,jk-&gt;ik&quot;</C> with all sizes <M>n</M> that is <M>{"n^3"}</M>; for the attention
          scores it is <M>{"b \\cdot h \\cdot q \\cdot k \\cdot d"}</M>. Counting this way is the first step of estimating how
          long a model takes to run.
        </p>
      </Remark>

      <Example title="why practitioners like it">
        <Code>{`scores = np.einsum("bhqd,bhkd->bhqk", Q, K) / np.sqrt(d)
out = np.einsum("bhqk,bhkd->bhqd", weights, V)`}</Code>
        <p>
          The string documents the shapes as it computes, and a mismatch raises an error naming the letter. PyTorch and JAX
          accept the same notation, and libraries such as einops extend it to reshaping.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "summed",
      rung: "check",
      prompt: <p>In <C>&quot;ij,jk-&gt;ik&quot;</C>, which letter is summed over?</p>,
      answer: { kind: "choice", options: ["j", "i", "k", "none"], correct: [0] },
    },
    {
      key: "transpose",
      rung: "check",
      prompt: <p>Which einsum string transposes a matrix?</p>,
      answer: { kind: "choice", options: ["ij->ji", "ij->i", "ii->", "i,j->ij"], correct: [0] },
    },
    {
      key: "rowsum",
      rung: "apply",
      prompt: <p>For <C>A = [[1, 2, 3], [4, 5, 6]]</C>, what is the second entry of <C>np.einsum(&quot;ij-&gt;i&quot;, A)</C>?</p>,
      answer: { kind: "numeric", value: 15 },
    },
    {
      key: "matmul",
      rung: "apply",
      prompt: <p>With <C>A</C> as above and <C>B = [[1, 0], [0, 1], [1, 1]]</C>, what is entry <C>[1, 1]</C> of <C>np.einsum(&quot;ij,jk-&gt;ik&quot;, A, B)</C>?</p>,
      answer: { kind: "numeric", value: 11 },
    },
    {
      key: "attn",
      rung: "apply",
      prompt: <p>For <C>&quot;bhqd,bhkd-&gt;bhqk&quot;</C> with b = 2, h = 8, q = k = 128 and d = 64, how many elements does the output have?</p>,
      answer: { kind: "numeric", value: 262144 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.arange(6).reshape(2, 3)
print(np.einsum("ij->j", A), np.einsum("ij,ij->", A, A))`}</Code>
          <p>Indices left out of the output are summed. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[3 5 7] 55", "[ 3 12] 55", "[3 5 7] 15", "[0 1 4] 55"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
a = np.array([1, 2, 3]); b = np.array([4, 5])
print(np.einsum("i,j->ij", a, b).tolist(), np.einsum("i,i->", a, a), np.einsum("ii->i", np.eye(2) * 3).tolist())`}</Code>
          <p>An outer product, a dot product and a diagonal, all with einsum. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[[4, 5], [8, 10], [12, 15]] 14 [3.0, 3.0]", "[[4, 8, 12], [5, 10, 15]] 14 [3.0, 3.0]", "[[4, 5], [8, 10], [12, 15]] 6 [3.0, 3.0]", "[[4, 5], [8, 10], [12, 15]] 14 6.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write each with one <C>np.einsum</C> call: <C>batch_matmul(A, B)</C> for arrays of shape (b, n, k) and (b, k, m), <C>trace(M)</C>, and <C>attention_scores(Q, K)</C> returning the (n, n) matrix of dot products of rows of Q with rows of K.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def batch_matmul(A, B):
    return np.einsum('bnk,bkm->bnk', A, B)

def trace(M):
    return np.einsum('ij->', M)

def attention_scores(Q, K):
    return np.einsum('id,jd->ij', Q, Q)
`,
        solution: `import numpy as np

def batch_matmul(A, B):
    return np.einsum('bnk,bkm->bnm', A, B)

def trace(M):
    return np.einsum('ii->', M)

def attention_scores(Q, K):
    return np.einsum('id,jd->ij', Q, K)
`,
        tests: [
          { name: "batch", code: `import numpy as np
rng = np.random.default_rng(1)
A, B = rng.normal(size=(4, 2, 3)), rng.normal(size=(4, 3, 5))
assert np.allclose(batch_matmul(A, B), A @ B), 'Sum over k and keep b, n and m.'` },
          { name: "trace", code: `import numpy as np
assert trace(np.arange(9).reshape(3, 3)) == 12, 'A repeated index ii reads the diagonal.'` },
          { name: "scores", code: `import numpy as np
rng = np.random.default_rng(2)
Q, K = rng.normal(size=(3, 4)), rng.normal(size=(3, 4))
assert np.allclose(attention_scores(Q, K), Q @ K.T), 'Scores are Q Kᵀ.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Implement einsum yourself for two operands. <C>my_einsum(spec, A, B)</C> takes a spec such as <C>"ij,jk-&gt;ik"</C> with an explicit output: find the size of every letter from the shapes (raising <C>ValueError</C> if a letter has two different sizes), then loop over every combination of all letters with <C>itertools.product</C>, adding A[...]·B[...] into the output entry. Letters may repeat within an operand (<C>"ii,j-&gt;j"</C> uses A&rsquo;s diagonal) and the output may be a scalar (<C>"ij,ij-&gt;"</C>). Return a NumPy array.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def my_einsum(spec, A, B):
    return A @ B
`,
        solution: `import numpy as np

import itertools

def my_einsum(spec, A, B):
    ins, out = spec.split('->')
    sa, sb = ins.split(',')
    size = {}
    for subs, arr in ((sa, A), (sb, B)):
        for c, n in zip(subs, arr.shape):
            if size.setdefault(c, n) != n:
                raise ValueError(f'size mismatch for {c}')
    letters = sorted(size)
    res = np.zeros(tuple(size[c] for c in out))
    for combo in itertools.product(*(range(size[c]) for c in letters)):
        v = dict(zip(letters, combo))
        res[tuple(v[c] for c in out)] += A[tuple(v[c] for c in sa)] * B[tuple(v[c] for c in sb)]
    return res
`,
        tests: [
          { name: "matmul", code: `import numpy as np
rng = np.random.default_rng(0)
A, B = rng.normal(size=(3, 4)), rng.normal(size=(4, 2))
assert np.allclose(my_einsum('ij,jk->ik', A, B), A @ B)` },
          { name: "many", code: `import numpy as np
rng = np.random.default_rng(1)
cases = [('i,j->ij', (3,), (4,)), ('ij,ij->', (2, 3), (2, 3)), ('ii,j->j', (3, 3), (2,)), ('bij,bjk->bik', (2, 3, 4), (2, 4, 5)), ('ij,kj->ik', (3, 2), (4, 2)), ('ijk,k->ji', (2, 3, 4), (4,))]
for spec, sa, sb in cases:
    A, B = rng.normal(size=sa), rng.normal(size=sb)
    assert np.allclose(my_einsum(spec, A, B), np.einsum(spec, A, B)), spec` },
          { name: "mismatch", code: `import numpy as np
try:
    my_einsum('ij,jk->ik', np.ones((2, 3)), np.ones((4, 2)))
    assert False, 'j has sizes 3 and 4.'
except ValueError:
    pass` },
        ],
      },
    },
    {
      key: "cost",
      rung: "prove",
      prompt: (
        <p>
          Write the attention-score einsum as explicit nested loops, explain why it performs <M>{"b h q k d"}</M> multiply-adds,
          and say how the count grows when the sequence length doubles.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes loops over b, h, q and k for the output, with an inner loop over d accumulating Q[b,h,q,d] * K[b,h,k,d].",
          "Explains each of the b·h·q·k output entries needs d multiply-adds, giving b·h·q·k·d in total.",
          "Notes that q and k both equal the sequence length, so doubling it multiplies the work by four.",
          "Connects this to the quadratic cost of attention in sequence length.",
        ],
      },
    },
    {
      key: "cube",
      rung: "stretch",
      prompt: <p>How many multiply-adds does <C>&quot;ij,jk-&gt;ik&quot;</C> perform when <C>i</C>, <C>j</C> and <C>k</C> are each 1,000?</p>,
      answer: { kind: "numeric", value: 1e9 },
    },
  ],

  teachBack:
    "Explain to a friend how to read an einsum string, which letters are summed, and how to count the work it does.",

  glimpse: (
    <p>
      Next, strides: how NumPy finds element (i, j) in memory, and why a transpose costs nothing. Transformers and Language Models
      builds attention from exactly these einsums.
    </p>
  ),
};
