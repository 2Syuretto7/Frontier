import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CrawlFrontierViz } from "@/components/viz/CrawlFrontierViz";
import type { LessonContent } from "@/lib/types";

const FRONTIER = `from collections import Counter, deque
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

def normalize_url(u):
    s = urlsplit(u)
    host = s.hostname or ""                       # hostname is already lower case
    if s.port and s.port != {"http": 80, "https": 443}.get(s.scheme.lower()):
        host += f":{s.port}"
    query = urlencode(sorted(parse_qsl(s.query, keep_blank_values=True)))
    return urlunsplit((s.scheme.lower(), host, s.path or "/", query, ""))   # fragment dropped

def crawl(links, seeds, budget, per_host=None):
    frontier, seen, fetched, count = deque(), set(), [], Counter()
    for u in map(normalize_url, seeds):
        if u not in seen:
            seen.add(u); frontier.append(u)
    while frontier and len(fetched) < budget:
        u = frontier.popleft()                    # first in, first out: breadth-first order
        host = urlsplit(u).hostname
        if per_host is not None and count[host] >= per_host:
            continue                              # this host has had its share
        count[host] += 1; fetched.append(u)
        for v in map(normalize_url, links.get(u, [])):
            if v not in seen:
                seen.add(v); frontier.append(v)
    return fetched

def host_shares(urls):
    c = Counter(urlsplit(u).hostname for u in urls)
    return {h: n / len(urls) for h, n in c.most_common()}`;

const POLICY = `def parse_robots(text):
    groups, agents, in_rules = {}, [], False
    for line in text.splitlines():
        line = line.split("#", 1)[0].strip()
        if ":" not in line:
            continue
        key, val = (p.strip() for p in line.split(":", 1))
        key = key.lower()
        if key == "user-agent":
            if in_rules:                          # a user-agent line after rules starts a new group
                agents, in_rules = [], False
            agents.append(val.lower()); groups.setdefault(val.lower(), [])
        elif key in ("allow", "disallow") and agents:
            in_rules = True
            if val:                               # an empty Disallow allows everything
                for a in agents:
                    groups[a].append((key == "allow", val))
    return groups

def allowed(groups, agent, path):
    rules = groups.get(agent.lower(), groups.get("*", []))
    best = (-1, True)
    for allow, prefix in rules:
        if path.startswith(prefix) and (len(prefix), allow) > best:
            best = (len(prefix), allow)           # longest match wins; on a tie, Allow wins
    return best[1]

def fresh_fraction(snapshots):
    seen, out = set(), []
    for snap in snapshots:
        urls = set(snap)
        out.append(len(urls - seen) / len(urls))  # share of this snapshot not in any earlier one
        seen |= urls
    return out`;

