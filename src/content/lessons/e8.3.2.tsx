import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RaftElectionViz } from "@/components/viz/RaftElectionViz";
import type { LessonContent } from "@/lib/types";

const ELECTION = `def grant_vote(state, term, candidate, cand_last_term, cand_last_index):
    if term < state['term']:
        return False
    if term > state['term']:
        state['term'], state['voted_for'] = term, None
    up_to_date = (cand_last_term, cand_last_index) >= (state['last_term'], state['last_index'])
    if state['voted_for'] in (None, candidate) and up_to_date:
        state['voted_for'] = candidate
        return True
    return False

def elect(votes, n):
    counts = {}
    for c in votes.values():
        counts[c] = counts.get(c, 0) + 1
    winners = [c for c, k in counts.items() if 2 * k > n]
    return winners[0] if winners else None

def max_failures(n):
    return (n - 1) // 2`;

const QUORUM = `import math

def commit_index(match, n):
    return sorted(match, reverse=True)[n // 2]

def quorum_size(n):
    return n // 2 + 1

def availability(n, p_up):
    return sum(math.comb(n, k) * p_up ** k * (1 - p_up) ** (n - k) for k in range(quorum_size(n), n + 1))`;

export const lesson: LessonContent = {
  id: "e8.3.2",
  minutes: 50,
  links: {
    requires: ["e8.3.1"],
    revisits: ["e8.1.2"],
    foreshadows: ["e8.3.3", "e8.5.1"],
  },

  puzzle: (
    <>
      <p>
        A training job keeps its configuration, and the list of which machines are alive, in a small database. If that
        database lives on one machine, its failure stops everything; if it is copied to five machines, the copies can disagree
        after a crash or a network partition. How can five machines, any two of which may fail, behave like one reliable
        database that never contradicts itself?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Make every decision by majority vote. Any two majorities of five servers share at least one member, so two
        conflicting decisions can never both win: the shared member would have had to vote for both. One server is elected
        leader by majority; it orders all requests into a log and copies the log to the others; an entry is final once a
        majority holds it. If the leader crashes, a new one is elected, and the voting rules ensure that it already holds
        every final entry. A majority must stay alive for progress, but no minority of failures can make the system lie.
      </p>
      <RaftElectionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="consensus">
        <p>Each process proposes a value, and each correct process must decide on one, so that:</p>
        <ul>
          <li><em>agreement</em>: no two correct processes decide differently;</li>
          <li><em>validity</em>: the decided value was proposed by some process;</li>
          <li><em>termination</em>: every correct process eventually decides.</li>
        </ul>
        <p>
          Repeated consensus on the next entry of a log gives a <em>replicated state machine</em>: every server applies the same
          commands in the same order and so stays in the same state.
        </p>
      </Definition>

      <Theorem title="FLP impossibility">
        <p>
          (Fischer, Lynch and Paterson, 1985.) In an asynchronous system in which even one process may crash, no deterministic
          algorithm solves consensus.
        </p>
      </Theorem>
      <Remark title="living with FLP">
        <p>
          The proof, beyond this lesson, shows that an adversary controlling message delays can always keep the algorithm
          undecided, because a crashed process looks exactly like a slow one (e8.3.1). Practical protocols keep agreement
          unconditionally and give up only termination in the worst case: they make progress whenever the system behaves
          partially synchronously for long enough, and use randomised timeouts to make endless indecision vanishingly
          unlikely.
        </p>
      </Remark>

      <Theorem title="majority quorums">
        <p>
          Any two sets each containing more than half of n servers intersect. Consequently a protocol that acts only with a
          majority can tolerate f crashed servers while making progress exactly when <M>{"n \\ge 2f + 1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          If two sets of sizes a, b &gt; n/2 were disjoint, their union would have a + b &gt; n members, more than there are
          servers. With f crashes, n − f servers remain, which is a majority exactly when n − f &gt; n/2, that is n &gt; 2f, or{" "}
          <M>{"n \\ge 2f + 1"}</M>. So 3 servers tolerate 1 crash, 5 tolerate 2, and 4 tolerate no more than 3 do.
        </p>
      </Proof>

      <Definition title="Raft">
        <p>
          (Ongaro and Ousterhout, 2014.) Time is divided into numbered <em>terms</em>. A server that hears nothing from a leader
          for a random election timeout starts a new term and asks the others for votes. A server grants at most one vote per
          term, refuses candidates from older terms, and refuses a candidate whose log is less up to date than its own, comparing
          the term of the last entry and then the log length (<C>grant_vote</C>). A candidate with votes from a majority becomes
          leader (<C>elect</C>).
        </p>
        <Code>{ELECTION}</Code>
      </Definition>

      <Theorem title="election safety">
        <p>In Raft, at most one leader is elected in any term.</p>
      </Theorem>
      <Proof>
        <p>
          A leader for term t received votes from a majority of servers in term t. Two leaders for term t would need two
          majorities, which share a server by the previous theorem, and that server would have voted twice in term t, which the
          voting rule forbids.
        </p>
      </Proof>

      <Definition title="replicating the log">
        <p>
          The leader appends each command to its log and sends it to the others. An entry is <em>committed</em> once it is
          stored on a majority; if the leader knows, for each server, the highest index it holds, the committed index is the
          largest index held by a majority (<C>commit_index</C>). Because a new leader needs a majority of votes, and every
          committed entry is on a majority, some voter holds every committed entry, and the up-to-date rule makes the new leader
          hold them too. The cluster is available while a majority is up (<C>availability</C>, for servers up independently with
          probability p).
        </p>
        <Code>{QUORUM}</Code>
      </Definition>

      <Remark title="where consensus is used">
        <p>
          Consensus is expensive, so systems use it only for small, critical state: etcd (built on Raft) and ZooKeeper hold
          configuration, membership and locks for systems such as Kubernetes (e8.5.1). A training job uses it indirectly, for
          example when <C>torchrun</C> ranks rendezvous through an etcd store to agree on who is in the job, while gradients
          themselves flow through collectives with no consensus at all.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "size",
      rung: "check",
      prompt: <p>How many servers does a majority-based protocol need to keep making progress when any 4 of them may crash?</p>,
      answer: { kind: "numeric", value: 9, tolerance: 0 },
    },
    {
      key: "commit",
      rung: "check",
      prompt: <p>A Raft leader of 7 servers knows that they hold log entries up to indices 12, 9, 15, 9, 7, 11 and 10. What is the committed index?</p>,
      answer: { kind: "numeric", value: 10, tolerance: 0 },
    },
    {
      key: "uptodate",
      rung: "apply",
      prompt: <p>Why does a Raft server refuse to vote for a candidate whose log is less up to date than its own?</p>,
      answer: {
        kind: "choice",
        options: [
          "So that any elected leader already holds every committed entry, since some member of its majority holds each one",
          "To make elections faster",
          "Because such a candidate must have crashed",
          "So that each server votes at most once per term",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def grant_vote(state, term, candidate, cand_last_term, cand_last_index):
    if term < state['term']:
        return False
    if term > state['term']:
        state['term'], state['voted_for'] = term, None
    up_to_date = (cand_last_term, cand_last_index) >= (state['last_term'], state['last_index'])
    if state['voted_for'] in (None, candidate) and up_to_date:
        state['voted_for'] = candidate
        return True
    return False

def elect(votes, n):
    counts = {}
    for c in votes.values():
        counts[c] = counts.get(c, 0) + 1
    winners = [c for c, k in counts.items() if 2 * k > n]
    return winners[0] if winners else None

def max_failures(n):
    return (n - 1) // 2

s = {'term': 2, 'voted_for': None, 'last_term': 2, 'last_index': 5}; print(grant_vote(s, 3, 'a', 2, 4), grant_vote(s, 3, 'b', 2, 6), grant_vote(s, 3, 'c', 3, 1), s['term'], s['voted_for'])
print(elect({1: 'x', 2: 'x', 3: 'y', 4: 'x'}, 5), elect({1: 'x', 2: 'y'}, 3), [max_failures(n) for n in (1, 3, 4, 5, 7)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "False True False 3 b\nx None [0, 1, 1, 2, 3]",
          "True False False 3 a\nx None [0, 1, 1, 2, 3]",
          "False True True 3 c\nx None [0, 1, 1, 2, 3]",
          "False True False 3 b\nx None [0, 1, 2, 2, 3]",
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

def commit_index(match, n):
    return sorted(match, reverse=True)[n // 2]

def quorum_size(n):
    return n // 2 + 1

def availability(n, p_up):
    return sum(math.comb(n, k) * p_up ** k * (1 - p_up) ** (n - k) for k in range(quorum_size(n), n + 1))

print(commit_index([7, 5, 9, 5, 3], 5), commit_index([4, 4, 2, 1], 4), [quorum_size(n) for n in (1, 2, 3, 4, 5)])
print(round(availability(3, 0.9), 4), round(availability(1, 0.9), 4), round(availability(4, 0.9), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "5 2 [1, 2, 2, 3, 3]\n0.972 0.9 0.9477",
          "7 4 [1, 2, 2, 3, 3]\n0.972 0.9 0.9477",
          "5 2 [1, 1, 2, 2, 3]\n0.972 0.9 0.9477",
          "5 2 [1, 2, 2, 3, 3]\n0.972 0.9 0.9963",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>grant_vote(state, term, candidate, cand_last_term, cand_last_index)</C>, which updates and returns as Raft
          prescribes for a state dictionary with keys <C>&apos;term&apos;</C>, <C>&apos;voted_for&apos;</C>,{" "}
          <C>&apos;last_term&apos;</C> and <C>&apos;last_index&apos;</C>; <C>elect(votes, n)</C>, returning the candidate with
          votes from more than half of n servers, or <C>None</C>; and <C>max_failures(n)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def grant_vote(state, term, candidate, cand_last_term, cand_last_index):
    return True

def elect(votes, n):
    return None

def max_failures(n):
    return n // 2
`,
        solution: ELECTION,
        tests: [
          { name: "vote", code: `s = {'term': 5, 'voted_for': 'z', 'last_term': 4, 'last_index': 2}
assert grant_vote(s, 4, 'a', 9, 9) is False and grant_vote(s, 5, 'z', 1, 1) is False and grant_vote(s, 5, 'z', 4, 2) is True
assert grant_vote(s, 6, 'q', 4, 1) is False and s == {'term': 6, 'voted_for': None, 'last_term': 4, 'last_index': 2}
assert grant_vote(s, 6, 'r', 5, 0) is True and grant_vote(s, 6, 'q', 9, 9) is False and s['voted_for'] == 'r'` },
          { name: "elect", code: `assert elect({}, 3) is None and elect({1: 'a'}, 1) == 'a' and elect({1: 'a', 2: 'b', 3: 'a', 4: 'b'}, 4) is None
assert elect({1: 'c', 2: 'c', 3: 'c'}, 5) == 'c' and [max_failures(n) for n in (1, 2, 3, 6, 9)] == [0, 0, 1, 2, 4]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>commit_index(match, n)</C>, the largest index held by a majority of the n servers; <C>quorum_size(n)</C>; and{" "}
          <C>availability(n, p_up)</C>, the probability that at least a quorum of n independent servers is up.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def commit_index(match, n):
    return max(match)

def quorum_size(n):
    return n

def availability(n, p_up):
    return p_up ** n
`,
        solution: QUORUM,
        tests: [
          { name: "commit", code: `assert commit_index([3], 1) == 3 and commit_index([5, 1], 2) == 1 and commit_index([2, 8, 8, 1, 0], 5) == 2
assert [quorum_size(n) for n in (1, 2, 5, 6)] == [1, 2, 3, 4]` },
          { name: "availability", code: `assert abs(availability(2, 0.5) - 0.25) < 1e-12 and abs(availability(5, 1.0) - 1) < 1e-12
assert abs(availability(3, 0.8) - (3 * 0.64 * 0.2 + 0.512)) < 1e-12` },
        ],
      },
    },
    {
      key: "avail",
      rung: "stretch",
      prompt: <p>Each of 5 servers is up independently with probability 0.9. What is the probability that the cluster can make progress? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.9914, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Consensus keeps a small amount of state perfectly consistent. Training data and checkpoints are far too large for
        that. The next lesson looks at how distributed storage systems spread petabytes over many machines, using replication
        and erasure codes, and what consistency they promise in exchange.
      </p>
    </>
  ),
};
