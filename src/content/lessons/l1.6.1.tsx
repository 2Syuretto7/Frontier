import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { KMeansViz } from "@/components/viz/KMeansViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.6.1",
  minutes: 50,
  links: {
    revisits: ["l0.2.3", "l1.4.1"],
    parallels: ["m3.1.2"],
    foreshadows: ["l1.6.2", "l2.5.1", "l2.5.2"],
  },

  puzzle: (
    <>
      <p>
        A courier company will open 4 depots to serve 120 shops scattered across a city. Each shop is served by its nearest
        depot, and the cost is the sum of the squared distances.
      </p>
      <p>
        If you knew which shops each depot served, where would you put each depot? If you knew where the depots were, which
        shops would each serve? Can you go back and forth between these two questions until nothing changes?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each question is easy when the other is answered. Given the depots, every shop goes to the nearest. Given the groups,
        each depot goes to the average position of its shops, which minimises the squared distances. Alternate, and the cost
        can only fall. This back and forth is <strong>k-means</strong>, the most used clustering method, and it needs no
        labels at all.
      </p>
      <KMeansViz />
      <p>
        Press Step to watch the crosses settle. Then try new random starts: most runs find the four groups, but some get stuck
        with two crosses sharing one group and one cross straddling two. The method only finds a local minimum, so in practice
        it is run several times and the best result is kept.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="the k-means objective">
        <p>
          Given points <M>{"x_1, \\dots, x_n \\in \\mathbb{R}^d"}</M> and a number <M>k</M>, choose centres{" "}
          <M>{"\\mu_1, \\dots, \\mu_k"}</M> and an assignment <M>{"c(i) \\in \\{1, \\dots, k\\}"}</M> to minimise the{" "}
          <strong>within-cluster sum of squares</strong>
        </p>
        <MD>{"J = \\sum_{i=1}^n \\lVert x_i - \\mu_{c(i)} \\rVert^2 ."}</MD>
      </Definition>

      <Definition title="Lloyd's algorithm">
        <p>Start from some centres, often <M>k</M> distinct data points chosen at random, and repeat until nothing changes:</p>
        <ol>
          <li><strong>Assign</strong>: set <M>{"c(i)"}</M> to the index of the centre nearest to <M>{"x_i"}</M>.</li>
          <li><strong>Update</strong>: set each <M>{"\\mu_j"}</M> to the mean of the points assigned to it.</li>
        </ol>
      </Definition>

      <Theorem title="the mean is the best centre">
        <p>
          For points <M>{"x_1, \\dots, x_m"}</M>, the centre <M>c</M> minimising <M>{"\\sum_i \\lVert x_i - c \\rVert^2"}</M> is
          their mean <M>{"\\bar x"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"x_i - c = (x_i - \\bar x) + (\\bar x - c)"}</M> and expand:
        </p>
        <MD>{"\\sum_i \\lVert x_i - c \\rVert^2 = \\sum_i \\lVert x_i - \\bar x \\rVert^2 + 2(\\bar x - c)^\\top \\sum_i (x_i - \\bar x) + m\\lVert \\bar x - c \\rVert^2 ."}</MD>
        <p>
          The middle sum is zero by the definition of the mean, so the total is smallest, uniquely, when{" "}
          <M>{"c = \\bar x"}</M>.
        </p>
      </Proof>

      <Theorem title="Lloyd's algorithm terminates">
        <p>Each step of Lloyd&rsquo;s algorithm leaves <M>J</M> no larger, and the algorithm stops after finitely many steps.</p>
      </Theorem>
      <Proof>
        <p>
          The assign step gives each point its nearest centre, so no term of <M>J</M> grows. The update step moves each centre
          to the mean of its points, which by the previous theorem cannot increase that cluster&rsquo;s sum. There are only
          finitely many assignments of <M>n</M> points to <M>k</M> clusters. If ties are broken consistently, an assignment
          can recur only if <M>J</M> stayed the same, which is exactly when the algorithm has stopped; so no assignment is
          visited twice before stopping.
        </p>
      </Proof>

      <Example title="a run by hand">
        <p>
          Points 1, 2, 3, 10, 11, 12 on a line, with centres starting at 1 and 2. The first assignment puts 1 alone and the
          rest with the centre at 2, which moves to <M>{"(2 + 3 + 10 + 11 + 12)/5 = 7.6"}</M>. Now 2 and 3 are closer to 1 than to
          7.6, so the clusters become <M>{"\\{1, 2, 3\\}"}</M> and <M>{"\\{10, 11, 12\\}"}</M>, with centres 2 and 11, and{" "}
          <M>{"J = 4"}</M>. Nothing changes after that.
        </p>
      </Example>

      <Remark title="choosing k and starting well">
        <p>
          <M>J</M> always falls as <M>k</M> grows, reaching zero when every point is its own cluster, so <M>J</M> cannot pick{" "}
          <M>k</M> alone. Look for an <strong>elbow</strong> where extra clusters stop paying, or ask what the clusters are for.
          The <strong>k-means++</strong> rule chooses starting centres far apart, which avoids most bad local minima.
        </p>
      </Remark>

      <Remark title="what k-means assumes">
        <p>
          Because it uses squared Euclidean distance to a centre, k-means prefers round clusters of similar size, and depends
          on the units of each feature. It cannot find two interleaved moons. The same idea, replacing vectors by the nearest of{" "}
          <M>k</M> codewords, is called <strong>vector quantisation</strong>, and it compresses the embeddings that retrieval
          systems search.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "morek",
      rung: "check",
      prompt: <p>As <M>k</M> increases, what happens to the best achievable within-cluster sum of squares?</p>,
      answer: { kind: "choice", options: ["It never increases", "It first falls, then rises", "It stays the same"], correct: [0] },
    },
    {
      key: "global",
      rung: "check",
      prompt: <p>Does Lloyd&rsquo;s algorithm always find the clustering with the smallest possible <M>J</M>?</p>,
      answer: { kind: "choice", options: ["No, it can stop at a local minimum", "Yes, always"], correct: [0] },
    },
    {
      key: "update",
      rung: "apply",
      prompt: <p>Points 1, 2, 3, 10, 11, 12, centres starting at 1 and 2. After the first assign and update, where is the second centre?</p>,
      answer: { kind: "numeric", value: 7.6 },
    },
    {
      key: "finalj",
      rung: "apply",
      prompt: <p>When that run stops, what is <M>J</M>?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "cluster",
      rung: "apply",
      prompt: <p>A cluster holds <M>{"(2, 4), (4, 0), (6, 2)"}</M>. What is its sum of squared distances to its mean?</p>,
      answer: { kind: "numeric", value: 16 },
    },
    {
      key: "terminate",
      rung: "prove",
      prompt: <p>Prove that neither step of Lloyd&rsquo;s algorithm increases <M>J</M>, and deduce that the algorithm stops after finitely many steps.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Shows the assign step cannot increase J, because each point's term becomes its distance to the nearest centre.",
          "Shows, by expanding around the mean, that the mean minimises a cluster's sum of squared distances, so the update step cannot increase J.",
          "Notes there are finitely many assignments of n points to k clusters.",
          "Argues that while the algorithm continues J strictly decreases, or the assignment would repeat with no change, so no assignment recurs and it must stop.",
        ],
      },
    },
    {
      key: "best",
      rung: "stretch",
      prompt: <p>Points 0, 4, 6, 10 on a line, <M>{"k = 2"}</M>. What is the smallest possible <M>J</M>?</p>,
      answer: { kind: "numeric", value: 16 },
    },
  ],

  teachBack:
    "Explain to a friend the two steps of k-means, why the sum of squares never goes up, and why you should run it from several starting points.",

  glimpse: (
    <p>
      Next, clustering at every scale at once, with hierarchical clustering. Statistical Machine Learning reveals k-means as the
      limit of a Gaussian mixture model fitted by expectation-maximisation, which gives each point a probability of belonging
      to each cluster instead of a hard choice.
    </p>
  ),
};
