import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TreeInsertViz } from "@/components/viz/TreeInsertViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.4.2",
  minutes: 65,
  links: {
    requires: ["e2.4.1"],
    revisits: ["m4.2.2", "m0.4.3"],
    foreshadows: ["e3.4.2", "e3.4.3"],
  },

  puzzle: (
    <>
      <p>
        A trading system keeps open orders in a binary search tree keyed by price. Orders arrive with steadily rising prices, so
        each new key is the largest yet, and the tree becomes a path: every operation now costs O(n). You cannot control the
        order of arrival. Can the tree repair its own shape as it goes, cheaply enough that every operation stays O(log n) in
        the worst case?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A <strong>rotation</strong> rearranges three links so that a child moves up and its parent moves down, while keeping the
        in-order sequence of keys, and therefore the search property, intact. It costs O(1). A balanced tree keeps a cheap
        invariant that guarantees logarithmic height, checks it on the way back up after each insertion or deletion, and rotates
        where it is violated. AVL trees insist that at every node the two subtrees differ in height by at most one. Insert the
        sorted keys below and watch the rotations keep the height near log₂ n.
      </p>
      <TreeInsertViz balanced />
    </>
  ),

  theory: (
    <>
      <Definition title="rotations">
        <p>
          A <strong>right rotation</strong> at node y with left child x makes x the root of the subtree, y its right child, and
          x&rsquo;s old right subtree y&rsquo;s new left subtree. A <strong>left rotation</strong> is the mirror image. Both
          preserve the in-order sequence, because the subtree between x and y stays between them.
        </p>
        <Code>{`def rot_right(y):
    x = y.left
    y.left, x.right = x.right, y
    return x          # (after updating the heights of y, then x)`}</Code>
      </Definition>

      <Definition title="AVL tree">
        <p>
          An <strong>AVL tree</strong> is a BST in which, at every node, the heights of the left and right subtrees differ by at
          most 1. Each node stores its height. After an insertion or deletion, walk back up the search path recomputing heights;
          at the first node whose subtrees differ by 2:
        </p>
        <ul>
          <li>if the taller child leans the same way (left-left or right-right), one rotation at that node fixes it;</li>
          <li>if it leans the other way (left-right or right-left), first rotate the child, then the node: a double rotation.</li>
        </ul>
        <p>
          An insertion needs at most one single or double rotation; a deletion may need one at each level, O(log n) in all.
        </p>
      </Definition>

      <Theorem title="AVL trees are short">
        <p>An AVL tree with n nodes has height at most about <M>{"1.44 \\log_2 (n + 2)"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Let N(h) be the fewest nodes an AVL tree of height h can have. The sparsest such tree has a root, one subtree of height
          h − 1 and one of height h − 2, each as sparse as possible, so <M>{"N(h) = 1 + N(h-1) + N(h-2)"}</M> with N(0) = 1 and
          N(1) = 2. Then N(h) + 1 satisfies the Fibonacci recurrence, so <M>{"N(h) + 1 = F_{h+3} \\ge \\varphi^{h+1}"}</M> roughly,
          where <M>{"\\varphi = (1 + \\sqrt5)/2"}</M>. Hence <M>{"n \\ge \\varphi^{h+1} - 1"}</M>, giving{" "}
          <M>{"h \\le \\log_\\varphi(n + 1) \\approx 1.44 \\log_2 (n + 1)"}</M>.
        </p>
      </Proof>

      <Definition title="red-black trees">
        <p>
          A <strong>red-black tree</strong> colours each node red or black so that the root and the empty leaves are black, a red
          node has black children, and every path from a node down to an empty leaf passes the same number of black nodes. The
          longest path is at most twice the shortest, so the height is at most <M>{"2\\log_2(n + 1)"}</M>. They are slightly
          less balanced than AVL trees but need fewer rotations on updates, which is why C++&rsquo;s <C>std::map</C>,
          Java&rsquo;s <C>TreeMap</C> and the Linux scheduler use them.
        </p>
      </Definition>

      <Example title="treaps: balance by randomness">
        <p>
          A <strong>treap</strong> gives each key a random priority and keeps the tree a BST by key and a heap by priority. The
          shape is then exactly the BST you would get by inserting the keys in random order of priority, so the expected height
          is O(log n) whatever order the keys actually arrive in. Treaps are easy to write with two operations,{" "}
          <strong>split</strong> (into keys below k and the rest) and <strong>merge</strong> (of two treaps whose keys do not
          interleave).
        </p>
      </Example>

      <Remark title="B-trees: balance for disks">
        <p>
          When a tree lives on disk or SSD, each node visit is a slow block read, so it pays to make nodes wide. A{" "}
          <strong>B-tree</strong> node holds hundreds of sorted keys and has one more child than keys; all leaves are at the
          same depth, and nodes split or merge to stay between half full and full. With 500 children per node, four levels hold
          over 60 billion keys. Every relational database index and most file systems are B-trees or close relatives.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "invariant",
      rung: "check",
      prompt: <p>What does an AVL tree require at every node?</p>,
      answer: { kind: "choice", options: ["The heights of its two subtrees differ by at most 1", "Its two subtrees have the same number of nodes", "It has exactly two children", "Its key is the median of its subtree"], correct: [0] },
    },
    {
      key: "sparse",
      rung: "check",
      prompt: <p>What is the fewest nodes an AVL tree of height 3 can have?</p>,
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "three",
      rung: "apply",
      prompt: <p>Insert 1, 2, 3 in that order into an empty AVL tree. Which key ends up at the root?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "btree",
      rung: "apply",
      prompt: <p>Each node of a B-tree has 500 children. How many levels are needed for the leaves to hold a billion keys, if each leaf holds 500?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "redblack",
      rung: "apply",
      prompt: <p>Why is the height of a red-black tree at most about twice the shortest root-to-leaf path?</p>,
      answer: {
        kind: "choice",
        options: [
          "All paths have the same number of black nodes and no two reds are adjacent, so a path is at most half red",
          "Red nodes are always leaves",
          "Rotations happen at every insertion",
          "Every red node has two red children",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`class Node:
    def __init__(self, key):
        self.key, self.left, self.right, self.h = key, None, None, 1

def h(t):
    return t.h if t else 0

def fix(t):
    t.h = 1 + max(h(t.left), h(t.right))
    return t

def rot_right(t):
    l = t.left
    t.left, l.right = l.right, t
    fix(t)
    return fix(l)

def rot_left(t):
    r = t.right
    t.right, r.left = r.left, t
    fix(t)
    return fix(r)

def insert(t, k):
    if t is None:
        return Node(k)
    if k < t.key:
        t.left = insert(t.left, k)
    else:
        t.right = insert(t.right, k)
    fix(t)
    if h(t.left) - h(t.right) == 2:
        if k > t.left.key:
            t.left = rot_left(t.left)
        return rot_right(t)
    if h(t.right) - h(t.left) == 2:
        if k < t.right.key:
            t.right = rot_right(t.right)
        return rot_left(t)
    return t

def pre(t):
    return [] if t is None else [t.key] + pre(t.left) + pre(t.right)

root = None
for k in [10, 20, 30, 40, 50, 25]:
    root = insert(root, k)
print(pre(root), root.h - 1)`}</Code>
          <p>The last insertion needs a double rotation. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[30, 20, 10, 25, 40, 50] 2", "[20, 10, 40, 30, 25, 50] 3", "[30, 20, 10, 25, 40, 50] 3", "[25, 20, 10, 40, 30, 50] 2"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`rotations = 0

class Node:
    def __init__(self, key):
        self.key, self.left, self.right, self.h = key, None, None, 1

def h(t):
    return t.h if t else 0

def fix(t):
    t.h = 1 + max(h(t.left), h(t.right))
    return t

def rot_left(t):
    global rotations
    rotations += 1
    r = t.right
    t.right, r.left = r.left, t
    fix(t)
    return fix(r)

def insert_largest(t, k):          # k is larger than every key in t
    if t is None:
        return Node(k)
    t.right = insert_largest(t.right, k)
    fix(t)
    return rot_left(t) if h(t.right) - h(t.left) == 2 else t

for n in (7, 15, 100):
    rotations, root = 0, None
    for k in range(n):
        root = insert_largest(root, k)
    print(n, rotations, root.h - 1, end="; ")`}</Code>
          <p>Sorted insertion into an AVL tree. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["7 4 2; 15 11 3; 100 93 6;", "7 6 2; 15 14 3; 100 99 6;", "7 4 2; 15 11 3; 100 93 9;", "7 3 2; 15 7 3; 100 50 6;"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Build AVL insertion. The starter gives <C>Node</C> (with <C>key</C>, <C>left</C>, <C>right</C> and{" "}
            <C>height</C>, which is 0 for a leaf), <C>h(n)</C> (the height, −1 for <C>None</C>) and <C>update(n)</C>, which
            recomputes a node&rsquo;s height from its children. Write <C>rotate_right(y)</C> and <C>rotate_left(x)</C>, which
            return the new root of the rotated subtree with heights updated, and <C>insert(n, k)</C>, which inserts k into the
            subtree rooted at n (ignoring duplicates), rebalances on the way back up with a single or double rotation wherever
            the two children&rsquo;s heights differ by 2, and returns the new subtree root.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class Node:
    def __init__(self, key):
        self.key, self.left, self.right, self.height = key, None, None, 0

def h(n):
    return n.height if n else -1

def update(n):
    n.height = 1 + max(h(n.left), h(n.right))

def rotate_right(y):
    return y

def rotate_left(x):
    return x

def insert(n, k):
    if n is None:
        return Node(k)
    if k < n.key:
        n.left = insert(n.left, k)
    elif k > n.key:
        n.right = insert(n.right, k)
    update(n)
    return n
`,
        solution: `class Node:
    def __init__(self, key):
        self.key, self.left, self.right, self.height = key, None, None, 0

def h(n):
    return n.height if n else -1

def update(n):
    n.height = 1 + max(h(n.left), h(n.right))

def rotate_right(y):
    x = y.left
    y.left, x.right = x.right, y
    update(y)
    update(x)
    return x

def rotate_left(x):
    y = x.right
    x.right, y.left = y.left, x
    update(x)
    update(y)
    return y

def insert(n, k):
    if n is None:
        return Node(k)
    if k < n.key:
        n.left = insert(n.left, k)
    elif k > n.key:
        n.right = insert(n.right, k)
    else:
        return n
    update(n)
    if h(n.left) - h(n.right) > 1:
        if k > n.left.key:
            n.left = rotate_left(n.left)
        return rotate_right(n)
    if h(n.right) - h(n.left) > 1:
        if k < n.right.key:
            n.right = rotate_right(n.right)
        return rotate_left(n)
    return n
`,
        tests: [
          { name: "rotate", code: `a, b, c = Node(1), Node(2), Node(3)
c.left, b.left = b, a
update(b); update(c)
r = rotate_right(c)
assert r is b and r.left is a and r.right is c and r.height == 1 and c.height == 0, 'The left child comes up; heights are recomputed.'
r2 = rotate_left(r)
assert r2 is c and c.left is b and b.left is a and c.height == 2, 'rotate_left undoes rotate_right.'` },
          { name: "cases", code: `def keys(n):
    return [] if n is None else keys(n.left) + [n.key] + keys(n.right)
for order in ([1, 2, 3], [3, 2, 1], [1, 3, 2], [3, 1, 2]):
    t = None
    for k in order:
        t = insert(t, k)
    assert t.key == 2 and t.height == 1 and keys(t) == [1, 2, 3], f'{order}: every case ends balanced with 2 at the root.'` },
          { name: "balanced", code: `import math, random
def check(n):
    if n is None:
        return -1
    l, r = check(n.left), check(n.right)
    assert abs(l - r) <= 1 and n.height == 1 + max(l, r), 'Every node is balanced and knows its height.'
    return n.height
t = None
for k in range(2000):
    t = insert(t, k)
assert check(t) <= 1.45 * math.log2(2001), 'Sorted insertions still give a short tree.'
rng = random.Random(3)
t = None
for _ in range(2000):
    t = insert(t, rng.randrange(1000))
check(t)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Build a treap from two operations. The starter&rsquo;s <C>TNode(key, prio)</C> has <C>key</C>, <C>prio</C>,{" "}
            <C>left</C> and <C>right</C>; keys follow the BST order and priorities a max-heap order (a parent&rsquo;s priority
            is larger than its children&rsquo;s). Write <C>split(t, k)</C>, which returns two treaps (a, b): the keys less than
            k and the keys at least k. Write <C>merge(a, b)</C> for treaps where every key of a is below every key of b: the
            root with the larger priority stays on top. Then write <C>insert(t, node)</C> for a new key, by splitting at its key
            and merging the three pieces.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class TNode:
    def __init__(self, key, prio):
        self.key, self.prio, self.left, self.right = key, prio, None, None

def split(t, k):
    return None, t

def merge(a, b):
    return a or b

def insert(t, node):
    return t
`,
        solution: `class TNode:
    def __init__(self, key, prio):
        self.key, self.prio, self.left, self.right = key, prio, None, None

def split(t, k):
    if t is None:
        return None, None
    if t.key < k:
        a, b = split(t.right, k)
        t.right = a
        return t, b
    a, b = split(t.left, k)
    t.left = b
    return a, t

def merge(a, b):
    if a is None or b is None:
        return a or b
    if a.prio > b.prio:
        a.right = merge(a.right, b)
        return a
    b.left = merge(a, b.left)
    return b

def insert(t, node):
    a, b = split(t, node.key)
    return merge(merge(a, node), b)
`,
        tests: [
          { name: "split", code: `def keys(n):
    return [] if n is None else keys(n.left) + [n.key] + keys(n.right)
t = None
for k, p in [(5, 0.9), (2, 0.5), (8, 0.7), (1, 0.1), (3, 0.3), (9, 0.2)]:
    t = insert(t, TNode(k, p))
assert t.key == 5 and keys(t) == [1, 2, 3, 5, 8, 9], 'The highest priority is the root.'
a, b = split(t, 4)
assert keys(a) == [1, 2, 3] and keys(b) == [5, 8, 9], 'Keys below 4, and keys from 4 up.'
a, b = split(merge(a, b), 5)
assert keys(a) == [1, 2, 3] and keys(b) == [5, 8, 9], 'A key equal to k goes right.'` },
          { name: "heap order", code: `import random
def check(n):
    if n is None:
        return 0
    for c in (n.left, n.right):
        assert c is None or c.prio < n.prio, 'Parents have larger priorities.'
    assert n.left is None or n.left.key < n.key
    assert n.right is None or n.right.key > n.key
    return 1 + max(check(n.left), check(n.right))
rng = random.Random(1)
t = None
for k in rng.sample(range(10000), 3000):
    t = insert(t, TNode(k, rng.random()))
assert check(t) < 60
t = None
for k in range(3000):
    t = insert(t, TNode(k, rng.random()))
assert check(t) < 60, 'Random priorities keep even sorted insertions shallow.'` },
        ],
      },
    },
    {
      key: "avl-height",
      rung: "prove",
      prompt: <p>Let N(h) be the minimum number of nodes in an AVL tree of height h. Prove that N(h) = N(h − 1) + N(h − 2) + 1, and deduce that the height of an AVL tree with n nodes is O(log n).</p>,
      answer: {
        kind: "written",
        rubric: [
          "A tree of height h has a subtree of height h − 1; by the AVL condition the other has height at least h − 2.",
          "A minimal tree uses minimal subtrees of heights exactly h − 1 and h − 2, giving the recurrence (and both bounds).",
          "Shows N(h) + 1 follows the Fibonacci recurrence, so N(h) grows like φ^h, e.g. N(h) ≥ φ^h by induction.",
          "Concludes n ≥ N(h) ≥ φ^h, so h ≤ log_φ n ≈ 1.44 log₂ n.",
        ],
      },
    },
    {
      key: "rb-height",
      rung: "stretch",
      prompt: <p>Prove that a red-black tree with n internal nodes has height at most 2 log₂(n + 1).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Defines the black-height bh(x): the number of black nodes on any path from x down to an empty leaf, not counting x.",
          "Proves by induction on height that the subtree at x contains at least 2^{bh(x)} − 1 internal nodes.",
          "Since a red node has black children, at least half the nodes on any root-to-leaf path are black, so bh(root) ≥ h/2.",
          "Combines: n ≥ 2^{h/2} − 1, so h ≤ 2 log₂(n + 1).",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend what a rotation does and why it keeps a tree a valid search tree, and how AVL trees use rotations to keep their height logarithmic.",

  glimpse: (
    <p>
      Balanced trees are the ordered maps of most standard libraries and the indexes of databases and file systems; Computer
      Systems meets B-trees again in file systems, and red-black trees in the Linux scheduler. Python has no balanced tree in its
      standard library; the popular <C>sortedcontainers</C> package gets the same bounds in practice from a list of short sorted
      lists, a reminder that constants and caches matter.
    </p>
  ),
};
