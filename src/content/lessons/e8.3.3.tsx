import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ConsistentHashViz } from "@/components/viz/ConsistentHashViz";
import type { LessonContent } from "@/lib/types";

const RING = `def build_ring(nodes, vnodes, hash_fn):
    return sorted((hash_fn(f'{n}#{v}'), n) for n in nodes for v in range(vnodes))

def lookup(ring, key_hash):
    for pos, node in ring:
        if pos >= key_hash:
            return node
    return ring[0][1]

def replicas(ring, key_hash, r):
    start = next((i for i, (pos, _) in enumerate(ring) if pos >= key_hash), 0)
    out = []
    for k in range(len(ring)):
        node = ring[(start + k) % len(ring)][1]
        if node not in out:
            out.append(node)
            if len(out) == r:
                break
    return out`;

const DURABILITY = `import math

def quorum_consistent(n, r, w):
    return r + w > n

def erasure_overhead(k, m):
    return (k + m) / k

def p_loss(n, tolerated, p_fail):
    return sum(math.comb(n, j) * p_fail ** j * (1 - p_fail) ** (n - j) for j in range(tolerated + 1, n + 1))`;

export const lesson: LessonContent = {
  id: "e8.3.3",
  minutes: 50,
  links: {
    requires: ["e8.3.2"],
    revisits: ["e3.4.3", "e8.3.1"],
    foreshadows: ["e8.4.3"],
  },

  puzzle: (
    <>
      <p>
        A training corpus of several petabytes must be spread over hundreds of storage servers, so that every key can be
        found without asking a central directory. Disks fail every day, so no byte may live in only one place, yet keeping
        three full copies triples the cost. And when a server is added, as little data as possible should have to move. How
        do distributed storage systems meet all three demands?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        To place data, hash each key to a point on a circle and give each server several points too; a key belongs to the
        first server point after it. Adding a server then takes over only the arcs just before its points, so only those keys
        move. To survive failures, store each key on the next few servers around the circle, or split it into fragments with
        extra parity fragments, so that any sufficiently large subset can rebuild it. And to read the latest value despite
        failures, make reads and writes each contact enough replicas that every read overlaps every write.
      </p>
      <ConsistentHashViz />
    </>
  ),

  theory: (
    <>
      <Definition title="partitioning by hash">
        <p>
          A storage system splits its keys over servers by a hash of the key, which spreads them evenly whatever their
          structure. The simplest rule, server = hash mod N, is evenly balanced but fragile: changing N moves almost every key.{" "}
          <em>Consistent hashing</em> (Karger et al., 1997) places each server at several pseudo-random points on a ring of hash
          values, its <em>virtual nodes</em>, and assigns each key to the first point at or after the key&apos;s hash, wrapping
          around (<C>build_ring</C>, <C>lookup</C>). Replicas go to the next distinct servers around the ring (<C>replicas</C>).
        </p>
        <Code>{RING}</Code>
      </Definition>

      <Theorem title="how many keys move">
        <p>
          For hashes uniform on <M>{"\\{0, \\dots, N(N+1) - 1\\}"}</M>, changing from hash mod N to hash mod (N + 1) moves a
          fraction N/(N + 1) of the keys. With consistent hashing, adding a server moves only the keys that the new server takes
          over, an expected fraction 1/(N + 1) when the points are placed uniformly at random.
        </p>
      </Theorem>
      <Proof>
        <p>
          A key with hash h &lt; N has h mod N = h mod (N + 1) = h and stays. If h ≥ N and both remainders equalled some t &lt; N,
          then h − t would be divisible by both N and N + 1, which are coprime, so by N(N + 1); but{" "}
          <M>{"0 < h - t < N(N+1)"}</M>, a contradiction. So exactly N of the N(N + 1) hashes stay, a fraction 1/(N + 1), and the
          rest move. With consistent hashing a key changes server only if one of the new server&apos;s points falls between the
          key&apos;s hash and its old successor, so it moves to the new server; by symmetry each of the N + 1 servers&apos; points
          are equally likely to be the successor of a key, so the new server receives an expected 1/(N + 1) of the keys.
        </p>
      </Proof>

      <Definition title="replication and quorums">
        <p>
          With N replicas of each key, a write is acknowledged once W replicas have stored it and a read asks R replicas,
          returning the value with the newest version (Dynamo, DeCandia et al., 2007). Choosing R and W trades latency against
          consistency: <C>quorum_consistent</C> checks the condition of the next theorem.
        </p>
      </Definition>

      <Theorem title="overlapping quorums">
        <p>If R + W &gt; N, every read quorum shares a replica with every write quorum, so a read returns the latest acknowledged write.</p>
      </Theorem>
      <Proof>
        <p>
          A read set of R replicas and a write set of W replicas, drawn from N, would need R + W &gt; N distinct members if they
          were disjoint, which is impossible. The shared replica holds the latest acknowledged write, and the read keeps the
          newest version among its replies. With R + W ≤ N, a read can contact only replicas that missed the last write.
        </p>
      </Proof>

      <Definition title="erasure coding">
        <p>
          A Reed–Solomon code RS(k, m) splits an object into k data fragments and computes m parity fragments such that any k of
          the k + m fragments rebuild it. It stores (k + m)/k times the data (<C>erasure_overhead</C>) and survives the loss of
          any m fragments; three-way replication stores 3 times the data and survives 2 losses. If fragments are lost
          independently with probability q, data is lost when more than m of the k + m are (<C>p_loss</C>). The price is repair:
          rebuilding one lost fragment reads k others.
        </p>
        <Code>{DURABILITY}</Code>
      </Definition>

      <Remark title="storage for machine learning">
        <p>
          Training reads data in large sequential streams and writes checkpoints in bursts of terabytes, every server at once.
          Clusters therefore pair parallel file systems such as Lustre, which stripe each file over many servers so that
          thousands of clients can read and write it at full bandwidth, with object stores (e8.4.3) that use erasure coding to
          keep petabytes cheaply and durably. Consistency is usually relaxed: a checkpoint is written to a new path and becomes
          visible only once complete, so readers never see a half-written file.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "mod",
      rung: "check",
      prompt: <p>Keys are placed by hash mod N. What fraction of them moves when the number of servers grows from 9 to 10?</p>,
      answer: { kind: "numeric", value: 0.9, tolerance: 0.0001 },
    },
    {
      key: "raw",
      rung: "check",
      prompt: <p>How many terabytes of raw disk does storing 600 TB of data with an RS(12, 4) erasure code require?</p>,
      answer: { kind: "numeric", value: 800, tolerance: 0.001 },
    },
    {
      key: "quorum",
      rung: "apply",
      prompt: <p>Each key has 5 replicas. Which choice of read quorum R and write quorum W guarantees that every read sees the latest acknowledged write?</p>,
      answer: {
        kind: "choice",
        options: ["R = 3 and W = 3", "R = 2 and W = 3", "R = 1 and W = 4", "R = 2 and W = 2"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def build_ring(nodes, vnodes, hash_fn):
    return sorted((hash_fn(f'{n}#{v}'), n) for n in nodes for v in range(vnodes))

def lookup(ring, key_hash):
    for pos, node in ring:
        if pos >= key_hash:
            return node
    return ring[0][1]

def replicas(ring, key_hash, r):
    start = next((i for i, (pos, _) in enumerate(ring) if pos >= key_hash), 0)
    out = []
    for k in range(len(ring)):
        node = ring[(start + k) % len(ring)][1]
        if node not in out:
            out.append(node)
            if len(out) == r:
                break
    return out

ring = build_ring(['a', 'b'], 2, lambda s: {'a#0': 10, 'a#1': 60, 'b#0': 30, 'b#1': 90}[s]); print(ring, [lookup(ring, k) for k in (5, 10, 11, 75, 95)])
print(replicas(ring, 35, 2), replicas(ring, 95, 3), replicas(build_ring(['x', 'y', 'z'], 1, lambda s: ord(s[0])), 120, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(10, 'a'), (30, 'b'), (60, 'a'), (90, 'b')] ['a', 'a', 'b', 'b', 'a']\n['a', 'b'] ['a', 'b'] ['x', 'y']",
          "[(10, 'a'), (30, 'b'), (60, 'a'), (90, 'b')] ['a', 'b', 'b', 'b', 'a']\n['a', 'b'] ['a', 'b'] ['x', 'y']",
          "[(10, 'a'), (30, 'b'), (60, 'a'), (90, 'b')] ['a', 'a', 'b', 'b', 'b']\n['a', 'b'] ['b', 'a'] ['x', 'y']",
          "[(10, 'a'), (60, 'a'), (30, 'b'), (90, 'b')] ['a', 'a', 'b', 'b', 'a']\n['a', 'b'] ['a', 'b', 'a'] ['x', 'y']",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def quorum_consistent(n, r, w):
    return r + w > n

def erasure_overhead(k, m):
    return (k + m) / k

def p_loss(n, tolerated, p_fail):
    return sum(math.comb(n, j) * p_fail ** j * (1 - p_fail) ** (n - j) for j in range(tolerated + 1, n + 1))

print(quorum_consistent(3, 2, 2), quorum_consistent(3, 1, 2), quorum_consistent(5, 1, 5), erasure_overhead(10, 4))
print(round(p_loss(3, 2, 0.1), 6), round(p_loss(14, 4, 0.1), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True False True 1.4\n0.001 0.00923",
          "True True True 1.4\n0.001 0.00923",
          "True False True 0.7142857142857143\n0.001 0.00923",
          "True False True 1.4\n0.028 0.00923",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>build_ring(nodes, vnodes, hash_fn)</C>, the sorted list of <C>(hash_fn(f&apos;&#123;n&#125;#&#123;v&#125;&apos;), n)</C>{" "}
          for every node n and v in <C>range(vnodes)</C>; <C>lookup(ring, key_hash)</C>, the node of the first point at or after
          the hash, wrapping around; and <C>replicas(ring, key_hash, r)</C>, the first r distinct nodes from there onwards.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def build_ring(nodes, vnodes, hash_fn):
    return []

def lookup(ring, key_hash):
    return ring[0][1]

def replicas(ring, key_hash, r):
    return [lookup(ring, key_hash)]
`,
        solution: RING,
        tests: [
          { name: "ring", code: `H = {'p#0': 50, 'p#1': 400, 'q#0': 120, 'q#1': 700, 'r#0': 300, 'r#1': 900}
ring = build_ring(['p', 'q', 'r'], 2, H.__getitem__)
assert ring == [(50, 'p'), (120, 'q'), (300, 'r'), (400, 'p'), (700, 'q'), (900, 'r')]
assert [lookup(ring, k) for k in (0, 50, 51, 350, 901)] == ['p', 'p', 'q', 'p', 'p']
assert build_ring(['n'], 3, lambda s: 10 - int(s[-1])) == [(8, 'n'), (9, 'n'), (10, 'n')]` },
          { name: "replicas", code: `H = {'p#0': 50, 'p#1': 400, 'q#0': 120, 'q#1': 700, 'r#0': 300, 'r#1': 900}
ring = build_ring(['p', 'q', 'r'], 2, H.__getitem__)
assert replicas(ring, 301, 3) == ['p', 'q', 'r'] and replicas(ring, 950, 2) == ['p', 'q'] and replicas(ring, 130, 1) == ['r']
assert replicas([(5, 'a')], 9, 3) == ['a'] and replicas(ring, 700, 2) == ['q', 'r']` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>quorum_consistent(n, r, w)</C>, <C>erasure_overhead(k, m)</C> and <C>p_loss(n, tolerated, p_fail)</C>, the
          probability that more than <C>tolerated</C> of n independent fragments are lost.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def quorum_consistent(n, r, w):
    return True

def erasure_overhead(k, m):
    return 1.0

def p_loss(n, tolerated, p_fail):
    return 0.0
`,
        solution: DURABILITY,
        tests: [
          { name: "quorum and overhead", code: `assert quorum_consistent(4, 2, 2) is False and quorum_consistent(4, 2, 3) is True and abs(erasure_overhead(6, 3) - 1.5) < 1e-12
assert quorum_consistent(1, 1, 1) is True and abs(erasure_overhead(4, 0) - 1) < 1e-12` },
          { name: "loss", code: `assert abs(p_loss(1, 0, 0.3) - 0.3) < 1e-12 and abs(p_loss(4, 1, 0.5) - 0.6875) < 1e-12 and p_loss(2, 2, 0.9) == 0` },
        ],
      },
    },
    {
      key: "rs",
      rung: "stretch",
      prompt: (
        <p>
          An object is stored with RS(6, 3), and each of its 9 fragments is lost independently with probability 0.05. What is
          the probability that the object is lost, in units of 10⁻⁴? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 6.43, tolerance: 0.005 },
    },
  ],

  glimpse: (
    <>
      <p>
        With data spread over many servers, the computation should go to the data rather than the other way round. The next
        part begins with map-reduce, the model that made processing petabytes on unreliable machines routine.
      </p>
    </>
  ),
};
