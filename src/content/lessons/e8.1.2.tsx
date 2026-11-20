import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MessageRingViz } from "@/components/viz/MessageRingViz";
import type { LessonContent } from "@/lib/types";

const RENDEZVOUS = `def simulate(programs):
    pc = [0] * len(programs)
    rounds = 0
    while True:
        sends = [(i, p[pc[i]][1]) for i, p in enumerate(programs) if pc[i] < len(p) and p[pc[i]][0] == 'send']
        pairs = [(i, j) for i, j in sends if pc[j] < len(programs[j]) and programs[j][pc[j]] == ('recv', i)]
        if not pairs:
            return rounds, all(pc[i] == len(p) for i, p in enumerate(programs))
        for i, j in pairs:
            pc[i] += 1
            pc[j] += 1
        rounds += 1

def ring_programs(p, safe):
    progs = []
    for r in range(p):
        send, recv = ('send', (r + 1) % p), ('recv', (r - 1) % p)
        progs.append([recv, send] if safe and r % 2 else [send, recv])
    return progs`;

const MATCHING = `def deliver(messages, recvs):
    pending, out = list(messages), []
    for src, tag in recvs:
        for k, (s, t, x) in enumerate(pending):
            if (src is None or s == src) and (tag is None or t == tag):
                out.append(x)
                del pending[k]
                break
        else:
            out.append(None)
    return out

def message_time(nbytes, alpha, beta):
    return alpha + nbytes / beta

def step_time(t_comp, t_comm, nonblocking):
    return max(t_comp, t_comm) if nonblocking else t_comp + t_comm`;

