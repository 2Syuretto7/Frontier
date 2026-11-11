import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CwndViz } from "@/components/viz/CwndViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e3.6.2",
  minutes: 60,
  links: {
    requires: ["e3.6.1"],
    revisits: ["e3.1.1", "e3.5.2"],
    foreshadows: ["e3.6.3"],
  },

  puzzle: (
    <>
      <p>
        The internet drops packets whenever a router&rsquo;s queue overflows, delivers them out of order when they take
        different routes, and occasionally duplicates them. Yet a file downloaded over it arrives byte for byte intact. And
        when a million people download at once, the network slows down rather than collapsing, without anyone in charge.
        How does TCP get reliability from an unreliable network, and how does each sender decide how fast to go?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        IP delivers <strong>packets</strong> from one address to another on a best-effort basis. TCP numbers every byte it
        sends; the receiver replies with an <strong>acknowledgement</strong> naming the next byte it expects, and the sender
        retransmits anything not acknowledged in time. To avoid overloading the network, the sender keeps at most a{" "}
        <strong>congestion window</strong> of unacknowledged data in flight. It grows the window while all goes well and
        cuts it when packets are lost, because loss usually means a queue somewhere is full. Add losses below and watch the
        window respond.
      </p>
      <CwndViz />
    </>
  ),

  theory: (
    <>
      <Definition title="layers">
        <p>
          Each layer wraps the one above in its own header. The <strong>link</strong> layer (Ethernet, Wi-Fi) moves frames
          between neighbouring machines. <strong>IP</strong> carries packets across networks: an IPv4 header holds 32-bit
          source and destination addresses, a time-to-live decremented by each router, the protocol inside, and a checksum;
          routers forward each packet independently by the longest matching prefix of its destination.{" "}
          <strong>TCP</strong> and <strong>UDP</strong> add ports, and TCP adds sequence numbers, acknowledgements and
          windows. Applications such as HTTP sit on top.
        </p>
      </Definition>

      <Example title="a TCP connection">
        <Code>{`client -> server   SYN, seq = x                 # handshake
server -> client   SYN+ACK, seq = y, ack = x+1
client -> server   ACK, ack = y+1
client -> server   bytes 0-1459, 1460-2919, ...   # data, then cumulative ACKs
server -> client   ACK 2920
... FIN / ACK in each direction to close`}</Code>
        <p>
          ACKs are cumulative: &ldquo;I have everything before byte n.&rdquo; If a segment is lost, later segments still
          arrive and each produces the same ACK again; three <strong>duplicate ACKs</strong> make the sender retransmit at
          once (fast retransmit) instead of waiting for a timeout. The receiver buffers out-of-order data and advertises how
          much more it can take (flow control).
        </p>
      </Example>

      <Theorem title="window-limited throughput">
        <p>
          A sender with at most W bytes unacknowledged, on a path with round-trip time RTT, achieves throughput at most W/RTT.
          To fill a link of bandwidth B it therefore needs a window of at least the <strong>bandwidth-delay product</strong>{" "}
          B × RTT.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each byte counts against the window from the moment it is sent until it is acknowledged, at least one RTT later.
          Over a long time T, at most W bytes are outstanding at any instant, so the total of (bytes × time outstanding) is
          at most W·T. Every byte sent before T − RTT contributes at least RTT to that total, so at most W·T/RTT of them can
          be sent, and the rate tends to at most W/RTT. Filling a link means sending at rate B, which requires W/RTT ≥ B. At 1 Gb/s and 100 ms, that is 12.5 MB in flight, far more than the 64 KB a window could originally express,
          which is why TCP added a window-scale option.
        </p>
      </Proof>

      <Example title="congestion control">
        <p>
          The congestion window starts at one segment and doubles every round trip (<strong>slow start</strong>) until it
          reaches a threshold, then grows by one segment per round trip (<strong>additive increase</strong>). On three
          duplicate ACKs it halves (<strong>multiplicative decrease</strong>); on a timeout it falls back to one segment.
          AIMD makes competing flows converge to a fair share: increases are equal for everyone, while decreases cut larger
          windows more. Modern variants such as CUBIC and BBR change the growth curve but keep the idea.
        </p>
      </Example>

      <Remark title="networks for training">
        <p>
          A data-centre round trip is a few microseconds, so latency in the operating system&rsquo;s TCP stack matters.
          Large training clusters use RDMA over InfiniBand or RoCE, where network cards move data directly between the
          memories of two machines, even GPU memory (GPUDirect), without the CPU. NCCL&rsquo;s ring all-reduce sends each
          gradient chunk around a ring of GPUs so that every link is busy at once; with n GPUs each sends about 2(n − 1)/n
          times the gradient size, almost independent of n.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bits",
      rung: "check",
      prompt: <p>How many bits are in an IPv4 address?</p>,
      answer: { kind: "numeric", value: 32 },
    },
    {
      key: "tput",
      rung: "apply",
      prompt: <p>A TCP sender&rsquo;s window is 20 segments of 1460 bytes and the round-trip time is 50 ms. At most how many bytes per second can it send?</p>,
      answer: { kind: "numeric", value: 584000 },
    },
    {
      key: "bdp",
      rung: "apply",
      prompt: <p>A 10 Gb/s link has a 20 ms round-trip time. How many 1500-byte segments must be in flight to fill it (round up)?</p>,
      answer: { kind: "numeric", value: 16667 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def checksum(data):
    if len(data) % 2:
        data += bytes(1)
    s = 0
    for i in range(0, len(data), 2):
        s += (data[i] << 8) | data[i + 1]
        s = (s & 0xFFFF) + (s >> 16)          # end-around carry
    return ~s & 0xFFFF

# an IPv4 header with its checksum field (bytes 10 and 11) zeroed
hdr = bytes([0x45, 0, 0, 20, 0, 0, 0, 0, 64, 6, 0, 0, 10, 0, 0, 1, 10, 0, 0, 2])
c = checksum(hdr)
fixed = hdr[:10] + c.to_bytes(2, 'big') + hdr[12:]
print(hex(c), checksum(fixed), hdr[0] >> 4, (hdr[0] & 15) * 4, hdr[8], '.'.join(map(str, hdr[12:16])))`}</Code>
          <p>The Internet checksum and an IPv4 header. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0x66e2 0 4 20 64 10.0.0.1", "0x991d 0 4 20 64 10.0.0.1", "0x66e2 65535 4 20 64 10.0.0.1", "0x66e2 0 4 5 64 10.0.0.2"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def acks(arrivals):
    got, nxt, out = set(), 0, []
    for seq in arrivals:                 # segment numbers, in arrival order
        got.add(seq)
        while nxt in got:
            nxt += 1
        out.append(nxt)                  # cumulative ACK: next segment wanted
    return out

a = acks([0, 1, 3, 4, 2, 5, 5])
print(a, a.count(2), len(set(a)))`}</Code>
          <p>Cumulative acknowledgements. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1, 2, 2, 2, 5, 6, 6] 3 4", "[1, 2, 4, 5, 5, 6, 6] 1 4", "[1, 2, 2, 2, 5, 6, 6] 2 4", "[0, 1, 1, 1, 4, 5, 5] 3 4"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write the receiving side of TCP&rsquo;s byte stream: a class <C>Receiver</C> whose <C>receive(seq, data)</C>{" "}
            accepts a segment whose first byte has offset seq (segments may arrive out of order, duplicated or overlapping) and
            returns the cumulative ACK, the offset of the first byte not yet received in order; and whose <C>read()</C>{" "}
            returns the in-order bytes delivered since the last read.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class Receiver:
    def __init__(self):
        self.data = bytearray()

    def receive(self, seq, data):
        self.data += data
        return len(self.data)

    def read(self):
        out = bytes(self.data)
        self.data = bytearray()
        return out
