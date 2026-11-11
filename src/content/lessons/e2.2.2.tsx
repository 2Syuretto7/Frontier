import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ReverseListViz } from "@/components/viz/ReverseListViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.2.2",
  minutes: 60,
  links: {
    requires: ["e2.2.1"],
    revisits: ["e1.3.3"],
    foreshadows: ["e2.2.3", "e2.3.2", "e12.2.2"],
  },

  puzzle: (
    <>
      <p>
        A web server keeps the 10 000 most recently used pages in memory. Every request must look a page up, mark it as the most
        recently used, and, if the cache is full, throw away the least recently used page. With a million requests a second,
        each of those three steps has to be O(1). An array cannot move an item from the middle to the front in O(1). What can?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Give up on keeping items side by side in memory. Let each item live wherever it likes, and carry a pointer to the next
        one. To put an item somewhere else in the order, change a couple of pointers; nothing else moves. You lose random
        access, since reaching item k means following k pointers, but you gain O(1) splicing anywhere you already hold a
        pointer to. Reversing a list shows the style: three pointers walk along, turning one arrow round at a time.
      </p>
      <ReverseListViz />
    </>
  ),

  theory: (
    <>
      <Definition title="linked list">
        <p>
          A <strong>singly linked list</strong> is a chain of nodes, each holding a value and a reference <C>next</C> to the
          following node (None at the end); the list is given by its <strong>head</strong>. A <strong>doubly linked list</strong>{" "}
          also gives each node a <C>prev</C> reference.
        </p>
        <Code>{`class Node:
    def __init__(self, val, next=None):
        self.val, self.next = val, next`}</Code>
      </Definition>

      <Theorem title="costs">
        <ul>
          <li>Access to the k-th node, or search for a value: Θ(k) or Θ(n), following pointers.</li>
          <li>Insert or delete at the head: O(1).</li>
          <li>Insert after a node you hold: O(1). Delete a node you hold: O(1) if doubly linked; in a singly linked list you need its predecessor.</li>
          <li>Moving a node you hold to the front of a doubly linked list: O(1).</li>
        </ul>
      </Theorem>

      <Definition title="sentinels">
        <p>
          Code for doubly linked lists is full of special cases: the empty list, the first node, the last node. A{" "}
          <strong>sentinel</strong> removes them. Keep two dummy nodes, <C>head</C> and <C>tail</C>, that are always present,
          with real nodes between them. Every real node then has a real predecessor and successor, and insert and delete become
          four pointer assignments each with no <C>if</C>.
        </p>
        <Code>{`def unlink(node):
    node.prev.next = node.next
    node.next.prev = node.prev

def insert_after(where, node):
    node.prev, node.next = where, where.next
    where.next.prev = node
    where.next = node`}</Code>
      </Definition>

      <Example title="the LRU cache">
        <p>
          The puzzle&rsquo;s cache is a dict from key to node, plus a doubly linked list of nodes in order of use. A lookup goes
          through the dict in O(1); marking a node as recently used unlinks it and inserts it after the head sentinel in O(1);
          evicting removes the node before the tail sentinel in O(1) and deletes its key from the dict. Python&rsquo;s{" "}
          <C>functools.lru_cache</C> and <C>collections.OrderedDict</C> are built exactly this way.
        </p>
      </Example>

      <Theorem title="Floyd's cycle detection">
        <p>
          Suppose following <C>next</C> from the head enters a cycle of length λ after μ steps. Move a slow pointer one step at a
          time and a fast pointer two steps at a time. They meet after at most μ + λ steps, using O(1) memory.
        </p>
      </Theorem>
      <Proof>
        <p>
          After i steps the slow pointer is at position i and the fast at 2i. Once i ≥ μ both are on the cycle, and they coincide
          exactly when <M>{"2i \\equiv i \\pmod{\\lambda}"}</M>, that is when λ divides i. The first multiple of λ that is at least
          μ is less than μ + λ.
        </p>
      </Proof>

      <Remark title="why linked lists are rarer than textbooks suggest">
        <p>
          Each node is a separate allocation with pointer overhead, and walking a list jumps around memory, missing the cache at
          almost every step. A dynamic array is usually faster even for operations where the list wins asymptotically, unless the
          list is long and you really do hold pointers into its middle. Linked structures earn their place in caches, allocators,
          the free lists inside operating systems, and in the paged KV cache of an LLM server, which chains fixed-size blocks of
          memory together so that sequences can grow without copying.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "access",
      rung: "check",
      prompt: <p>What does it cost to read the k-th value of a singly linked list, starting from the head?</p>,
      answer: { kind: "choice", options: ["Θ(k)", "O(1)", "Θ(log k)", "Θ(n), whatever k is"], correct: [0] },
    },
    {
      key: "pointers",
      rung: "check",
      prompt: <p>Reversing a singly linked list of 5 nodes in place: how many <C>next</C> fields are reassigned?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "delete-held",
      rung: "apply",
      prompt: <p>You hold a reference to a node in the middle of a singly linked list, but not to its predecessor. How can you delete its value from the list in O(1)?</p>,
      answer: {
        kind: "choice",
        options: ["Copy the next node's value into it and unlink the next node", "It is impossible without walking from the head", "Set the node to None", "Swap it with the head"],
        correct: [0],
      },
    },
    {
      key: "floyd",
      rung: "apply",
      prompt: <p>Nodes 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 3, so μ = 3 and λ = 5. Slow moves one step, fast two, both from node 0. After how many steps do they first meet?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "practice",
      rung: "apply",
      prompt: <p>Summing a million numbers stored in a linked list is typically several times slower than summing them in an array, though both are Θ(n). Why?</p>,
      answer: { kind: "choice", options: ["Following pointers scatters reads across memory, missing the cache", "Linked lists need a comparison per node", "Python cannot add numbers stored in objects", "Linked lists are traversed twice"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`class Node:
    def __init__(self, val, next=None):
        self.val, self.next = val, next

def build(xs):
    head = None
    for x in reversed(xs):
        head = Node(x, head)
    return head

def show(h):
    out = []
    while h:
        out.append(h.val)
        h = h.next
    return out

def mystery(h):
    prev = None
    while h:
        h.next, prev, h = prev, h, h.next
    return prev

h = build([1, 2, 3, 4])
r = mystery(h)
print(show(r), show(h))`}</Code>
          <p>The right-hand side of a tuple assignment is evaluated first. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[4, 3, 2, 1] [1]", "[4, 3, 2, 1] [1, 2, 3, 4]", "[4, 3, 2, 1] []", "[1] [4, 3, 2, 1]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from collections import OrderedDict

class LRU:
    def __init__(self, cap):
        self.cap, self.d, self.misses = cap, OrderedDict(), 0

    def get(self, k):
        if k in self.d:
            self.d.move_to_end(k)
            return self.d[k]
        self.misses += 1
        self.d[k] = k * k
        if len(self.d) > self.cap:
            self.d.popitem(last=False)
        return self.d[k]

c = LRU(3)
for k in [1, 2, 3, 1, 4, 2, 5, 1, 2, 3]:
    c.get(k)
print(c.misses, list(c.d))`}</Code>
          <p>Trace the cache, least recently used first. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["8 [1, 2, 3]", "7 [1, 2, 3]", "8 [3, 2, 1]", "8 [2, 5, 3]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>LRUCache(capacity)</C> from scratch, without <C>OrderedDict</C>: a dict from key to node, and a doubly
            linked list of nodes (each with <C>key</C>, <C>value</C>, <C>prev</C>, <C>next</C>) between two sentinel nodes{" "}
            <C>self.head</C> and <C>self.tail</C>, most recently used first. Implement <C>get(key, default=None)</C> (a hit
            makes the key most recently used), <C>put(key, value)</C> (insert or update, making it most recent, then evict the
            least recently used if over capacity), <C>__len__</C> and <C>keys()</C> (most recent first). Every operation must be
            O(1) except <C>keys</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.d = {}

    def get(self, key, default=None):
        return self.d.get(key, default)

    def put(self, key, value):
        self.d[key] = value

    def __len__(self):
        return len(self.d)

    def keys(self):
        return list(self.d)
`,
        solution: `class _Node:
    __slots__ = ('key', 'value', 'prev', 'next')

    def __init__(self, key=None, value=None):
        self.key, self.value = key, value
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.map = {}
        self.head, self.tail = _Node(), _Node()
        self.head.next, self.tail.prev = self.tail, self.head

    def _unlink(self, node):
        node.prev.next = node.next
        node.next.prev = node.prev

    def _push_front(self, node):
        node.prev, node.next = self.head, self.head.next
        self.head.next.prev = node
        self.head.next = node

    def get(self, key, default=None):
        node = self.map.get(key)
        if node is None:
            return default
        self._unlink(node)
        self._push_front(node)
        return node.value

    def put(self, key, value):
        node = self.map.get(key)
        if node is not None:
            node.value = value
            self._unlink(node)
        else:
            node = _Node(key, value)
            self.map[key] = node
        self._push_front(node)
        if len(self.map) > self.capacity:
            lru = self.tail.prev
            self._unlink(lru)
            del self.map[lru.key]

    def __len__(self):
        return len(self.map)

    def keys(self):
        out, node = [], self.head.next
        while node is not self.tail:
            out.append(node.key)
            node = node.next
        return out
`,
        tests: [
          { name: "basic", code: `c = LRUCache(2)
c.put('a', 1); c.put('b', 2)
assert c.get('a') == 1 and c.keys() == ['a', 'b']
c.put('c', 3)
assert c.get('b') is None and c.get('b', -1) == -1 and c.keys() == ['c', 'a'], 'b was least recently used.'
c.put('a', 10)
assert c.get('a') == 10 and len(c) == 2 and c.keys() == ['a', 'c']` },
          { name: "linked structure", code: `c = LRUCache(3)
for k in 'wxyz':
    c.put(k, k.upper())
c.get('x')
walk, node = [], c.head.next
while node is not c.tail:
    assert node.next.prev is node, 'prev and next must agree.'
    walk.append(node.key)
    node = node.next
assert walk == ['x', 'z', 'y'] == c.keys(), 'Walk the list between the sentinels, most recent first.'` },
          { name: "random", code: `import random
from collections import OrderedDict
rng = random.Random(9)
c, ref = LRUCache(5), OrderedDict()
for i in range(5000):
    k = rng.randrange(12)
    if rng.random() < 0.5:
        got = c.get(k)
        want = ref.get(k)
        if k in ref:
            ref.move_to_end(k)
        assert got == want
    else:
        c.put(k, i)
        ref[k] = i; ref.move_to_end(k)
        if len(ref) > 5:
            ref.popitem(last=False)
    assert c.keys() == list(reversed(ref))` },
          { name: "constant time", code: `import time
c = LRUCache(50000)
t = time.time()
for i in range(150000):
    c.put(i, i)
    c.get(i // 2)
assert len(c) == 50000 and time.time() - t < 4, 'Each operation must be O(1).'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>With the <C>Node</C> class from the reading exercise (fields <C>val</C> and <C>next</C>), write:</p>
          <ul>
            <li>
              <C>find_cycle(head)</C>, returning <C>(mu, lam)</C> (steps from head to the first node on the cycle, and the cycle
              length) or <C>None</C> if the list ends, in O(1) extra memory: Floyd&rsquo;s meeting point, then a pointer from
              the head and one from the meeting point stepping together meet at the cycle&rsquo;s start;
            </li>
            <li>
              <C>merge(a, b)</C>, merging two sorted lists into one sorted list by relinking the existing nodes (no new nodes),
              taking from a on ties, and returning the new head.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class Node:
    def __init__(self, val, next=None):
        self.val, self.next = val, next

def find_cycle(head):
    return None

def merge(a, b):
    return a
`,
        solution: `class Node:
    def __init__(self, val, next=None):
        self.val, self.next = val, next

def find_cycle(head):
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow, fast = slow.next, fast.next.next
        if slow is fast:
            break
    else:
        return None
    mu, p = 0, head
    while p is not slow:
        p, slow = p.next, slow.next
        mu += 1
    lam, q = 1, p.next
    while q is not p:
        q = q.next
        lam += 1
    return (mu, lam)

def merge(a, b):
    dummy = tail = Node(None)
    while a is not None and b is not None:
        if b.val < a.val:
            tail.next, b = b, b.next
        else:
            tail.next, a = a, a.next
        tail = tail.next
    tail.next = a if a is not None else b
    return dummy.next
`,
        tests: [
          { name: "cycles", code: `def make(mu, lam):
    nodes = [Node(i) for i in range(mu + lam)]
    for x, y in zip(nodes, nodes[1:]):
        x.next = y
    if lam:
        nodes[-1].next = nodes[mu]
    return nodes[0] if nodes else None
for mu in range(0, 7):
    for lam in range(0, 9):
        if mu + lam:
            got = find_cycle(make(mu, lam))
            assert got == ((mu, lam) if lam else None), f'mu={mu}, lam={lam}: got {got}'
assert find_cycle(None) is None` },
          { name: "big cycle", code: `nodes = [Node(i) for i in range(200000)]
for x, y in zip(nodes, nodes[1:]):
    x.next = y
nodes[-1].next = nodes[12345]
assert find_cycle(nodes[0]) == (12345, 200000 - 12345)` },
          { name: "merge", code: `def build(xs):
    h = None
    for x in reversed(xs):
        h = Node(x, h)
    return h
def nodes(h):
    out = []
    while h:
        out.append(h)
        h = h.next
    return out
import random
rng = random.Random(1)
for _ in range(200):
    xs = sorted(rng.randint(0, 9) for _ in range(rng.randint(0, 8)))
    ys = sorted(rng.randint(0, 9) for _ in range(rng.randint(0, 8)))
    a, b = build(xs), build(ys)
    before = {id(n) for n in nodes(a) + nodes(b)}
    m = nodes(merge(a, b))
    assert [n.val for n in m] == sorted(xs + ys)
    assert {id(n) for n in m} == before, 'Relink the existing nodes; do not create new ones.'
a, b = build([1, 2]), build([1, 3])
first = a
assert merge(a, b) is first, 'On a tie, take from a first.'` },
        ],
      },
    },
    {
      key: "start",
      rung: "prove",
      prompt: (
        <p>
          In Floyd&rsquo;s algorithm, slow and fast first meet after i steps, where λ divides i and i ≥ μ. Prove that a pointer
          starting at the head and a pointer starting at the meeting point, both moving one step at a time, meet after exactly
          μ steps, at the start of the cycle.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "The meeting point is i − μ steps around the cycle from its start.",
          "After μ more steps the second pointer is i steps around from the start, which is the start itself because λ divides i.",
          "After μ steps the first pointer has just reached the start of the cycle.",
          "Neither pointer is at the start before step μ (the head pointer is still on the tail), so this is their first meeting on the cycle's start.",
        ],
      },
    },
    {
      key: "xor",
      rung: "stretch",
      prompt: (
        <p>
          Explain how to traverse a doubly linked list in both directions while storing only one link field per node, by storing
          the bitwise XOR of the previous and next node addresses. What do you need to start a traversal, and what do you lose?
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Stores link = addr(prev) XOR addr(next) in each node, with 0 for a missing neighbour.",
          "Knowing the previous address p and the current node, the next address is link XOR p, since p XOR p = 0.",
          "Starts from an end with p = 0, and traverses backwards by starting at the other end the same way.",
          "Loses the ability to step from a node given only a pointer to it, and it breaks garbage collectors and debuggers that follow pointers.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how an LRU cache gets O(1) lookups, updates and evictions by combining a dict with a doubly linked list.",

  glimpse: (
    <p>
      Stacks and queues come next, and either arrays or linked lists can carry them. Linked lists return as the chains of a hash
      table, the adjacency lists of graphs, and, in inference servers, as the paged KV cache that links fixed-size blocks so that
      many sequences can share a GPU&rsquo;s memory.
    </p>
  ),
};
