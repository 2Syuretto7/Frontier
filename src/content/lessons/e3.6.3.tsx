import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BackoffViz } from "@/components/viz/BackoffViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e3.6.3",
  minutes: 60,
  links: {
    requires: ["e3.6.1"],
    revisits: ["e3.5.3", "e3.6.2", "e3.4.3"],
    foreshadows: ["e4.1.1", "e4.6.2"],
  },

  puzzle: (
    <>
      <p>
        A script sends 10,000 prompts to a model API. Some calls fail with 429 or 503, some time out, and when the script
        retries, one time out of a thousand the same prompt is billed twice. A payment request that times out leaves you not
        knowing whether you paid. Calling a function on another machine looks like calling a local one, but it can fail in
        ways a local call cannot. What are the rules for calling across a network safely?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        HTTP is a request-and-response protocol on top of a TCP stream: a request line, headers, a blank line, and an
        optional body; the reply has a <strong>status code</strong>, headers and body. A remote call can succeed, fail, or
        leave you not knowing, so clients <strong>retry</strong>, and retries need two disciplines. Requests must be safe to
        repeat, and retries must back off, or a struggling server is buried under its clients&rsquo; retries. Compare three
        retry policies below.
      </p>
      <BackoffViz />
    </>
  ),

  theory: (
    <>
      <Definition title="an HTTP exchange">
        <Code>{`POST /v1/messages HTTP/1.1
Host: api.example.com
Content-Type: application/json
Content-Length: 84

{"model": "...", "max_tokens": 256, "messages": [{"role": "user", "content": "Hi"}]}

HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: ...

{"id": "...", "content": [...], "usage": {...}}`}</Code>
        <p>
          Header lines end in CRLF and names are case-insensitive. Methods state intent: GET reads, POST creates or performs,
          PUT replaces, DELETE removes. Status codes are grouped: 2xx success, 4xx the client&rsquo;s fault (400 bad request,
          401 unauthenticated, 404 not found, 429 too many requests), 5xx the server&rsquo;s (500, 502, 503). A 4xx other than
          429 will fail again if repeated; 429 and 5xx may succeed later.
        </p>
      </Definition>

      <Theorem title="idempotent retries">
        <p>
          Call an operation <strong>idempotent</strong> if performing it twice in a row has the same effect as performing it
          once. If every request a client sends is idempotent, then retrying until one attempt is acknowledged leaves the
          server in the same state as a single successful call, whatever subset of attempts actually reached it.
        </p>
      </Theorem>
      <Proof>
        <p>
          Suppose k ≥ 1 attempts of the same request reached the server, possibly interleaved with nothing else from this
          client. By induction on k, applying the operation k times equals applying it once: true for k = 1, and if k − 1
          applications equal one, a k-th application is a second application of an idempotent operation, which changes
          nothing. At least one attempt arrived, since one was acknowledged. Setting a value (PUT x = 5) is idempotent; adding
          to it (x += 5) is not. Non-idempotent operations are made idempotent with an <strong>idempotency key</strong>: the
          client sends a unique id with the request and the server records ids it has already performed, returning the stored
          result for a repeat.
        </p>
      </Proof>

      <Example title="backoff and rate limits">
        <p>
          After the i-th failure, wait about base × 2ⁱ, capped, before trying again: <strong>exponential backoff</strong>.
          Clients that failed together would still retry together, so add random <strong>jitter</strong> to the wait. Respect
          a server&rsquo;s Retry-After header. Servers protect themselves with rate limits, commonly a{" "}
          <strong>token bucket</strong>: tokens refill at rate r up to a capacity b, and each request spends one, which allows
          bursts of b and a long-run rate of r. Every remote call also needs a <strong>timeout</strong>, or one stuck server
          freezes its callers.
        </p>
      </Example>

      <Remark title="RPC and model APIs">
        <p>
          RPC frameworks such as gRPC generate client and server code from an interface definition and send compact binary
          messages (protocol buffers) over HTTP/2, with deadlines and streaming built in. LLM APIs stream long responses as
          server-sent events, one HTTP response delivering tokens as they are generated. The official SDKs implement the
          rules of this lesson for you: retries on 429 and 5xx with exponential backoff and jitter, timeouts, and request ids
          for debugging. Batch interfaces trade latency for throughput and price when results are not needed at once.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "status",
      rung: "check",
      prompt: <p>Which HTTP status code means the client has sent too many requests and should slow down?</p>,
      answer: { kind: "numeric", value: 429 },
    },
    {
      key: "sleep",
      rung: "apply",
      prompt: <p>A client makes up to 6 attempts with exponential backoff: it waits 0.5 s after the first failure, doubling each time, capped at 8 s, and never waits after the last attempt. If all 6 fail, how many seconds has it spent waiting?</p>,
      answer: { kind: "numeric", value: 15.5 },
    },
    {
      key: "bucket",
      rung: "apply",
      prompt: <p>A token bucket refills at 50 tokens per second up to a capacity of 100 and starts full. What is the largest number of requests it can allow in the first 10 seconds (each costs one token)?</p>,
      answer: { kind: "numeric", value: 600 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import json
from urllib.parse import parse_qs, urlencode, urlsplit

u = urlsplit('https://api.example.com:8443/v1/models?limit=2&tag=a&tag=b#top')
q = parse_qs(u.query)
body = json.dumps({'model': 'm', 'max_tokens': 5}, separators=(',', ':'))
print(u.hostname, u.port, u.path, q['tag'], urlencode({'q': 'a b&c'}), len(body))`}</Code>
          <p>URLs, query strings and JSON. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["api.example.com 8443 /v1/models ['a', 'b'] q=a+b%26c 28", "api.example.com 8443 /v1/models ['b'] q=a+b%26c 28", "api.example.com:8443 None /v1/models ['a', 'b'] q=a b&c 28", "api.example.com 8443 /v1/models ['a', 'b'] q=a%20b%26c 30"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`class Bucket:
    def __init__(self, rate, cap):
        self.rate, self.cap = rate, cap
        self.tokens, self.t = cap, 0.0

    def allow(self, now):
        self.tokens = min(self.cap, self.tokens + (now - self.t) * self.rate)
        self.t = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False

b = Bucket(rate=2, cap=3)                  # 2 requests per second, bursts of 3
times = [0, 0, 0, 0, 0.25, 0.5, 0.5, 2.0, 2.0, 2.0, 2.0]
print(''.join('Y' if b.allow(t) else 'n' for t in times))`}</Code>
          <p>A token bucket. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["YYYnnYnYYYn", "YYYnnYnYYnn", "YYYnYYnYYYn", "YYYnnnnYYYn"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            HTTP/1.1 by hand. Write <C>parse_request(raw)</C> for a request in bytes, returning a dict with{" "}
            <C>method</C>, <C>path</C>, <C>query</C> (as <C>urllib.parse.parse_qs</C> gives it), <C>version</C>,{" "}
            <C>headers</C> (names in lower case, values stripped) and <C>body</C> (exactly Content-Length bytes, or empty).
            Raise <C>ValueError</C> if the blank line ending the headers is missing, the request line is not three parts
            ending in an HTTP version, a header line has no colon, or the body is short. Then write{" "}
            <C>build_response(status, headers, body)</C>, giving the status line with its reason phrase (OK, Created, No
            Content, Bad Request, Not Found, Too Many Requests, Internal Server Error, Service Unavailable for 200, 201, 204,
            400, 404, 429, 500, 503), the headers in order, then Content-Length. Lines end with the two bytes 13 and 10.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `CRLF = bytes([13, 10])


def parse_request(raw):
    first = raw.split(CRLF)[0].decode().split(' ')
    return {'method': first[0], 'path': first[1], 'query': {}, 'version': first[2], 'headers': {}, 'body': b''}


def build_response(status, headers, body):
    return b'HTTP/1.1 ' + str(status).encode() + CRLF + CRLF + body
`,
        solution: `from urllib.parse import parse_qs, urlsplit

CRLF = bytes([13, 10])
REASONS = {200: 'OK', 201: 'Created', 204: 'No Content', 400: 'Bad Request', 404: 'Not Found',
           429: 'Too Many Requests', 500: 'Internal Server Error', 503: 'Service Unavailable'}


def parse_request(raw):
    head, sep, body = raw.partition(CRLF + CRLF)
    if not sep:
        raise ValueError('incomplete headers')
    lines = head.decode('latin-1').split(CRLF.decode())
    parts = lines[0].split(' ')
    if len(parts) != 3 or not parts[2].startswith('HTTP/'):
        raise ValueError('bad request line')
    method, target, version = parts
    headers = {}
    for line in lines[1:]:
        name, colon, value = line.partition(':')
        if not colon or not name.strip():
            raise ValueError('bad header line')
        headers[name.strip().lower()] = value.strip()
    n = int(headers.get('content-length', '0'))
    if len(body) < n:
        raise ValueError('body shorter than Content-Length')
    url = urlsplit(target)
    return {'method': method, 'path': url.path, 'query': parse_qs(url.query), 'version': version,
            'headers': headers, 'body': body[:n]}


def build_response(status, headers, body):
    lines = [f'HTTP/1.1 {status} {REASONS.get(status, "Unknown")}']
    for name, value in headers.items():
        lines.append(f'{name}: {value}')
    lines.append(f'Content-Length: {len(body)}')
    return CRLF.join(l.encode('latin-1') for l in lines) + CRLF + CRLF + body
`,
        tests: [
          { name: "parse requests", code: `CRLF = bytes([13, 10])
def req(*lines, body=b''):
    return CRLF.join(l.encode() for l in lines) + CRLF + CRLF + body

r = parse_request(req('GET /v1/models?limit=2&tag=a&tag=b HTTP/1.1', 'Host: api.example.com', 'Accept: */*'))
assert r['method'] == 'GET' and r['path'] == '/v1/models' and r['version'] == 'HTTP/1.1'
assert r['query'] == {'limit': ['2'], 'tag': ['a', 'b']}
assert r['headers'] == {'host': 'api.example.com', 'accept': '*/*'}, 'Header names are case-insensitive: store them in lower case.'
assert r['body'] == b''
body = b'{"model":"m"}'
r = parse_request(req('POST /v1/messages HTTP/1.1', 'Content-Type: application/json', f'CONTENT-LENGTH: {len(body)}', body=body + b'NEXT'))
assert r['body'] == body, 'Read exactly Content-Length bytes; the rest belongs to the next request.'
assert r['headers']['content-type'] == 'application/json'
r = parse_request(req('GET / HTTP/1.1', 'X-Note:   spaced out  '))
assert r['headers']['x-note'] == 'spaced out'
for bad in [b'GET / HTTP/1.1' + CRLF + b'Host: x', req('GET /'), req('GET / HTTP/1.1', 'NoColonHere'), req('POST / HTTP/1.1', 'Content-Length: 10', body=b'short')]:
    try:
        parse_request(bad)
        assert False, f'{bad!r} is malformed: ValueError.'
    except ValueError:
        pass` },
          { name: "build responses", code: `CRLF = bytes([13, 10])
out = build_response(200, {'Content-Type': 'text/plain'}, b'hello')
assert out == CRLF.join([b'HTTP/1.1 200 OK', b'Content-Type: text/plain', b'Content-Length: 5', b'', b'hello'])
assert build_response(404, {}, b'').startswith(b'HTTP/1.1 404 Not Found' + CRLF)
assert build_response(429, {'Retry-After': '2'}, b'').split(CRLF)[:3] == [b'HTTP/1.1 429 Too Many Requests', b'Retry-After: 2', b'Content-Length: 0']
assert build_response(503, {}, b'x').endswith(CRLF + CRLF + b'x')
r = parse_request(build_response(200, {'A': 'b'}, b'').replace(b'HTTP/1.1 200 OK', b'GET /x HTTP/1.1'))
assert r['headers'] == {'a': 'b', 'content-length': '0'}, 'Your own output should parse back.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>A well-behaved client and server:</p>
          <ul>
            <li>
              <C>TokenBucket(rate, capacity)</C>, starting full, with <C>allow(now, cost=1)</C> returning whether cost tokens
              were available (and spending them); time going backwards is a <C>ValueError</C>.
            </li>
            <li><C>backoff_delays(attempts, base, cap)</C>: the list of min(cap, base × 2ⁱ) for i from 0.</li>
            <li>
              <C>call_with_retries(fn, max_attempts, base, cap, sleep)</C>: call fn(), which returns a status code; retry only
              429 and 5xx, calling sleep with the next backoff delay between attempts; return{" "}
              <C>(final_status, attempts_made)</C>.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class TokenBucket:
    def __init__(self, rate, capacity):
        self.capacity = capacity

    def allow(self, now, cost=1):
        return True


def backoff_delays(attempts, base, cap):
    return [base] * attempts


def call_with_retries(fn, max_attempts, base, cap, sleep):
    return fn(), 1
`,
        solution: `class TokenBucket:
    def __init__(self, rate, capacity):
        self.rate, self.capacity = rate, capacity
        self.tokens = capacity
        self.last = None

    def allow(self, now, cost=1):
        if self.last is not None:
            if now < self.last:
                raise ValueError('time went backwards')
            self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)
        self.last = now
        if self.tokens >= cost:
            self.tokens -= cost
            return True
        return False


def backoff_delays(attempts, base, cap):
    return [min(cap, base * 2 ** i) for i in range(attempts)]


def call_with_retries(fn, max_attempts, base, cap, sleep):
    delays = backoff_delays(max_attempts - 1, base, cap)
    for attempt in range(1, max_attempts + 1):
        status = fn()
        retryable = status == 429 or 500 <= status <= 599
        if not retryable or attempt == max_attempts:
            return status, attempt
        sleep(delays[attempt - 1])
`,
        tests: [
          { name: "token bucket", code: `b = TokenBucket(rate=2, capacity=3)
got = ''.join('Y' if b.allow(t) else 'n' for t in [0, 0, 0, 0, 0.25, 0.5, 0.5, 2.0, 2.0, 2.0, 2.0])
assert got == 'YYYnnYnYYYn', f'A full bucket allows a burst of 3, then 2 per second; got {got}.'
b = TokenBucket(rate=10, capacity=10)
assert b.allow(0, cost=10) and not b.allow(0, cost=1), 'cost takes several tokens at once.'
assert not b.allow(0.5, cost=6) and b.allow(0.5, cost=5)
b = TokenBucket(rate=1, capacity=5)
assert sum(b.allow(t / 10) for t in range(0, 1001)) == 5 + 100, 'Over 100 s: the initial 5 plus 1 per second.'
try:
    b.allow(50)
    assert False, 'Time going backwards is a ValueError.'
except ValueError:
    pass` },
          { name: "retries", code: `assert backoff_delays(6, 0.5, 8) == [0.5, 1, 2, 4, 8, 8]
assert backoff_delays(0, 1, 1) == []
def server(codes):
    it = iter(codes)
    return lambda: next(it)
slept = []
assert call_with_retries(server([503, 503, 200]), 5, 1, 30, slept.append) == (200, 3)
assert slept == [1, 2], 'Sleep 1, then 2, between attempts.'
slept = []
assert call_with_retries(server([429, 500, 502, 503, 504]), 4, 0.1, 0.25, slept.append) == (503, 4), 'Give up after max_attempts.'
assert slept == [0.1, 0.2, 0.25], 'Delays are capped, and there is no sleep after the last attempt.'
slept = []
assert call_with_retries(server([404, 200]), 5, 1, 30, slept.append) == (404, 1), 'A 404 will not get better: do not retry.'
assert call_with_retries(server([400]), 5, 1, 30, slept.append) == (400, 1) and slept == []
assert call_with_retries(server([201]), 1, 1, 1, slept.append) == (201, 1)` },
        ],
      },
    },
    {
      key: "bucketproof",
      rung: "prove",
      prompt: <p>Prove that a token bucket with refill rate r and capacity b allows at most b + rT unit-cost requests in any time interval of length T.</p>,
      answer: {
        kind: "written",
        rubric: [
          "At the start of the interval the bucket holds at most b tokens.",
          "During the interval at most rT tokens are added (refills are capped, so possibly fewer).",
          "Each allowed request removes one token and the count never goes negative, so allowed requests ≤ starting tokens + tokens added.",
          "Hence at most b + rT, and the bound is reached by a burst of b at the start followed by requests at rate r.",
        ],
      },
    },
    {
      key: "exactlyonce",
      rung: "stretch",
      prompt: <p>A client sends a non-idempotent request (charge a card) and gets no reply before its timeout. Prove that no client strategy, without help from the server, guarantees the card is charged exactly once, and explain how idempotency keys give that guarantee.</p>,
      answer: {
        kind: "written",
        rubric: [
          "The client cannot distinguish 'request lost' from 'request performed, reply lost': both look like a timeout.",
          "If it never retries, the first case leaves the card uncharged; if it retries, the second case charges twice; so neither choice works in both cases.",
          "With an idempotency key, the server records which keys it has performed and answers a repeat with the stored result instead of charging again.",
          "So the client can retry until it gets a reply: at-least-once delivery plus server deduplication gives an exactly-once effect.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why a client should retry a 503 but not a 404, and why retries need both backoff and an idempotency key.",

  glimpse: (
    <p>
      That completes the tour of the machine, from bits to networks. Next comes the craft of building research software
      that works: testing, debugging, reproducibility and performance.
    </p>
  ),
};