`,
        solution: `class Receiver:
    def __init__(self):
        self.next = 0              # first byte not yet received in order
        self.pending = {}          # byte offset -> byte value, received out of order
        self.delivered = bytearray()
        self.read_pos = 0

    def receive(self, seq, data):
        for i, b in enumerate(data):
            pos = seq + i
            if pos >= self.next:
                self.pending.setdefault(pos, b)
        while self.next in self.pending:
            self.delivered.append(self.pending.pop(self.next))
            self.next += 1
        return self.next

    def read(self):
        out = bytes(self.delivered[self.read_pos:])
        self.read_pos = len(self.delivered)
        return out
`,
        tests: [
          { name: "gaps and ACKs", code: `r = Receiver()
assert r.receive(0, b'hello') == 5
assert r.read() == b'hello'
assert r.receive(10, b'world') == 5, 'A gap: the ACK stays at 5.'
assert r.read() == b'', 'Nothing new can be delivered past a gap.'
assert r.receive(5, b', ') == 7
assert r.receive(7, b'big') == 15, 'The gap is filled, and the buffered bytes follow.'
assert r.read() == b', bigworld'
assert r.receive(0, b'hel') == 15, 'An old duplicate changes nothing.'
assert r.read() == b''` },
          { name: "reordering and duplicates", code: `import random