export const lesson: LessonContent = {
  id: "e11.1.1",
  minutes: 45,
  links: {
    requires: ["e2.6.1", "l8.1.2"],
    revisits: ["e3.6.3", "e2.3.1"],
    foreshadows: ["e11.2.1", "e11.4.1"],
  },

  puzzle: (
    <>
      <p>
        A team writes a crawler, seeds it with a few thousand home pages and leaves it running overnight. In the morning it has
        fetched ten million pages, and more than half of them come from one shop whose search filters can be combined in endless
        ways, each combination a new URL. Meanwhile, a public web archive has already done this at scale for over a decade. What does a
        crawler have to get right, and why do most language-model teams start from the archive instead?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A crawl is a graph search over URLs: fetch a page, extract its links, add the unseen ones to a queue called the frontier.
        Two things go wrong at web scale. The same page has many spellings, so URLs must be normalised before the seen check. And
        some sites generate unlimited pages, so a crawler that simply follows the queue drifts into them; budgets per host keep the
        crawl spread across the web. Politeness rules, from the site&apos;s robots.txt and from delays between requests, limit how
        fast any one host can be read.
      </p>
      <CrawlFrontierViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the crawl frontier">
        <p>
          The web is a directed graph whose nodes are URLs. A crawler keeps a frontier queue and a seen set. <C>normalize_url</C> maps
          equivalent spellings to one key: lower-case scheme and host, no default port, no fragment, sorted query parameters.{" "}
          <C>crawl</C> runs breadth-first search (e2.6.1) from the seeds up to a fetch budget, optionally skipping URLs whose host has
          reached a cap; <C>host_shares</C> reports the fraction of fetches per host.
        </p>
        <Code>{FRONTIER}</Code>
      </Definition>

      <Theorem title="traps take over breadth-first crawls">
        <p>
          Suppose the regular web reachable from the seeds is finite, and some reachable host is a trap: each of its pages links to at
          least two new pages of the same host. Then, without a host cap, the fraction of trap pages among the first n fetches tends
          to 1 as n grows. With a cap c per host, the trap contributes at most c pages.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let the regular pages number R. The trap is entered at some depth, and each later level of the breadth-first search holds at
          least twice as many trap pages as the one before, so the frontier never empties. Once all R regular pages are fetched, every
          further fetch is a trap page, and the fraction is at least <M>{"(n - R)/n \\to 1"}</M>. With a cap, the trap host&apos;s
          count stops at c and its remaining URLs are skipped without being expanded.
        </p>
      </Proof>

      <Definition title="politeness">
        <p>
          A site&apos;s robots.txt lists groups of rules, each for one or more user agents. Following RFC 9309, a crawler uses the group
          naming it, or else the group for <C>*</C>; among Allow and Disallow rules whose path prefix matches, the longest wins, and
          Allow wins a tie (<C>parse_robots</C>, <C>allowed</C>). Crawlers also wait a delay d between requests to the same host.
          Archives are crawled repeatedly; <C>fresh_fraction</C> measures how much of each snapshot was not in an earlier one.
        </p>
        <Code>{POLICY}</Code>
      </Definition>

      <Theorem title="the politeness bound">
        <p>
          If one host has n pages to fetch and requests to it are spaced at least d apart, fetching them takes at least{" "}
          <M>{"(n - 1)\\,d"}</M>, however many machines the crawler uses. A crawl over hosts with page counts{" "}
          <M>{"n_h"}</M> therefore takes at least <M>{"d\\,(\\max_h n_h - 1)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The n requests to the host occur at distinct times, consecutive ones at least d apart, so the first and last are at least{" "}
          <M>{"(n - 1)d"}</M> apart. The slowest host bounds the whole crawl. Parallelism helps only across hosts, which is why
          large crawlers partition the frontier by host, as a hash table partitions keys (e2.3.1).
        </p>
      </Proof>

      <Remark title="starting from an archive">
        <p>
          Common Crawl has published roughly monthly snapshots since 2008, each a few billion pages. Each snapshot comes as WARC files
          (the raw HTTP responses), WAT files (metadata and links) and WET files (extracted plain text). Most open pretraining sets,
          FineWeb and DCLM among them, start from many snapshots of WARC files and extract the text themselves, since the WET
          extraction keeps menus and boilerplate (e11.2.1). Snapshots overlap heavily, so combining them needs deduplication (e11.4.1).
          Crawling for training data also raises questions of consent and licensing that robots.txt answers only in part; some sites
          now name AI crawlers in their rules.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The shop was a trap: its filter combinations were an unbounded set of URLs, each linking to more. Sorting query parameters
          merges some spellings, but only a per-host budget stops the drift. Even then, politeness caps the rate per host, so a fresh
          crawl of billions of pages is a large engineering project, which an archive has already done.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "polite",
      rung: "check",
      prompt: <p>A crawler must fetch 7201 pages from one host, waiting 0.5 s between requests to it. At least how many minutes does this take?</p>,
      answer: { kind: "numeric", value: 60, tolerance: 0 },
    },
    {
      key: "fresh",
      rung: "check",
      prompt: (
        <p>
          The first snapshot holds URLs a, b, c, d; the second holds c, d, e, f, g. What fraction of the second snapshot is new? Give a
          decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 0.6, tolerance: 0.001 },
    },
    {
      key: "cap",
      rung: "apply",
      prompt: <p>Why does a web crawler limit the number of pages it fetches from any single host?</p>,
      answer: {
        kind: "choice",
        options: [
          "Some hosts generate unlimited URLs, and a breadth-first crawl would otherwise spend most of its budget on them",
          "Each host can only serve a fixed number of pages",
          "Normalised URLs from one host collide in the seen set",
          "robots.txt forbids more than a fixed number of fetches",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from collections import Counter, deque
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

def normalize_url(u):
    s = urlsplit(u)
    host = s.hostname or ""                       # hostname is already lower case
    if s.port and s.port != {"http": 80, "https": 443}.get(s.scheme.lower()):
        host += f":{s.port}"
    query = urlencode(sorted(parse_qsl(s.query, keep_blank_values=True)))
    return urlunsplit((s.scheme.lower(), host, s.path or "/", query, ""))   # fragment dropped

def crawl(links, seeds, budget, per_host=None):
    frontier, seen, fetched, count = deque(), set(), [], Counter()
    for u in map(normalize_url, seeds):
        if u not in seen:
            seen.add(u); frontier.append(u)
    while frontier and len(fetched) < budget:
        u = frontier.popleft()                    # first in, first out: breadth-first order
        host = urlsplit(u).hostname
        if per_host is not None and count[host] >= per_host:
            continue                              # this host has had its share
        count[host] += 1; fetched.append(u)
        for v in map(normalize_url, links.get(u, [])):
            if v not in seen:
                seen.add(v); frontier.append(v)
    return fetched

def host_shares(urls):
    c = Counter(urlsplit(u).hostname for u in urls)
    return {h: n / len(urls) for h, n in c.most_common()}

g = {"http://a.com/": ["http://A.com/x#top", "http://t.com/"], "http://t.com/": ["http://t.com/1", "http://t.com/2"], "http://t.com/1": ["http://t.com/3"]}
print(normalize_url("HTTP://Ex.com:80/p?b=2&a=1#f"), len(crawl(g, ["http://a.com/"], 9)), crawl(g, ["http://a.com/"], 9, 2)[-1])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "http://ex.com/p?a=1&b=2 6 http://t.com/1",
          "http://ex.com:80/p?a=1&b=2 6 http://t.com/1",
          "http://ex.com/p?a=1&b=2 7 http://t.com/1",
          "http://ex.com/p?a=1&b=2 6 http://t.com/3",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def parse_robots(text):
    groups, agents, in_rules = {}, [], False
    for line in text.splitlines():
        line = line.split("#", 1)[0].strip()
        if ":" not in line:
            continue
        key, val = (p.strip() for p in line.split(":", 1))
        key = key.lower()
        if key == "user-agent":
            if in_rules:                          # a user-agent line after rules starts a new group
                agents, in_rules = [], False
            agents.append(val.lower()); groups.setdefault(val.lower(), [])
        elif key in ("allow", "disallow") and agents:
            in_rules = True
            if val:                               # an empty Disallow allows everything
                for a in agents:
                    groups[a].append((key == "allow", val))
    return groups

def allowed(groups, agent, path):
    rules = groups.get(agent.lower(), groups.get("*", []))
    best = (-1, True)
    for allow, prefix in rules:
        if path.startswith(prefix) and (len(prefix), allow) > best:
            best = (len(prefix), allow)           # longest match wins; on a tie, Allow wins
    return best[1]

def fresh_fraction(snapshots):
    seen, out = set(), []
    for snap in snapshots:
        urls = set(snap)
        out.append(len(urls - seen) / len(urls))  # share of this snapshot not in any earlier one
        seen |= urls
    return out

r = parse_robots("User-agent: *\\nDisallow: /a\\nAllow: /a/b\\n\\nUser-agent: Bot\\nDisallow: /")
print(allowed(r, "other", "/a/bc"), allowed(r, "other", "/ab"), allowed(r, "bot", "/x"), fresh_fraction([["u", "v"], ["v", "w", "x", "y"]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["True False False [1.0, 0.75]", "False False False [1.0, 0.75]", "True False True [1.0, 0.75]", "True False False [1.0, 0.5]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>normalize_url(u)</C>; <C>crawl(links, seeds, budget, per_host=None)</C>, a breadth-first crawl over normalised URLs
          that skips a URL once its host has per_host fetches; and <C>host_shares(urls)</C>, mapping each host to its fraction of urls.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from collections import Counter, deque
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

def normalize_url(u):
    return u

def crawl(links, seeds, budget, per_host=None):
    return list(seeds)[:budget]

def host_shares(urls):
    return {}
`,
        solution: FRONTIER,
        tests: [
          { name: "normalize", code: `assert normalize_url("https://Q.org:443/a?z=1&y=&x=3#k") == "https://q.org/a?x=3&y=&z=1"\nassert normalize_url("http://q.org") == "http://q.org/" and normalize_url("http://q.org:8080/") == "http://q.org:8080/"` },
          { name: "crawl", code: `g = {"http://s.io/": ["http://s.io/a", "http://u.io/#x", "http://S.io/a"], "http://u.io/": ["http://u.io/b", "http://s.io/"], "http://s.io/a": ["http://s.io/c"]}\nassert crawl(g, ["http://s.io"], 10) == ["http://s.io/", "http://s.io/a", "http://u.io/", "http://s.io/c", "http://u.io/b"]\nassert crawl(g, ["http://s.io"], 10, 1) == ["http://s.io/", "http://u.io/"] and crawl(g, ["http://s.io"], 3) == ["http://s.io/", "http://s.io/a", "http://u.io/"]\nassert host_shares(["http://s.io/", "http://u.io/", "http://s.io/a", "http://s.io/c"]) == {"s.io": 0.75, "u.io": 0.25}` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>parse_robots(text)</C>, mapping each lower-cased user agent to its list of (is_allow, prefix) rules;{" "}
          <C>allowed(groups, agent, path)</C>; and <C>fresh_fraction(snapshots)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def parse_robots(text):
    return {}

def allowed(groups, agent, path):
    return True

def fresh_fraction(snapshots):
    return [1.0 for _ in snapshots]
`,
        solution: POLICY,
        tests: [
          { name: "robots", code: `g = parse_robots("# x\\nUser-agent: A\\nUser-agent: B\\nDisallow: /p # no\\nAllow: /p/q\\nDisallow:\\nUser-agent: *\\nDisallow: /tmp")\nassert g == {"a": [(False, "/p"), (True, "/p/q")], "b": [(False, "/p"), (True, "/p/q")], "*": [(False, "/tmp")]}\nassert not allowed(g, "B", "/pz") and allowed(g, "a", "/p/q/r") and allowed(g, "c", "/p") and not allowed(g, "c", "/tmp/1")\nassert allowed({"*": [(False, "/x"), (True, "/x")]}, "z", "/x/y") and allowed({}, "z", "/")` },
          { name: "fresh", code: `assert fresh_fraction([["a", "a", "b"], ["b", "c"], ["a", "c"]]) == [1.0, 0.5, 0.0]` },
        ],
      },
    },
    {
      key: "hosts",
      rung: "stretch",
      prompt: (
        <p>
          A crawler fetches from ten hosts in parallel, waiting 2 s between requests to the same host and starting all hosts at time 0.
          Nine hosts have 100 pages each and one has 1000. How many pages can it have fetched by time 200 s, counting a fetch made
          exactly at 200 s?
        </p>
      ),
      answer: { kind: "numeric", value: 1001, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        A crawl yields HTML, not text. The next lessons look at the other large sources, code, books and papers, and licensed and
        synthetic data, before turning to how the text is pulled out of each format.
      </p>
    </>
  ),
};
