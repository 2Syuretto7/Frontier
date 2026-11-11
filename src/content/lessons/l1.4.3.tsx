import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { TreeViz } from "@/components/viz/TreeViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.4.3",
  minutes: 55,
  links: {
    revisits: ["l0.3.3", "l1.1.3"],
    parallels: ["m4.3.3", "e2.4.1"],
    foreshadows: ["l1.4.4", "l2.4.1", "l2.4.4"],
  },

  puzzle: (
    <>
      <p>
        A bank has ten past loan applicants: six repaid and four did not. One yes-or-no question splits them into a group of
        four who all repaid, and a group of six with two who repaid and four who did not.
      </p>
      <p>
        Another question splits them into two groups of five, each with three who repaid. Which question taught you more?
        Can you put a number on how &ldquo;mixed&rdquo; a group is, so a computer could choose?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The second question is useless: both groups look exactly like the whole. The first question produced one pure group
        and one that is mostly defaulters. A decision tree is built by repeatedly asking whichever question makes the groups
        purest, then asking again inside each group.
      </p>
      <TreeViz />
      <p>
        Each question compares one feature with a threshold, so every region is a rectangle. Grow the tree deep enough and
        every leaf becomes pure: training accuracy reaches 100%, while accuracy on new points falls, because the last few
        splits exist only to wall off individual noisy points.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="decision tree">
        <p>
          A <strong>decision tree</strong> is a binary tree. Each internal node holds a test &ldquo;<M>{"x_j \\le t"}</M>&rdquo;
          on one feature <M>j</M> and a threshold <M>t</M>, and sends a point left or right. Each leaf holds a prediction: the
          majority class of the training points that reach it, or for regression their mean.
        </p>
      </Definition>

      <Definition title="Gini impurity">
        <p>
          For a node whose training points have class proportions <M>{"p_1, \\dots, p_K"}</M>, the <strong>Gini
          impurity</strong> is
        </p>
        <MD>{"G = 1 - \\sum_{k=1}^K p_k^2 ."}</MD>
        <p>
          It is 0 for a pure node and largest when the classes are evenly mixed. It is the chance that two points drawn at
          random from the node, with replacement, have different labels. An alternative is the entropy{" "}
          <M>{"H = -\\sum_k p_k \\log_2 p_k"}</M>.
        </p>
      </Definition>

      <Definition title="choosing a split">
        <p>
          A split sends <M>{"n_L"}</M> of a node&rsquo;s <M>n</M> points left and <M>{"n_R"}</M> right. Its cost is the
          weighted impurity of the children,
        </p>
        <MD>{"\\frac{n_L}{n} G_L + \\frac{n_R}{n} G_R ,"}</MD>
        <p>
          and the tree tries every feature and every threshold between consecutive data values, keeping the cheapest. It then
          recurses into each child until a stopping rule fires: a maximum depth, a minimum number of points per leaf, or a
          pure node. This greedy method does not find the best tree overall, which is computationally hard, but it is fast and
          works well.
        </p>
      </Definition>

      <Example title="the loan question">
        <p>
          The parent has six repaid and four defaults, so <M>{"G = 1 - 0.6^2 - 0.4^2 = 0.48"}</M>. The first question gives a
          pure child of four, with <M>{"G = 0"}</M>, and a child of six with proportions <M>{"\\tfrac13, \\tfrac23"}</M>, so{" "}
          <M>{"G = 1 - \\tfrac19 - \\tfrac49 = \\tfrac49"}</M>. The weighted cost is{" "}
          <M>{"\\tfrac{4}{10} \\cdot 0 + \\tfrac{6}{10} \\cdot \\tfrac49 \\approx 0.267"}</M>, a decrease of about 0.213. The
          second question leaves both children at 0.48: no decrease at all.
        </p>
      </Example>

      <Theorem title="depth and leaves">
        <p>
          A binary tree of depth <M>D</M> has at most <M>{"2^D"}</M> leaves.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction on <M>D</M>. A tree of depth 0 is a single leaf, and <M>{"2^0 = 1"}</M>. A tree of depth{" "}
          <M>{"D + 1"}</M> is either a leaf or a root with two subtrees of depth at most <M>D</M>, each with at most{" "}
          <M>{"2^D"}</M> leaves, so it has at most <M>{"2 \\cdot 2^D = 2^{D+1}"}</M>.
        </p>
      </Proof>

      <Remark title="strengths and the weakness">
        <p>
          Trees need no rescaling of features, because a threshold test gives the same answer under any increasing change of
          units. They handle mixed numeric and categorical data and can be read as a list of rules. Their weakness is
          instability: a small change in the training data can change the first split, and with it the whole tree. In the
          language of model selection, a deep tree has high variance. The next lesson turns that weakness into a strength.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "shape",
      rung: "check",
      prompt: <p>With two numeric features, what shape are the regions of a decision tree?</p>,
      answer: { kind: "choice", options: ["Rectangles with sides parallel to the axes", "Circles", "Arbitrary polygons"], correct: [0] },
    },
    {
      key: "scale",
      rung: "check",
      prompt: <p>If you convert one feature from metres to centimetres and refit, do a decision tree&rsquo;s predictions change?</p>,
      answer: { kind: "choice", options: ["No", "Yes"], correct: [0] },
    },
    {
      key: "gini",
      rung: "apply",
      prompt: <p>A node holds 6 points of one class and 4 of the other. What is its Gini impurity?</p>,
      answer: { kind: "numeric", value: 0.48 },
    },
    {
      key: "weighted",
      rung: "apply",
      prompt: <p>That node is split into a child with 4 and 0, and a child with 2 and 4. What is the weighted Gini impurity of the children? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 0.4 * 0 + 0.6 * (4 / 9), tolerance: 0.0006 },
    },
    {
      key: "useless",
      rung: "apply",
      prompt: <p>A different split gives two children of 5 points, each with 3 of one class and 2 of the other. By how much does it reduce the Gini impurity?</p>,
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "pure",
      rung: "prove",
      prompt: (
        <p>
          Prove that if no two training points have the same input but different labels, a decision tree grown without a depth
          limit reaches zero training error. Then explain why a depth limit is usually imposed anyway.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Argues that any impure node contains two points with different labels and hence different inputs, so they differ in some feature.",
          "Notes a threshold between their values of that feature splits the node into two non-empty children.",
          "Concludes, since each split strictly reduces the number of points per node, that splitting must end with every leaf pure, so every training point is classified correctly.",
          "Explains that the final splits fit noise, isolating single points, so test error rises; a depth limit or minimum leaf size controls this overfitting.",
        ],
      },
    },
    {
      key: "entropy",
      rung: "stretch",
      prompt: <p>What is the entropy, in bits, of a node with 6 points of one class and 4 of the other? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 0.971, tolerance: 0.0006 },
    },
  ],

  teachBack:
    "Explain to a friend how a decision tree chooses its first question, what Gini impurity measures, and why a very deep tree overfits.",

  glimpse: (
    <p>
      Next, random forests, which average hundreds of deliberately varied trees. Statistical Machine Learning derives the CART
      algorithm in full and builds gradient boosting, in which each new tree corrects the mistakes of the ones before; boosted
      trees remain the method to beat on tables of data.
    </p>
  ),
};
