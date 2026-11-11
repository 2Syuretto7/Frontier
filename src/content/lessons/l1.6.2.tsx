import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { DendroViz } from "@/components/viz/DendroViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.6.2",
  minutes: 45,
  links: {
    requires: ["l1.6.1"],
    revisits: ["m4.3.3"],
    parallels: ["e2.6.4"],
    foreshadows: ["l2.6.4"],
  },

  puzzle: (
    <>
      <p>
        Biologists sort living things into species, species into genera, genera into families, and so on up. Nobody asks
        &ldquo;how many groups are there?&rdquo;; the answer depends on the level you look at.
      </p>
      <p>
        Could a clustering method build the whole ladder at once, and let you choose the level afterwards?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Start with every point as its own cluster. Repeatedly join the two closest clusters, and record how far apart they
        were. After <M>{"n - 1"}</M> joins, everything is one cluster, and the record of joins is a tree called a{" "}
        <strong>dendrogram</strong>. Cut it with a horizontal line, and the branches it crosses are your clusters: a low cut
        gives many small ones, a high cut a few large ones.
      </p>
      <DendroViz />
      <p>
        &ldquo;How close are two clusters?&rdquo; has more than one answer. Single linkage uses the closest pair of points, so
        a thin bridge of points can chain distant groups together. Complete linkage uses the farthest pair, so it keeps
        clusters compact.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="agglomerative clustering">
        <p>
          Begin with <M>n</M> singleton clusters. While more than one cluster remains, find the pair <M>{"A, B"}</M> with the
          smallest linkage distance <M>{"D(A, B)"}</M>, replace them by <M>{"A \\cup B"}</M>, and record the merge height{" "}
          <M>{"D(A, B)"}</M>.
        </p>
      </Definition>

      <Definition title="linkages">
        <p>For a distance <M>d</M> between points:</p>
        <MD>{"D_{\\text{single}}(A, B) = \\min_{a \\in A, b \\in B} d(a, b), \\qquad D_{\\text{complete}}(A, B) = \\max_{a \\in A, b \\in B} d(a, b),"}</MD>
        <p>
          and <strong>average linkage</strong> takes the mean of <M>{"d(a, b)"}</M> over all pairs. <strong>Ward&rsquo;s
          method</strong> merges the pair that increases the k-means objective least.
        </p>
      </Definition>

      <Theorem title="merge heights never decrease">
        <p>For single and complete linkage, each merge height is at least the one before it.</p>
      </Theorem>
      <Proof>
        <p>
          Suppose <M>A</M> and <M>B</M> merge at height <M>h</M>, the smallest linkage distance among current clusters. For
          any other cluster <M>C</M>, single linkage gives{" "}
          <M>{"D(A \\cup B, C) = \\min(D(A, C), D(B, C)) \\ge h"}</M>, and complete linkage gives{" "}
          <M>{"\\max(D(A, C), D(B, C)) \\ge h"}</M>. Distances between untouched clusters were already at least <M>h</M>. So
          every distance available for the next merge is at least <M>h</M>.
        </p>
      </Proof>
      <p>
        That is why a dendrogram can be drawn with heights going up, and why a horizontal cut is meaningful. Some other
        linkages, such as the distance between cluster centroids, can break this rule.
      </p>

      <Example title="four points on a line">
        <p>
          Points 0, 1, 3, 7. Single linkage merges 0 and 1 at height 1, then adds 3 at height 2, then 7 at height 4. Complete
          linkage also merges 0 and 1 at 1; next, <M>{"\\{0, 1\\}"}</M> to 3 is 3, and 3 to 7 is 4, so 3 joins at height 3;
          finally 7 joins at <M>{"7 - 0 = 7"}</M>. Cutting the single-linkage tree at 1.5 gives three clusters:{" "}
          <M>{"\\{0, 1\\}, \\{3\\}, \\{7\\}"}</M>.
        </p>
      </Example>

      <Remark title="cost and connections">
        <p>
          The simple algorithm stores all <M>{"n^2"}</M> pairwise distances and takes about <M>{"n^3"}</M> steps, so it suits
          thousands of points, not millions. Single linkage is the same as building a minimum spanning tree by Kruskal&rsquo;s
          method and deleting its longest edges.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "single",
      rung: "check",
      prompt: <p>Single linkage measures the distance between two clusters as the distance between which points?</p>,
      answer: { kind: "choice", options: ["The closest pair, one from each cluster", "The farthest pair", "The two cluster means"], correct: [0] },
    },
    {
      key: "lower",
      rung: "check",
      prompt: <p>Lowering the cut on a dendrogram gives what?</p>,
      answer: { kind: "choice", options: ["More, smaller clusters", "Fewer, larger clusters", "The same clusters"], correct: [0] },
    },
    {
      key: "singletop",
      rung: "apply",
      prompt: <p>Points 0, 1, 3, 7. At what height does the final single-linkage merge happen?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "completetop",
      rung: "apply",
      prompt: <p>Same points. At what height does the final complete-linkage merge happen?</p>,
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "cut",
      rung: "apply",
      prompt: <p>How many clusters do you get by cutting the single-linkage tree for 0, 1, 3, 7 at height 2.5?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "mono",
      rung: "prove",
      prompt: <p>Prove that for complete linkage, merge heights never decrease from one merge to the next.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Lets A and B merge at height h, the minimum linkage distance among the current clusters.",
          "Computes D(A ∪ B, C) = max(D(A, C), D(B, C)) for any other cluster C.",
          "Uses D(A, C) ≥ h and D(B, C) ≥ h, both true because h was the minimum, to get D(A ∪ B, C) ≥ h.",
          "Notes distances between other clusters are unchanged and already at least h, so the next merge height is at least h.",
        ],
      },
    },
    {
      key: "inversion",
      rung: "stretch",
      prompt: (
        <p>
          Three points form an equilateral triangle of side 1. With <strong>centroid</strong> linkage, two points merge at height
          1. At what height does the third point merge with their centroid? Give three decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: Math.sqrt(3) / 2, tolerance: 0.0006 },
    },
  ],

  teachBack:
    "Explain to a friend how agglomerative clustering builds a dendrogram, how a cut turns it into clusters, and how single and complete linkage differ.",

  glimpse: (
    <p>
      Next, principal components, which find structure of a different kind: the directions along which data varies most. Data
      Structures and Algorithms builds minimum spanning trees, the engine inside single linkage, and Statistical Machine Learning
      warns how easily cluster pictures from t-SNE and UMAP can mislead.
    </p>
  ),
};