rng = random.Random(12)
for trial in range(40):
    msg = bytes(rng.randrange(65, 91) for _ in range(rng.randrange(1, 60)))
    segs = []
    i = 0
    while i < len(msg):
        k = rng.randrange(1, 8)
        segs.append((i, msg[i:i + k]))
        i += k
    # duplicates and overlapping retransmissions
    for _ in range(rng.randrange(0, 5)):
        a = rng.randrange(len(msg))
        b = rng.randrange(a + 1, len(msg) + 1)
        segs.append((a, msg[a:b]))
    rng.shuffle(segs)
    r = Receiver()
    got = b''
    acks = []
    for seq, data in segs:
        acks.append(r.receive(seq, data))
        got += r.read()
    assert got == msg, 'The application must see every byte once, in order.'
    assert acks == sorted(acks), 'Cumulative ACKs never go backwards.'
    assert acks[-1] == len(msg)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>cwnd_trace(rounds, events, ssthresh=64)</C>, the congestion window (in segments) at the start of each
            round trip, starting at 1. In a round with no event the window doubles, capped at ssthresh, while below ssthresh,
            and otherwise grows by 1. events maps a round to <C>&apos;dup&apos;</C> (ssthresh becomes half the window, at
            least 2, and the window becomes ssthresh) or <C>&apos;timeout&apos;</C> (the same ssthresh, but the window
            becomes 1); anything else is a <C>ValueError</C>. Also write <C>throughput(cwnd, mss, rtt)</C> in bytes per second
            and <C>bdp_segments(bandwidth, rtt, mss)</C>, the segments needed to fill a link of bandwidth bits per second,
            rounded up.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def cwnd_trace(rounds, events, ssthresh=64):
    return [2 ** min(r, 6) for r in range(rounds)]


def throughput(cwnd, mss, rtt):
    return cwnd * mss


def bdp_segments(bandwidth, rtt, mss):
    return int(bandwidth * rtt / mss)
`,
        solution: `import math


