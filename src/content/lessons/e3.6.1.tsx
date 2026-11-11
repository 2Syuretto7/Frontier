import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { StreamViz } from "@/components/viz/StreamViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e3.6.1",
  minutes: 55,
  links: {
    requires: ["e3.4.3"],
    revisits: ["e3.5.3", "e3.1.1"],
    foreshadows: ["e3.6.2", "e3.6.3"],
  },

  puzzle: (
    <>
      <p>
        A client sends a 100-byte request in one call. Most of the time the server reads all 100 bytes in one call too, so
        the code passes every test; on a busy network it sometimes reads 37 bytes and then 63, and the server crashes on a
        half-parsed message. Every web request, database query and multi-GPU training job rests on connections like this.
        What does a network connection actually promise, and what must every program add on top?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A <strong>socket</strong> is the operating system&rsquo;s handle on one end of a connection, used through a file
        descriptor much like a file. A TCP connection is a reliable, ordered <strong>stream of bytes</strong> in each
        direction: everything sent arrives, once and in order, but the boundaries between your send calls are not
        preserved. A <C>recv(k)</C> returns whatever has arrived so far, at least one byte and at most k. So every protocol
        needs <strong>framing</strong>, a way to tell where one message ends. Vary the recv size below.
      </p>
      <StreamViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the socket calls">
        <Code>{`# server                                # client
srv = socket.socket()                     c = socket.socket()
srv.bind(('0.0.0.0', 8000))               c.connect(('server', 8000))
srv.listen()                              c.sendall(b'ping\\n')
conn, addr = srv.accept()   # new socket  reply = c.recv(4096)
data = conn.recv(4096)                    c.close()
conn.sendall(b'pong\\n')
conn.close()`}</Code>
        <p>
          An endpoint is an IP address plus a 16-bit <strong>port</strong>. The server binds to a port and listens;{" "}
          <C>accept</C> returns a new socket for each client while the listening socket keeps waiting for more. A connection
          is identified by the four numbers (client address, client port, server address, server port), so one server port
          can hold thousands of connections. <C>send</C> may accept only part of its data and <C>recv</C> may return only
          part of what was sent; <C>recv</C> returning <C>b&apos;&apos;</C> means the other side closed. UDP sockets instead
          send separate datagrams, which keep their boundaries but may be lost, duplicated or reordered.
        </p>
      </Definition>

      <Theorem title="length-prefixed framing">
        <p>
          If each message is sent as a 4-byte length followed by its bytes, a decoder that appends every received chunk to a
          buffer and repeatedly removes a complete frame from the front recovers exactly the sent messages, in order,
          however the stream is split into chunks.
        </p>
      </Theorem>
      <Proof>
        <p>
          The concatenation of all chunks is the concatenation of all frames, since TCP delivers every byte once and in
          order. Claim: after each step the buffer equals the stream received so far minus the frames already emitted, and
          those are exactly the first frames of the stream. Initially both are empty. When a chunk arrives the buffer gains
          the next bytes of the stream, so the invariant holds. The decoder emits a frame only when the buffer holds the
          4-byte length n and n further bytes; by the invariant these are exactly the next frame, so it emits the right
          message and the invariant is restored. And once all bytes of a frame have arrived, the decoder emits it, so every
          message eventually comes out. The output depends only on the bytes, not on the chunk boundaries.
        </p>
      </Proof>

      <Example title="framing in practice">
        <p>
          HTTP/1.1 uses lines ending in CRLF for its headers and a Content-Length header (or chunked encoding) for the body.
          Redis&rsquo;s protocol prefixes bulk strings with their lengths. gRPC frames each message with a flag byte and a
          4-byte length inside an HTTP/2 stream. Delimiters are easy to read but need escaping if the delimiter can appear in
          a message; length prefixes need none, but a receiver must cap the length it is willing to buffer, or a malicious
          peer can claim a 4 GB message.
        </p>
      </Example>

      <Remark title="sockets under distributed training">
        <p>
          <C>torch.distributed</C> starts by having every process connect to a rendezvous server (the TCPStore) over ordinary
          TCP sockets to exchange addresses. The bulk traffic, gradients in all-reduce, then goes through NCCL, which uses
          sockets, InfiniBand or NVLink depending on the hardware. A job that hangs at start-up is very often a firewall or a
          wrong <C>MASTER_ADDR</C> and port, which is a socket problem.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ports",
      rung: "check",
      prompt: <p>Port numbers are 16-bit unsigned integers. How many distinct port numbers are there?</p>,
      answer: { kind: "numeric", value: 65536 },
    },
    {
      key: "frames",
      rung: "apply",
      prompt: <p>Three messages of 5, 0 and 12 bytes are sent with 4-byte length prefixes. How many bytes cross the connection (ignoring TCP and IP headers)?</p>,
      answer: { kind: "numeric", value: 29 },
    },
    {
      key: "calls",
      rung: "apply",
      prompt: <p>A client reads a 1 MiB response with <C>recv(4096)</C> in a loop. What is the smallest possible number of recv calls that return data?</p>,
      answer: { kind: "numeric", value: 256 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import socket

a, b = socket.socketpair()          # two connected stream sockets
a.sendall(b'hello ')
a.sendall(b'world')
data = b.recv(100)
a.close()
rest = b.recv(100)
print(data, len(data), rest)`}</Code>
          <p>Two sends, then receives. What does this print on Linux?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["b'hello world' 11 b''", "b'hello ' 6 b'world'", "b'hello world' 11 None", "b'hello ' 6 b''"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import struct

def frame(msg):
    return struct.pack('>I', len(msg)) + msg     # 4-byte big-endian length, then the bytes

stream = frame(b'hi') + frame(b'') + frame(b'there')
out, i = [], 0
while i < len(stream):
    (n,) = struct.unpack('>I', stream[i:i + 4])
    out.append(stream[i + 4:i + 4 + n])
    i += 4 + n
print(len(stream), out, stream[:6].hex())`}</Code>
          <p>Length-prefixed frames. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["19 [b'hi', b'', b'there'] 000000026869", "7 [b'hi', b'there'] 000000026869", "19 [b'hi', b'', b'there'] 020000006869", "15 [b'hi', b'there'] 000000026869"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>encode_frames(messages)</C>, joining byte strings each prefixed with its length as 4 big-endian bytes, and
            a class <C>FrameDecoder</C> whose <C>feed(chunk)</C> returns the list of messages completed by that chunk (keeping
            any partial frame for later) and whose <C>pending()</C> gives the number of buffered bytes.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def encode_frames(messages):
    return b''.join(messages)


class FrameDecoder:
    def feed(self, chunk):
        return [chunk] if chunk else []

    def pending(self):
        return 0
`,
        solution: `MAX_FRAME = 2 ** 32 - 1


def encode_frames(messages):
    out = bytearray()
    for m in messages:
        if len(m) > MAX_FRAME:
            raise ValueError('message too long')
        out += len(m).to_bytes(4, 'big') + m
    return bytes(out)


class FrameDecoder:
    def __init__(self):
        self.buf = bytearray()

    def feed(self, chunk):
        self.buf += chunk
        out = []
        while len(self.buf) >= 4:
            n = int.from_bytes(self.buf[:4], 'big')
            if len(self.buf) < 4 + n:
                break
            out.append(bytes(self.buf[4:4 + n]))
            del self.buf[:4 + n]
        return out

    def pending(self):
        return len(self.buf)
`,
        tests: [
          { name: "encode and decode", code: `assert encode_frames([b'hi']) == bytes([0, 0, 0, 2]) + b'hi'
assert encode_frames([b'hi', b'', b'there']) == bytes([0, 0, 0, 2]) + b'hi' + bytes(4) + bytes([0, 0, 0, 5]) + b'there'
assert encode_frames([]) == b''
assert encode_frames([b'x' * 300])[:4] == bytes([0, 0, 1, 44]), '300 = 0x012C, big-endian.'
d = FrameDecoder()
assert d.feed(encode_frames([b'one', b'two'])) == [b'one', b'two'], 'Two frames in one chunk.'
assert d.feed(b'') == [] and d.pending() == 0
assert d.feed(encode_frames([b''])) == [b''], 'An empty message is still a message.'` },
          { name: "any chunking", code: `import random
rng = random.Random(6)
for trial in range(60):
    msgs = [bytes(rng.randrange(256) for _ in range(rng.choice([0, 1, 3, 20, 300]))) for _ in range(rng.randrange(0, 8))]
    data = encode_frames(msgs)
    d = FrameDecoder()
    got, i = [], 0
    while i < len(data):
        k = rng.randrange(1, 9)
        got += d.feed(data[i:i + k])
        i += k
    assert got == msgs, 'Messages must come out whole and in order however the stream is cut up.'
    assert d.pending() == 0
d = FrameDecoder()
assert d.feed(bytes([0, 0])) == [] and d.pending() == 2, 'Half a header: wait for more.'
assert d.feed(bytes([0, 3, 97])) == [] and d.pending() == 5
assert d.feed(b'bcxyz') == [b'abc'] and d.pending() == 3, 'Leftover bytes start the next frame.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write the three loops every socket program needs, for any object with <C>send(data)</C> (returns how many bytes it
            took) and <C>recv(n)</C> (returns 1 to n bytes, or <C>b&apos;&apos;</C> once the peer has closed):
          </p>
          <ul>
            <li><C>sendall(sock, data)</C>, returning the number of bytes sent;</li>
            <li><C>recv_exactly(sock, n)</C>;</li>
            <li>
              <C>recv_line(sock, buffer, limit=65536)</C>, returning the next line without its newline, using and updating the
              bytearray buffer to keep bytes read past it, with <C>ValueError</C> once the buffer exceeds limit without a
              newline.
            </li>
          </ul>
          <p>Raise <C>ConnectionError</C> if the peer closes too early.</p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `NL = bytes([10])   # the newline byte


def sendall(sock, data):
    return sock.send(data)


def recv_exactly(sock, n):
    return sock.recv(n)


def recv_line(sock, buffer, limit=65536):
    return sock.recv(4096).split(NL)[0]
`,
        solution: `NL = bytes([10])   # the newline byte


def sendall(sock, data):
    sent = 0
    while sent < len(data):
        n = sock.send(data[sent:])
        if n <= 0:
            raise ConnectionError('send failed')
        sent += n
    return sent


def recv_exactly(sock, n):
    parts, got = [], 0
    while got < n:
        chunk = sock.recv(n - got)
        if not chunk:
            raise ConnectionError(f'connection closed after {got} of {n} bytes')
        parts.append(chunk)
        got += len(chunk)
    return b''.join(parts)


def recv_line(sock, buffer, limit=65536):
    # buffer: a bytearray holding bytes received but not yet returned
    while NL not in buffer:
        if len(buffer) > limit:
            raise ValueError('line too long')
        chunk = sock.recv(4096)
        if not chunk:
            raise ConnectionError('connection closed mid-line')
        buffer += chunk
    i = buffer.index(NL)
    line = bytes(buffer[:i])
    del buffer[:i + 1]
    return line
`,
        tests: [
          { name: "partial sends and receives", code: `import random

class FakeSock:
    # a socket that sends and receives in random small pieces
    def __init__(self, incoming=b'', seed=0):
        self.rng = random.Random(seed)
        self.incoming = bytearray(incoming)
        self.out = bytearray()
        self.calls = 0

    def send(self, data):
        self.calls += 1
        n = min(len(data), self.rng.randrange(1, 6))
        self.out += data[:n]
        return n

    def recv(self, n):
        self.calls += 1
        k = min(n, len(self.incoming), self.rng.randrange(1, 6))
        chunk = bytes(self.incoming[:k])
        del self.incoming[:k]
        return chunk

for seed in range(20):
    s = FakeSock(seed=seed)
    data = bytes(range(seed * 7 % 200 + 1))
    assert sendall(s, data) == len(data) and bytes(s.out) == data, 'send may take only part of the data: loop until all is sent.'
s = FakeSock(b'abcdefghijklmnopqrstuvwxyz', seed=3)
assert recv_exactly(s, 10) == b'abcdefghij', 'recv may return fewer bytes than asked: loop.'
assert recv_exactly(s, 16) == b'klmnopqrstuvwxyz'
assert recv_exactly(s, 0) == b''
try:
    recv_exactly(FakeSock(b'abc', seed=1), 5)
    assert False, 'recv returning b"" means the peer closed: raise ConnectionError.'
except ConnectionError:
    pass` },
          { name: "reading lines", code: `NL = bytes([10])
import random

class FakeSock:
    def __init__(self, incoming, seed=0):
        self.rng = random.Random(seed)
        self.incoming = bytearray(incoming)

    def recv(self, n):
        k = min(n, len(self.incoming), self.rng.randrange(1, 6))
        chunk = bytes(self.incoming[:k])
        del self.incoming[:k]
        return chunk

s = FakeSock(NL.join([b'GET /a', b'Host: x', b'', b'rest']), seed=2)
buf = bytearray()
assert recv_line(s, buf) == b'GET /a'
assert recv_line(s, buf) == b'Host: x'
assert recv_line(s, buf) == b'', 'An empty line is a line.'
try:
    recv_line(s, buf)
    assert False, 'The stream ended without a newline: ConnectionError.'
except ConnectionError:
    pass
s = FakeSock(NL.join([b'one', b'two', b'three', b'']), seed=5)
buf = bytearray()
assert [recv_line(s, buf) for _ in range(3)] == [b'one', b'two', b'three'], 'Bytes past a newline stay in the buffer for the next call.'
s = FakeSock(b'x' * 200 + NL, seed=1)
try:
    recv_line(s, bytearray(), limit=50)
    assert False, 'Refuse lines longer than limit with ValueError.'
except ValueError:
    pass` },
        ],
      },
    },
    {
      key: "escape",
      rung: "prove",
      prompt: <p>Messages are framed by ending each with a newline byte. To allow newlines inside messages, the sender replaces each backslash by two backslashes and each newline by a backslash followed by n, before adding the terminator. Prove that the receiver can always recover the original messages.</p>,
      answer: {
        kind: "written",
        rubric: [
          "After escaping, an encoded message contains no raw newline byte, so the first newline in the stream ends the first message; repeat for the rest.",
          "Decoding reads the encoded message left to right: a backslash always starts a two-byte escape (\\\\ or \\n), and any other byte stands for itself.",
          "This decoding is well defined because every backslash in the encoding was produced as the first byte of an escape pair, so pairs never overlap.",
          "Decoding inverts encoding byte by byte, so each original message is recovered exactly.",
        ],
      },
    },
    {
      key: "nagle",
      rung: "stretch",
      prompt: <p>A client sends a small request header and then the small body in a second send, then waits for the reply. On some systems each request takes about 40 ms extra. Explain the interaction between Nagle&rsquo;s algorithm and delayed acknowledgements that causes this, and give two fixes.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Nagle's algorithm holds back a small segment while earlier sent data is still unacknowledged, to avoid flooding the network with tiny packets.",
          "The server's TCP delays its acknowledgement (often up to 40 ms) hoping to piggyback it on a reply, but it cannot reply until it has the body.",
          "So the body waits for the ACK and the ACK waits for the timer: a stall of the delayed-ACK timeout on every request.",
          "Fixes: send header and body in one call (or use writev), or set TCP_NODELAY on the socket; either counts.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why one send() can arrive as two recv()s, and how a length prefix lets the receiver put messages back together.",

  glimpse: (
    <p>
      TCP promised every byte, in order, over a network that loses and reorders packets. Next: how TCP/IP keeps that
      promise, and how it decides how fast to send.
    </p>
  ),
};
