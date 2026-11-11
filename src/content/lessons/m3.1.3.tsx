import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { CosineSimViz } from "@/components/viz/CosineSimViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.1.3",
  minutes: 45,
  links: {
    requires: ["m3.1.2"],
    parallels: ["l1.4.1"],
    applies: ["l1.4.1"],
    foreshadows: ["l4.2.2", "l4.2.4", "l5.2.1"],
  },

  puzzle: (
    <>
      <p>
        A search engine stores every document as a vector of word counts. You search for &ldquo;linear algebra&rdquo;. One
        document is a short, focused note on linear algebra. Another is an enormous encyclopaedia that mentions linear algebra
        many times, along with ten thousand other subjects.
      </p>
      <p>Measured by dot product with your query, the encyclopaedia wins. Is that the answer you wanted?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        The dot product mixes two things: how well two vectors are aligned, and how long they are. A long vector scores
        highly against almost anything. Below, toy word vectors are ranked against a query. Ranked by dot product, the long
        vector for &ldquo;the&rdquo; floats to the top because it is a little like everything. Switch to cosine similarity,
        which divides out both lengths, and the ranking reflects direction alone.
      </p>
      <CosineSimViz />
    </>
  ),

  theory: (
    <>
      <Definition title="cosine similarity">
        <p>For non-zero vectors u and v,</p>
        <MD>{"\\cos(\\mathbf u, \\mathbf v) = \\frac{\\mathbf u \\cdot \\mathbf v}{\\|\\mathbf u\\|\\,\\|\\mathbf v\\|},"}</MD>
        <p>
          the cosine of the angle between them. By Cauchy-Schwarz it lies in [−1, 1]: 1 for the same direction, 0 for
          perpendicular, −1 for opposite directions.
        </p>
      </Definition>

      <Theorem title="scale does not matter">
        <p>
          For positive numbers a and b, <M>{"\\cos(a\\mathbf u, b\\mathbf v) = \\cos(\\mathbf u, \\mathbf v)"}</M>. If either
          number is negative instead, the sign of the cosine flips.
        </p>
      </Theorem>
      <Proof>
        <p>
          The numerator becomes <M>{"ab\\,\\mathbf u\\cdot\\mathbf v"}</M> and the denominator{" "}
          <M>{"|a|\\,|b|\\,\\|\\mathbf u\\|\\,\\|\\mathbf v\\|"}</M>. They differ by the factor <M>{"ab/|ab| = \\pm 1"}</M>.
        </p>
      </Proof>

      <Theorem title="cosine and distance for unit vectors">
        <p>If <M>{"\\|\\mathbf u\\| = \\|\\mathbf v\\| = 1"}</M>, then</p>
        <MD>{"\\|\\mathbf u - \\mathbf v\\|^2 = 2 - 2\\cos(\\mathbf u, \\mathbf v)."}</MD>
        <p>So after normalising, the nearest neighbour by distance is the most similar by cosine.</p>
      </Theorem>

      <Example title="the puzzle, in numbers">
        <p>
          Let the query be q = (1, 1) in the coordinates (count of &ldquo;linear&rdquo;, count of &ldquo;algebra&rdquo;),
          ignoring all other words. The note is n = (3, 3, 1) and the encyclopaedia e = (40, 30, 1000), the third coordinate
          standing for everything else, with q = (1, 1, 0). Then <M>{"\\mathbf q\\cdot\\mathbf n = 6"}</M> and{" "}
          <M>{"\\mathbf q\\cdot\\mathbf e = 70"}</M>, but
        </p>
        <MD>{"\\cos(\\mathbf q, \\mathbf n) = \\frac{6}{\\sqrt2\\sqrt{19}} \\approx 0.97, \\qquad \\cos(\\mathbf q, \\mathbf e) = \\frac{70}{\\sqrt2\\sqrt{1\\,002\\,500}} \\approx 0.049."}</MD>
      </Example>

      <Remark title="where you will meet it">
        <p>
          Retrieval systems rank documents by the cosine between embedding vectors. Contrastive learning trains embeddings so
          that matching pairs have high cosine. Many models normalise their vectors to unit length first, after which the dot
          product and the cosine are the same number and can be computed by one matrix multiplication.
        </p>
      </Remark>

      <Remark title="a caution">
        <p>
          A cosine of 0 means the vectors are perpendicular, not that the things they represent are unrelated. Cosine
          similarity only sees what the embedding chose to encode.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "range",
      rung: "check",
      prompt: <p>Which values can cosine similarity take?</p>,
      answer: { kind: "choice", options: ["Any number in [−1, 1]", "Any number in [0, 1]", "Any real number", "Only 0 or 1"], correct: [0] },
    },
    {
      key: "parallel",
      rung: "check",
      prompt: <p>Find the cosine similarity of (1, 1) and (2, 2).</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "half",
      rung: "apply",
      prompt: <p>Find the cosine similarity of (1, 0, 1) and (0, 1, 1).</p>,
      answer: { kind: "numeric", value: 0.5 },
    },
    {
      key: "kq",
      rung: "apply",
      prompt: (
        <p>
          Using the toy vectors king = (0.9, 0.8, 0.1, 0.2) and queen = (0.85, 0.75, 0.15, 0.9), find their cosine similarity
          to three decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.875, tolerance: 0.001 },
    },
    {
      key: "true",
      rung: "apply",
      prompt: <p>Which statements are true? Select all that apply.</p>,
      answer: {
        kind: "choice",
        options: [
          "If every vector has length 1, ranking by dot product and ranking by cosine similarity agree.",
          "Multiplying a vector by 10 changes its cosine similarity with others.",
          "Multiplying a vector by −1 flips the sign of its cosine similarity with others.",
        ],
        correct: [0, 2],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
E = np.array([[3.0, 4.0], [1.0, 0.0], [0.0, 2.0]])
E = E / np.linalg.norm(E, axis=1, keepdims=True)
q = np.array([0.6, 0.8])
print(np.argmax(E @ q))`}</Code>
          <p>The rows of E are three embeddings. What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            The rows of <C>E</C> are embeddings. Write <C>top_k(E, q, k)</C>, which returns the indices of the k rows with the
            highest cosine similarity to the query q, most similar first.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def top_k(E, q, k):
    E, q = np.asarray(E, float), np.asarray(q, float)
    scores = E @ q
    return list(np.argsort(-scores)[:k])
`,
        solution: `import numpy as np

def top_k(E, q, k):
    E, q = np.asarray(E, float), np.asarray(q, float)
    scores = (E @ q) / (np.linalg.norm(E, axis=1) * np.linalg.norm(q))
    return [int(i) for i in np.argsort(-scores)[:k]]
`,
        tests: [
          { name: "long vectors do not win", code: `E = [[0.9, 0.8, 0.1], [0.1, 0.05, 0.9], [2.5, 2.2, 2.4]]
assert list(top_k(E, [0.85, 0.75, 0.15], 1)) == [0], 'A long vector should not win just by being long. Divide out the lengths.'` },
          { name: "order", code: `E = [[1, 0], [1, 1], [0, 1], [-1, 0]]
assert list(top_k(E, [1, 0.1], 3)) == [0, 1, 2], 'Return the indices from most to least similar.'` },
          { name: "scale invariant", code: `E = [[10, 0], [0, 1]]
assert list(top_k(E, [0.1, 1], 1)) == [1], 'Scaling a row should not change its similarity.'` },
        ],
      },
    },
    {
      key: "dist",
      rung: "prove",
      prompt: (
        <p>
          Prove that for unit vectors <M>{"\\|\\mathbf u - \\mathbf v\\|^2 = 2 - 2\\cos(\\mathbf u, \\mathbf v)"}</M>, and
          explain why this means a nearest-neighbour search by Euclidean distance on normalised vectors returns the same
          ranking as a search by cosine similarity.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Expands ‖u − v‖² = u·u − 2u·v + v·v.",
          "Uses u·u = v·v = 1 and u·v = cos(u, v) for unit vectors.",
          "Observes that 2 − 2c decreases as c increases, so smaller distance means larger cosine and the orders agree.",
        ],
      },
    },
    {
      key: "enc",
      rung: "stretch",
      prompt: (
        <p>
          In the puzzle, the encyclopaedia e = (40, 30, 1000) is cut down to its linear algebra chapter, (40, 30, 10). Find its
          new cosine similarity with q = (1, 1, 0), to three decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.971, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend why ranking by dot product favours long vectors, how cosine similarity fixes this, and why normalising vectors makes the two the same.",

  glimpse: (
    <p>
      Next, lines and planes described by dot products, which is how a classifier draws its boundary. Deep Learning
      Architectures trains embeddings whose cosines carry meaning, and Transformers and Language Models scores every pair of
      tokens with a scaled dot product.
    </p>
  ),
};