def cwnd_trace(rounds, events, ssthresh=64):
    # events: round -> 'dup' (three duplicate ACKs) or 'timeout'
    cwnd, out = 1, []
    for r in range(rounds):
        out.append(cwnd)
        kind = events.get(r)
        if kind == 'timeout':
            ssthresh = max(cwnd // 2, 2)
            cwnd = 1
        elif kind == 'dup':
            ssthresh = max(cwnd // 2, 2)
            cwnd = ssthresh
        elif kind is not None:
            raise ValueError(kind)
        elif cwnd < ssthresh:
            cwnd = min(2 * cwnd, ssthresh)
        else:
            cwnd += 1
    return out


def throughput(cwnd, mss, rtt):
    return cwnd * mss / rtt


def bdp_segments(bandwidth, rtt, mss):
    # bandwidth in bits per second, rtt in seconds, mss in bytes
    return math.ceil(bandwidth / 8 * rtt / mss)
`,
        tests: [
          { name: "congestion window", code: `assert cwnd_trace(8, {}) == [1, 2, 4, 8, 16, 32, 64, 65], 'Slow start doubles up to ssthresh, then adds one per round.'
assert cwnd_trace(8, {}, ssthresh=6) == [1, 2, 4, 6, 7, 8, 9, 10], 'Doubling stops at ssthresh.'
assert cwnd_trace(12, {6: 'dup', 9: 'dup'}, ssthresh=8) == [1, 2, 4, 8, 9, 10, 11, 5, 6, 7, 3, 4], 'Three duplicate ACKs halve the window.'
assert cwnd_trace(10, {4: 'timeout'}, ssthresh=8) == [1, 2, 4, 8, 9, 1, 2, 4, 5, 6], 'A timeout restarts slow start with ssthresh = 4.'
assert cwnd_trace(5, {0: 'dup', 1: 'dup'}) == [1, 2, 2, 3, 4], 'ssthresh never drops below 2.'
assert cwnd_trace(0, {}) == []
try:
    cwnd_trace(3, {1: 'lost'})
    assert False, 'Unknown events are a ValueError.'
except ValueError:
    pass` },
          { name: "window maths", code: `from math import isclose
assert isclose(throughput(10, 1500, 0.1), 150000), '10 segments of 1500 bytes per 100 ms.'
assert isclose(throughput(64, 1000, 0.05), 1280000)
assert bdp_segments(10 ** 9, 0.1, 1500) == 8334, '1 Gb/s for 100 ms is 12.5 MB in flight.'
assert bdp_segments(8000, 1, 1000) == 1
assert bdp_segments(100 * 10 ** 9, 10e-6, 4096) == 31, 'A 100 Gb/s datacentre link with a 10 microsecond round trip.'` },
        ],
      },
    },
    {
      key: "fair",
      rung: "prove",
      prompt: <p>Two AIMD flows share a link of capacity C (in segments per round trip). Both add 1 per round trip, and both halve whenever their total exceeds C. Prove that the difference between their windows halves at every loss and never changes otherwise, so they converge to equal shares.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Let the windows be a and b. Additive increase adds 1 to each, so a − b is unchanged between losses.",
          "At a loss both become a/2 and b/2, so the difference becomes (a − b)/2.",
          "Losses keep happening, because the total grows by 2 per round trip and must exceed C within a bounded time.",
          "So after k losses the difference is (a₀ − b₀)/2ᵏ → 0, and the windows converge to each other: the fair share, with the total oscillating between about C/2 and C.",
        ],
      },
    },
    {
      key: "mathis",
      rung: "stretch",
      prompt: <p>In steady state an AIMD flow&rsquo;s window rises from W/2 to W by 1 segment per round trip, then a single loss halves it. Derive that the loss rate p satisfies p ≈ 8/(3W²) and that the throughput is about (MSS/RTT)·√(3/(2p)).</p>,
      answer: {
        kind: "written",
        rubric: [
          "One cycle lasts W/2 round trips, with the window averaging 3W/4.",
          "So a cycle sends about (W/2)(3W/4) = 3W²/8 segments, with one loss: p ≈ 8/(3W²).",
          "Hence W ≈ √(8/(3p)), and the average rate is (3W/4) segments per RTT.",
          "Throughput ≈ (3/4)√(8/(3p)) · MSS/RTT = √(3/(2p)) · MSS/RTT, so a 100-times lower loss rate gives only 10 times the speed.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how TCP notices a lost packet, and why it halves its sending rate when it does.",

  glimpse: (
    <p>
      With a reliable stream in hand, programs can call each other. Next: HTTP, APIs and remote procedure calls, and what
      changes when a function call can time out halfway.
    </p>
  ),
};
