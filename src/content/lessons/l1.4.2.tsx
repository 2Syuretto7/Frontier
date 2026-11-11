import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { CurseViz } from "@/components/viz/CurseViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.4.2",
  minutes: 45,
  links: {
    requires: ["l1.4.1"],
    revisits: ["m3.1.2"],
    parallels: ["m4.6.3"],
    foreshadows: ["l1.6.3", "l2.6.1"],
  },

  puzzle: (
    <>
      <p>
        Data is spread evenly through the unit cube <M>{"[0, 1]^d"}</M>. Around a query point you draw a smaller cube that
        should hold the nearest 1% of the data.
      </p>
      <p>
        In one dimension that cube is an interval of length 0.01. How long must its edge be in 10 dimensions? In 100? Is the
        neighbourhood still &ldquo;local&rdquo;?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A cube of edge <M>e</M> in <M>d</M> dimensions has volume <M>{"e^d"}</M>. To hold 1% of the data, <M>{"e^d = 0.01"}</M>,
        so <M>{"e = 0.01^{1/d}"}</M>. That is 0.01 in one dimension, about 0.63 in ten, and about 0.95 in a hundred. To find
        1% of the data in a hundred dimensions, the &ldquo;neighbourhood&rdquo; must stretch across 95% of every axis. It is
        not local at all.
      </p>
      <CurseViz />
      <p>
        The chart shows a related fact. In high dimension, the nearest and farthest of many random points are almost equally
        far away. A method built on &ldquo;the nearest examples are the relevant ones&rdquo; loses its footing, because there
        are no especially near examples. This family of effects is called the <strong>curse of dimensionality</strong>.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="curse of dimensionality">
        <p>
          The <strong>curse of dimensionality</strong> is the collection of ways in which methods that work in low dimension
          degrade as the number of features <M>d</M> grows: neighbourhoods stop being local, distances concentrate, and the
          amount of data needed to cover the space grows exponentially in <M>d</M>.
        </p>
      </Definition>

      <Example title="volume lives near the surface">
        <p>
          The fraction of the unit cube lying within 0.05 of its boundary is one minus the volume of the inner cube of edge
          0.9:
        </p>
        <MD>{"1 - 0.9^d."}</MD>
        <p>
          That is 0.1 in one dimension, about 0.65 in ten, and more than 0.9999 in a hundred. Almost all of a
          high-dimensional cube is skin.
        </p>
      </Example>

      <Theorem title="distances concentrate">
        <p>
          Let <M>X</M> and <M>Y</M> be independent and uniform in <M>{"[0, 1]^d"}</M>. Then
        </p>
        <MD>{"\\mathbb{E}\\lVert X - Y \\rVert^2 = \\frac{d}{6}, \\qquad \\operatorname{Var}\\lVert X - Y \\rVert^2 = \\frac{7d}{180}."}</MD>
        <p>
          So the standard deviation divided by the mean is <M>{"\\sqrt{1.4/d}"}</M>, which tends to 0 as <M>d</M> grows.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"\\lVert X - Y \\rVert^2 = \\sum_{j=1}^d (U_j - V_j)^2"}</M>, where the pairs <M>{"(U_j, V_j)"}</M> are
          independent and each <M>{"U_j, V_j"}</M> is uniform on <M>{"[0, 1]"}</M>. For one coordinate,
        </p>
        <MD>{"\\mathbb{E}(U - V)^2 = \\mathbb{E}U^2 - 2\\,\\mathbb{E}U\\,\\mathbb{E}V + \\mathbb{E}V^2 = \\tfrac13 - \\tfrac12 + \\tfrac13 = \\tfrac16."}</MD>
        <p>
          The difference <M>{"W = U - V"}</M> has density <M>{"1 - |w|"}</M> on <M>{"[-1, 1]"}</M>, so{" "}
          <M>{"\\mathbb{E}W^4 = 2\\int_0^1 w^4 (1 - w)\\,dw = 2\\left(\\tfrac15 - \\tfrac16\\right) = \\tfrac{1}{15}"}</M>,
          and <M>{"\\operatorname{Var} W^2 = \\tfrac1{15} - \\tfrac1{36} = \\tfrac{7}{180}"}</M>. Means add, and variances of
          independent terms add, giving <M>{"d/6"}</M> and <M>{"7d/180"}</M>. Finally{" "}
          <M>{"\\sqrt{7d/180} \\big/ (d/6) = \\sqrt{36 \\cdot 7 / (180 d)} = \\sqrt{1.4/d}"}</M>.
        </p>
      </Proof>

      <Remark title="why learning still works">
        <p>
          Images of a million pixels would be hopeless if they filled their space evenly. They do not. Real data tends to lie
          near a much lower-dimensional surface inside the big space, an idea called the <strong>manifold
          hypothesis</strong>. Methods that find that structure, starting with principal components later in this course,
          escape much of the curse.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ratio",
      rung: "check",
      prompt: <p>For many random points in a high-dimensional cube, what happens to (nearest distance) ÷ (farthest distance) from a query as <M>d</M> grows?</p>,
      answer: { kind: "choice", options: ["It approaches 1", "It approaches 0", "It stays roughly constant"], correct: [0] },
    },
    {
      key: "grid",
      rung: "check",
      prompt: <p>A grid with 10 cells along each axis has how many cells in 20 dimensions?</p>,
      answer: { kind: "numeric", value: 1e20 },
    },
    {
      key: "edge",
      rung: "apply",
      prompt: <p>What edge length must a sub-cube of <M>{"[0, 1]^{10}"}</M> have to hold 1% of the volume? Give two decimal places.</p>,
      answer: { kind: "numeric", value: 0.631, tolerance: 0.006 },
    },
    {
      key: "skin",
      rung: "apply",
      prompt: <p>What fraction of <M>{"[0, 1]^{10}"}</M> lies within 0.05 of the boundary? Give two decimal places.</p>,
      answer: { kind: "numeric", value: 0.651, tolerance: 0.006 },
    },
    {
      key: "mean",
      rung: "apply",
      prompt: <p>Two independent uniform points in <M>{"[0, 1]^{60}"}</M>. What is the expected squared distance between them?</p>,
      answer: { kind: "numeric", value: 10 },
    },
    {
      key: "sixth",
      rung: "prove",
      prompt: (
        <p>
          Prove that for independent <M>{"U, V"}</M> uniform on <M>{"[0, 1]"}</M>, <M>{"\\mathbb{E}(U - V)^2 = 1/6"}</M>. Deduce the
          expected squared distance between two independent uniform points in <M>{"[0, 1]^d"}</M>, and say why this growth alone
          does not make nearest neighbours fail.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes E[U²] = 1/3 and E[U] = 1/2, and uses independence for E[UV] = 1/4.",
          "Expands E(U − V)² = 1/3 − 2·(1/4) + 1/3 = 1/6.",
          "Uses linearity of expectation over the d coordinates to get d/6.",
          "Explains that all distances growing together is harmless; the problem is that their spread shrinks relative to their size, so near and far become indistinguishable.",
        ],
      },
    },
    {
      key: "edge100",
      rung: "stretch",
      prompt: <p>In 100 dimensions, what edge length must a sub-cube have to hold 1% of the volume of the unit cube? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 0.955, tolerance: 0.0006 },
    },
  ],

  teachBack:
    "Explain to a friend why a neighbourhood holding 1% of the data is not local in 100 dimensions, and why real data can still be learned from.",

  glimpse: (
    <p>
      Next, decision trees, which choose a few features to split on rather than measuring distance in all of them. High-Dimensional
      Probability and Statistics turns the concentration you met here into sharp inequalities, and the same effect is why random
      high-dimensional vectors are nearly orthogonal, a fact language models exploit to pack many features into one space.
    </p>
  ),
};
