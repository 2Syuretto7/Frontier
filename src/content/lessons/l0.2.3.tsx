import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { KMeansViz } from "@/components/viz/KMeansViz";
import { C, Code } from "@/components/lesson/Code";
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
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`pts = [1, 2, 3, 10, 11, 12]
centres = [2, 11]
labels = [min(range(2), key=lambda k: abs(p - centres[k])) for p in pts]
print(labels)`}</Code>
          <p>Clustering assigns each point to its nearest centre. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0, 0, 0, 1, 1, 1]", "[0, 1, 0, 1, 0, 1]", "[1, 1, 1, 0, 0, 0]", "[0, 0, 1, 1, 1, 1]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`xs = [1, 2, 3, 10, 11, 30]
cs = [0, 12]
groups = {c: [x for x in xs if min(cs, key=lambda c2: abs(x - c2)) == c] for c in cs}
print(groups, [sum(g) / len(g) for g in groups.values()])`}</Code>
          <p>One assignment step and one update step of k-means. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["{0: [1, 2, 3], 12: [10, 11, 30]} [2.0, 17.0]", "{0: [1, 2, 3, 10], 12: [11, 30]} [4.0, 20.5]", "{0: [1, 2, 3], 12: [10, 11]} [2.0, 10.5]", "{0: [1, 2, 3], 12: [10, 11, 30]} [2.0, 12.0]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>kmeans_1d(xs, centres, steps)</C>, which runs k-means on numbers: assign each x to its nearest centre, move each centre to the mean of its points (leave it if it has none), and repeat <C>steps</C> times. Return the sorted list of centres.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def kmeans_1d(xs, centres, steps):
    return sorted(centres)
`,
        solution: `def kmeans_1d(xs, centres, steps):
    c = list(centres)
    for _ in range(steps):
        groups = [[] for _ in c]
        for x in xs:
            k = min(range(len(c)), key=lambda i: abs(x - c[i]))
            groups[k].append(x)
        c = [sum(g) / len(g) if g else c[i] for i, g in enumerate(groups)]
    return sorted(c)
`,
        tests: [
          { name: "two groups", code: `c = kmeans_1d([1, 2, 3, 10, 11, 12], [0, 5], 10)
assert abs(c[0] - 2) < 1e-9 and abs(c[1] - 11) < 1e-9, 'Each centre should settle at the mean of its group.'` },
          { name: "empty cluster", code: `c = kmeans_1d([1, 2, 3], [2, 100], 3)
assert abs(c[0] - 2) < 1e-9 and c[1] == 100, 'A centre with no points stays where it is.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>kmeans(points, centres, steps)</C> for points in the plane given as (x, y) tuples: alternate assigning each point to its nearest centre (the lowest index on ties) and moving each centre to the mean of its points (a centre with no points stays where it is), for at most <C>steps</C> rounds or until the labels stop changing. Return (centres, labels) with centres as a list of (x, y) tuples. Then write <C>inertia(points, centres, labels)</C>, the sum of squared distances from points to their centres.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def kmeans(points, centres, steps):
    return list(centres), [0] * len(points)

def inertia(points, centres, labels):
    return 0.0
`,
        solution: `def _d2(p, c):
    return (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2

def kmeans(points, centres, steps):
    centres = [tuple(c) for c in centres]
    labels = None
    for _ in range(steps):
        new = [min(range(len(centres)), key=lambda j: _d2(p, centres[j])) for p in points]
        if new == labels:
            break
        labels = new
        for j in range(len(centres)):
            mine = [p for p, l in zip(points, labels) if l == j]
            if mine:
                centres[j] = (sum(p[0] for p in mine) / len(mine), sum(p[1] for p in mine) / len(mine))
    return centres, labels

def inertia(points, centres, labels):
    return sum(_d2(p, centres[l]) for p, l in zip(points, labels))
`,
        tests: [
          { name: "blobs", code: `pts = [(0, 0), (0, 1), (1, 0), (10, 10), (10, 11), (11, 10)]
cs, labels = kmeans(pts, [(0, 0), (1, 0)], 20)
assert labels in ([0, 0, 0, 1, 1, 1], [1, 1, 1, 0, 0, 0]) and sorted(cs) == [(1 / 3, 1 / 3), (31 / 3, 31 / 3)], 'Two clusters, centres at the means.'` },
          { name: "inertia", code: `pts = [(0, 0), (2, 0), (10, 0)]
assert inertia(pts, [(1, 0), (10, 0)], [0, 0, 1]) == 2 and inertia(pts, [(4, 0)], [0, 0, 0]) == 16 + 4 + 36` },
          { name: "empty", code: `pts = [(0, 0), (1, 0)]
cs, labels = kmeans(pts, [(0, 0), (100, 100)], 5)
assert cs[1] == (100, 100) and labels == [0, 0] and cs[0] == (0.5, 0), 'A centre with no points stays put.'` },
          { name: "monotone", code: `import random
random.seed(1)
pts = [(random.gauss(cx, 1), random.gauss(cy, 1)) for cx, cy in [(0, 0), (6, 0), (3, 5)] for _ in range(30)]
init = pts[:3]
prev = float('inf')
for s in range(1, 8):
    cs, labels = kmeans(pts, init, s)
    J = inertia(pts, cs, labels)
    assert J <= prev + 1e-9, 'Each round of k-means can only lower the inertia.'
    prev = J` },
        ],
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