export const lesson: LessonContent = {
  id: "e8.1.2",
  minutes: 45,
  links: {
    requires: ["e8.1.1"],
    revisits: ["e3.6.1", "e3.5.1"],
    foreshadows: ["e8.2.1", "e8.2.5"],
  },

  puzzle: (
    <>
      <p>
        Four processes stand in a ring. Each must pass a value to its right-hand neighbour and take one from its left. The
        obvious program, &quot;send, then receive&quot;, works when tested with small values and hangs forever when the values
        are large. Nothing in the program changed except the size of the data. Why?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A send and a receive are two halves of one transfer, and a blocking call waits for its other half. If every process
        waits in a send for a partner that is itself waiting in a send, nobody ever reaches a receive: a cycle of waiting, which
        is a deadlock. Small messages escape because the library copies them into a buffer and lets the send return at once;
        large ones do not fit, so the send waits for the receiver, and the hidden cycle appears. Correct programs order their
        sends and receives so that no such cycle can form, or use non-blocking calls that never wait at all.
      </p>
      <MessageRingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="point-to-point messages">
        <p>
          A send names a destination rank, a tag and a buffer of data; a receive names a source and a tag, either of which may
          be a wildcard, and a buffer to fill. A receive takes the earliest pending message that matches, and messages between
          one pair of ranks are not overtaken, so they arrive in the order sent. <C>deliver</C> below models this matching,
          with <C>None</C> as the wildcard.
        </p>
      </Definition>

      <Definition title="blocking, synchronous and buffered sends">
        <p>
          A <em>blocking</em> call returns only when its buffer may be reused. A <em>synchronous</em> send (a rendezvous) returns
          only once the matching receive has started, so it couples the two processes. A <em>buffered</em> send copies the data
          and returns at once. Libraries such as MPI use buffering for small messages and the rendezvous protocol for large ones,
          which is why a program can work on small inputs and deadlock on large ones. <C>simulate</C> runs programs of{" "}
          <C>(&apos;send&apos;, dst)</C> and <C>(&apos;recv&apos;, src)</C> operations with synchronous sends, one round at a time,
          and returns the number of rounds and whether every program finished; <C>ring_programs</C> builds the ring shift,
          naively or ordered by parity.
        </p>
        <Code>{RENDEZVOUS}</Code>
      </Definition>

      <Theorem title="ordering the ring shift">
        <p>
          With synchronous sends, the ring shift in which every rank sends before it receives deadlocks for every p ≥ 2. If even
          ranks send first and odd ranks receive first, it finishes in 2 rounds when p is even and in 3 rounds when p is odd
          and at least 3.
        </p>
      </Theorem>
      <Proof>
        <p>
          In the naive order every rank&apos;s first operation is a send, and a send needs its destination to be at a receive, so
          no pair can ever match. In the parity order with p even, in round 1 every even rank r sends to the odd rank r + 1,
          which is waiting to receive from r; in round 2 every odd rank sends to the even rank after it, which is now at its
          receive. With p odd, ranks p − 1 and 0 are both even and adjacent. In round 1 every even rank except p − 1 matches.
          In round 2, rank 0 is at its receive, so p − 1 sends to it; the odd ranks send to their right neighbours, all now at
          their receives except p − 1, which is busy sending. In round 3 rank p − 2 sends to p − 1, which is then at its receive.
        </p>
      </Proof>

      <Definition title="non-blocking calls and the cost of a message">
        <p>
          A non-blocking send or receive returns immediately with a handle, and a later wait completes it. Between the two
          the process can compute, so a step that both computes and communicates takes the larger of the two times instead of
          their sum (<C>step_time</C>), and no ordering of non-blocking calls can deadlock in the way above. To a first
          approximation, a message of n bytes costs a fixed latency α plus n/β at bandwidth β (<C>message_time</C>), the α–β
          model studied in e8.2.5.
        </p>
        <Code>{MATCHING}</Code>
      </Definition>

      <Remark title="in practice">
        <p>
          MPI provides <C>MPI_Send</C>, <C>MPI_Recv</C>, <C>MPI_Isend</C>, <C>MPI_Irecv</C> and <C>MPI_Sendrecv</C>, the last of
          which performs an exchange without any risk of this deadlock. PyTorch&apos;s <C>torch.distributed</C> offers{" "}
          <C>send</C>, <C>recv</C>, <C>isend</C> and <C>irecv</C> between ranks, and pipeline parallelism (e10) is built from such
          point-to-point transfers. Most other communication in training, however, uses the collective operations of the next
          part.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "time",
      rung: "check",
      prompt: <p>A message of 4 MB is sent with latency α = 5 µs over a link of 10 GB/s. How many microseconds does it take, by the α–β model?</p>,
      answer: { kind: "numeric", value: 405, tolerance: 0.001 },
    },
    {
      key: "overlap",
      rung: "check",
      prompt: (
        <p>
          Each training step computes for 7 ms and communicates for 4 ms. Over 100 steps, how many milliseconds are saved by
          overlapping communication with computation using non-blocking calls?
        </p>
      ),
      answer: { kind: "numeric", value: 400, tolerance: 0 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why can the ring shift with &quot;send, then receive&quot; on every rank work for small messages and deadlock for large ones?</p>,
      answer: {
        kind: "choice",
        options: [
          "Small sends are buffered and return at once, while large sends use a rendezvous and wait for a receive that no rank ever reaches",
          "Large messages are split into pieces that arrive out of order",
          "The network drops large messages, so the receives never complete",
          "Receives with a wildcard source match only small messages",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def simulate(programs):
    pc = [0] * len(programs)
    rounds = 0
    while True:
        sends = [(i, p[pc[i]][1]) for i, p in enumerate(programs) if pc[i] < len(p) and p[pc[i]][0] == 'send']
        pairs = [(i, j) for i, j in sends if pc[j] < len(programs[j]) and programs[j][pc[j]] == ('recv', i)]
        if not pairs:
            return rounds, all(pc[i] == len(p) for i, p in enumerate(programs))
        for i, j in pairs:
            pc[i] += 1
            pc[j] += 1
        rounds += 1

def ring_programs(p, safe):
    progs = []
    for r in range(p):
        send, recv = ('send', (r + 1) % p), ('recv', (r - 1) % p)
        progs.append([recv, send] if safe and r % 2 else [send, recv])
    return progs

print(simulate(ring_programs(4, False)), simulate(ring_programs(4, True)), simulate(ring_programs(3, True)))
print(simulate([[('send', 1), ('recv', 1)], [('send', 0), ('recv', 0)]]), simulate([[('send', 1), ('recv', 1)], [('recv', 0), ('send', 0)]]), ring_programs(3, True)[1])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0, False) (2, True) (3, True)\n(0, False) (2, True) [('recv', 0), ('send', 2)]",
          "(0, False) (2, True) (2, True)\n(0, False) (2, True) [('recv', 0), ('send', 2)]",
          "(0, False) (2, True) (3, True)\n(1, False) (2, True) [('send', 2), ('recv', 0)]",
          "(4, True) (2, True) (3, True)\n(0, False) (2, True) [('recv', 0), ('send', 2)]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def deliver(messages, recvs):
    pending, out = list(messages), []
    for src, tag in recvs:
        for k, (s, t, x) in enumerate(pending):
            if (src is None or s == src) and (tag is None or t == tag):
                out.append(x)
                del pending[k]
                break
        else:
            out.append(None)
    return out

def message_time(nbytes, alpha, beta):
    return alpha + nbytes / beta

def step_time(t_comp, t_comm, nonblocking):
    return max(t_comp, t_comm) if nonblocking else t_comp + t_comm

print(deliver([(0, 1, 'a'), (1, 1, 'b'), (0, 2, 'c')], [(0, 2), (None, 1), (None, None), (1, None)]))
print(message_time(10 ** 6, 2e-6, 1e9), step_time(3, 5, False), step_time(3, 5, True))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['c', 'a', 'b', None]\n0.001002 8 5",
          "['c', 'a', 'a', 'b']\n0.001002 8 5",
          "['c', 'a', 'b', None]\n0.001002 5 8",
          "['a', 'b', 'c', None]\n1000002.0 8 5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>simulate(programs)</C>: in each round, every rank whose current operation is <C>(&apos;send&apos;, j)</C> while
          rank j&apos;s current operation is <C>(&apos;recv&apos;, i)</C> completes the transfer, and both advance; return the
          number of rounds with at least one transfer and whether all programs finished. Also write{" "}
          <C>ring_programs(p, safe)</C>, where rank r sends to r + 1 and receives from r − 1 modulo p, receiving first only
          when <C>safe</C> and r is odd.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def simulate(programs):
    return 0, True

def ring_programs(p, safe):
    return [[] for _ in range(p)]
`,
        solution: RENDEZVOUS,
        tests: [
          { name: "simulate", code: `assert simulate([[('send', 1), ('send', 1)], [('recv', 0), ('recv', 0)]]) == (2, True)
assert simulate([[('send', 1)], [('recv', 2)], []]) == (0, False) and simulate([[], []]) == (0, True)
assert simulate([[('send', 2)], [('send', 2)], [('recv', 1), ('recv', 0)]]) == (2, True)` },
          { name: "ring", code: `assert ring_programs(2, False) == [[('send', 1), ('recv', 1)], [('send', 0), ('recv', 0)]]
assert ring_programs(4, True)[3] == [('recv', 2), ('send', 0)] and ring_programs(4, True)[2] == [('send', 3), ('recv', 1)]
for p in range(2, 9):
    assert simulate(ring_programs(p, False)) == (0, False) and simulate(ring_programs(p, True)) == (2 if p % 2 == 0 else 3, True)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>deliver(messages, recvs)</C>: messages are <C>(src, tag, payload)</C> in arrival order, each receive{" "}
          <C>(src, tag)</C> takes the earliest pending message that matches (<C>None</C> matches anything), and a receive with no
          match yields <C>None</C>. Also write <C>message_time(nbytes, alpha, beta)</C> and{" "}
          <C>step_time(t_comp, t_comm, nonblocking)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def deliver(messages, recvs):
    return [None for _ in recvs]

def message_time(nbytes, alpha, beta):
    return 0.0

def step_time(t_comp, t_comm, nonblocking):
    return 0.0
`,
        solution: MATCHING,
        tests: [
          { name: "deliver", code: `assert deliver([(2, 0, 'x'), (2, 0, 'y'), (1, 5, 'z')], [(2, 0), (None, 5), (2, None), (3, None)]) == ['x', 'z', 'y', None]
assert deliver([], [(None, None)]) == [None] and deliver([(0, 0, 1), (0, 0, 2)], [(None, None)] * 3) == [1, 2, None]` },
          { name: "costs", code: `assert abs(message_time(1000, 1, 10) - 101) < 1e-9 and abs(message_time(0, 2.5, 3) - 2.5) < 1e-9
assert step_time(2, 9, True) == 9 and step_time(2, 9, False) == 11 and step_time(6, 1, True) == 6` },
        ],
      },
    },
    {
      key: "chain",
      rung: "stretch",
      prompt: (
        <p>
          In a ring of 10 ranks with synchronous sends, rank 0 sends to rank 1 and then receives from rank 9, while every other
          rank receives from its left neighbour and then sends to its right. How many rounds does <C>simulate</C> report?
        </p>
      ),
      answer: { kind: "numeric", value: 10, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Writing every exchange as sends and receives is laborious, and different ranks must run different code. The next lesson
        describes the style almost all parallel programs actually use: one program, run by every rank, which branches on its
        own rank.
      </p>
    </>
  ),
};
