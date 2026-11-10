import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { KMeansViz } from "@/components/viz/KMeansViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l0.2.3",
  minutes: 45,
  links: {
    parallels: ["m0.6.1"],
    foreshadows: ["l1.6.1", "l1.6.2", "l2.5.1"],
  },

  puzzle: (
    <>
      <p>
        A shop has a year of purchase records for 50,000 customers and no other information about them. The manager asks:
        &ldquo;What kinds of customers do we have?&rdquo;
      </p>
      <p>
        Nobody has labelled any customer as any kind. Is there any way to answer? And if two analysts each find a different
        set of &ldquo;kinds&rdquo;, how could you say which one is right?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Describe each customer by a few numbers, such as how often they visit and how much they spend, and each becomes a
        point. If the points fall into separate clumps, the clumps are natural groups, even though nobody named them. Finding
        such groups without labels is <strong>clustering</strong>.
      </p>
      <p>
        The best-known method, <strong>k-means</strong>, alternates two simple steps. Place <em>k</em> centres anywhere.
        Give every point to its nearest centre. Move every centre to the middle of its points. Repeat. Try it below,
        starting from a deliberately bad position.
      </p>
      <KMeansViz />
      <p>
        With <em>k</em> = 3 the centres find the three clumps in a few rounds. With <em>k</em> = 2 or 4 the algorithm still
        finishes and still reports groups, because it always does what it is told. Whether the groups mean anything is a
        question the algorithm cannot answer.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="unsupervised learning">
        <p>
          In <strong>unsupervised learning</strong> the data have no labels: only inputs. The aim is to find structure in
          them, such as groups, directions of variation, or unusual points.
        </p>
      </Definition>

      <Definition title="k-means">
        <p>Given points and a number <em>k</em>, choose <em>k</em> starting centres, then repeat until nothing changes:</p>
        <ol>
          <li><strong>Assign:</strong> give each point to its nearest centre.</li>
          <li><strong>Update:</strong> move each centre to the mean of the points assigned to it.</li>
        </ol>
        <p>
          The result is <em>k</em> clusters. The quantity being made small is the total squared distance from each point to
          its centre.
        </p>
      </Definition>

      <p>
        Why does it stop? Each assign step can only lower the total squared distance, since each point moves to a nearer
        centre or stays. Each update step can only lower it too, since the mean is the point with the smallest total squared
        distance to a set of points, as the lesson on averages showed in one dimension. The total keeps falling, there are
        only finitely many ways to split the points into groups, so eventually nothing changes.
      </p>

      <Example title="a stuck answer">
        <p>
          k-means finds a point where neither step helps, but not always the best clustering. Start two centres inside the
          same real clump and the third between the other two clumps, and it can settle with one clump split in half and two
          clumps merged. The usual remedy is simple: run it many times from different random starts and keep the result with
          the smallest total distance.
        </p>
      </Example>

      <Remark title="no right answer to check">
        <p>
          With labelled data, a test set tells you how good a model is. With clustering there is nothing to compare against.
          The total distance always falls as <em>k</em> grows, reaching zero when every point is its own cluster, so it cannot
          choose <em>k</em> for you. Clusters are judged by whether they are stable when the data change a little, and by
          whether they are useful to the people who will act on them.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "unsup",
      rung: "check",
      prompt: <p>Select every task that is unsupervised.</p>,
      answer: {
        kind: "choice",
        options: ["Grouping news articles by topic with no topic labels", "Predicting house prices from past sales", "Finding unusual transactions in data with no fraud labels", "Classifying photos as cat or dog from labelled photos"],
        correct: [0, 2],
      },
    },
    {
      key: "centre",
      rung: "check",
      prompt: <p>A cluster contains the points (1, 2), (3, 4) and (5, 3). Where does the update step move its centre? Give the first coordinate.</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "assign",
      rung: "apply",
      prompt: <p>Centres are at (0, 0) and (6, 0). To which centre is the point (2, 3) assigned?</p>,
      answer: { kind: "choice", options: ["(0, 0)", "(6, 0)", "Neither: it is exactly halfway"], correct: [0] },
    },
    {
      key: "one-d",
      rung: "apply",
      prompt: (
        <p>
          On a number line, points are at 1, 2, 3, 10, 11, 12, with centres starting at 2 and 3. After one assign step and
          one update step, where is the second centre?
        </p>
      ),
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "choose-k",
      rung: "apply",
      prompt: <p>Why can you not choose k by picking the value that gives the smallest total squared distance?</p>,
      answer: {
        kind: "choice",
        options: ["Because the total always falls as k grows, reaching zero when every point has its own centre", "Because k-means does not compute distances", "Because the total is the same for every k"],
        correct: [0],
      },
    },
    {
      key: "stops",
      rung: "prove",
      prompt: (
        <p>Explain why k-means must stop after finitely many rounds, whatever the starting centres.</p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Identifies the total squared distance from points to their assigned centres as the quantity tracked.",
          "Explains that the assign step cannot increase it, because each point moves only to a centre at least as close.",
          "Explains that the update step cannot increase it, because the mean minimises the total squared distance to a set of points.",
          "Notes there are finitely many ways to assign points to k clusters, so the total cannot keep strictly falling for ever, and the algorithm stops.",
        ],
      },
    },
    {
      key: "continue",
      rung: "stretch",
      prompt: <p>Continue the number line example (points 1, 2, 3, 10, 11, 12, centres starting at 2 and 3) until it stops. Where does the first centre end up?</p>,
      answer: { kind: "numeric", value: 2 },
    },
  ],

  teachBack:
    "Explain to a friend how k-means finds groups in data that nobody labelled, using customers in a shop, and why it cannot tell you how many groups there really are.",

  glimpse: (
    <p>
      Next, generation, where a model produces new data rather than labelling old data. In Introduction to Machine Learning
      you will meet k-means again alongside hierarchical clustering, and in Statistical Machine Learning a softer version in
      which each point belongs partly to every cluster, the Gaussian mixture model.
    </p>
  ),
};
