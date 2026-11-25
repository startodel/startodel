import type { BoardEdge, BoardTopic } from "../ui/board";
import type { NavItem, NavTrack, NavUser } from "../ui/nav";
import type { VerdictState } from "../ui/grill";

/** Sample data for the showcase. Nothing here is read from or written to the database. */
export const screenPath = (screen: string) => `/design/screens/${screen}`;

export const sampleUser: NavUser = { name: "Alice Petrova", login: "alice" };

export const sampleNav: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    short: "Home",
    icon: "dashboard",
    to: screenPath("dashboard"),
  },
  { id: "reviews", label: "Reviews", icon: "review", to: screenPath("reviews"), count: 4 },
  { id: "grills", label: "Grills", icon: "grill", to: screenPath("grill") },
  { id: "progress", label: "Progress", icon: "progress", to: screenPath("progress") },
  { id: "settings", label: "Settings", icon: "settings", to: screenPath("settings") },
];

export const sampleNavTracks: NavTrack[] = [
  { id: "node", title: "Node.js runtime internals", to: screenPath("track"), percent: 50 },
  { id: "pg", title: "PostgreSQL for backend engineers", to: screenPath("track"), percent: 22 },
  { id: "go", title: "Go concurrency", to: screenPath("track"), percent: 0 },
];

export interface SampleTopic extends BoardTopic {
  slug: string;
  lessons: number;
  read: number;
  box: number | null;
  due: string | null;
}

export const sampleTrack = {
  title: "Node.js runtime internals",
  goal: "Explain production latency problems from first principles",
  sources: [
    { label: "nodejs/node", href: "https://github.com/nodejs/node" },
    {
      label: "Node.js: the event loop",
      href: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick",
    },
    { label: "V8 blog: Orinoco", href: "https://v8.dev/blog/trash-talk" },
  ],
};

export const sampleTopics: SampleTopic[] = [
  {
    id: "t01",
    tag: "T01",
    slug: "js/execution-contexts",
    title: "Call stack and execution contexts",
    level: 4,
    lessons: 3,
    read: 3,
    box: 4,
    due: "in 21 days",
  },
  {
    id: "t02",
    tag: "T02",
    slug: "node/event-loop-phases",
    title: "Event loop phases",
    level: 3,
    lessons: 4,
    read: 4,
    box: 3,
    due: "in 3 days",
  },
  {
    id: "t03",
    tag: "T03",
    slug: "js/microtasks",
    title: "Microtasks and promise jobs",
    level: 3,
    lessons: 3,
    read: 3,
    box: 2,
    due: "today",
  },
  {
    id: "t04",
    tag: "T04",
    slug: "node/timers",
    title: "Timers and scheduling",
    level: 2,
    lessons: 3,
    read: 3,
    box: 1,
    due: "in 2 days",
  },
  {
    id: "t05",
    tag: "T05",
    slug: "js/async-functions",
    title: "Async functions under the hood",
    level: 2,
    lessons: 2,
    read: 2,
    box: 1,
    due: "2 days ago",
  },
  {
    id: "t06",
    tag: "T06",
    slug: "node/streams-backpressure",
    title: "Streams and backpressure",
    level: 1,
    lessons: 3,
    read: 3,
    box: null,
    due: null,
  },
  {
    id: "t07",
    tag: "T07",
    slug: "node/worker-threads",
    title: "Worker threads",
    level: 0,
    lessons: 2,
    read: 0,
    box: null,
    due: null,
  },
  {
    id: "t08",
    tag: "T08",
    slug: "v8/garbage-collection",
    title: "Garbage collection in V8",
    level: 2,
    lessons: 3,
    read: 3,
    box: 2,
    due: "today",
  },
  {
    id: "t09",
    tag: "T09",
    slug: "v8/heap-snapshots",
    title: "Memory leaks and heap snapshots",
    level: 0,
    lessons: 2,
    read: 1,
    box: null,
    due: null,
  },
  {
    id: "t10",
    tag: "T10",
    slug: "v8/hidden-classes",
    title: "Hidden classes and inline caches",
    level: 1,
    lessons: 2,
    read: 2,
    box: null,
    due: null,
  },
  {
    id: "t11",
    tag: "T11",
    slug: "v8/jit-tiers",
    title: "JIT tiers: Ignition to TurboFan",
    level: 0,
    lessons: 0,
    read: 0,
    box: null,
    due: null,
  },
  {
    id: "t12",
    tag: "T12",
    slug: "node/profiling-production",
    title: "Profiling in production",
    level: 0,
    lessons: 0,
    read: 0,
    box: null,
    due: null,
  },
];

export const sampleEdges: BoardEdge[] = [
  { from: "t01", to: "t02" },
  { from: "t01", to: "t08" },
  { from: "t01", to: "t10" },
  { from: "t02", to: "t03" },
  { from: "t02", to: "t04" },
  { from: "t02", to: "t07" },
  { from: "t03", to: "t05" },
  { from: "t04", to: "t06" },
  { from: "t05", to: "t06" },
  { from: "t08", to: "t09" },
  { from: "t10", to: "t11" },
  { from: "t09", to: "t12" },
  { from: "t11", to: "t12" },
];

export const sampleTopicLessons = [
  { tag: "L01", title: "The timers phase and the min-heap", blocks: 6, minutes: 9, read: true },
  { tag: "L02", title: "When does a timer actually run?", blocks: 7, minutes: 12, read: true },
  {
    tag: "L03",
    title: "setImmediate, nextTick and where each belongs",
    blocks: 5,
    minutes: 8,
    read: true,
  },
];

export type SampleBlock =
  | { id: string; type: "theory"; markdown: string }
  | { id: string; type: "code"; language: string; title: string; code: string; explanation: string }
  | { id: string; type: "callout"; kind: "gotcha" | "production" | "tip"; markdown: string }
  | { id: string; type: "link"; title: string; url: string; note: string }
  | { id: string; type: "video"; title: string; url: string; note: string }
  | {
      id: string;
      type: "quiz";
      questions: { prompt: string; options: string[]; correct: number; explanation: string }[];
    }
  | { id: string; type: "exercise"; prompt: string; hints: string[]; solution: string };

export const sampleLesson = {
  tag: "L02",
  topic: sampleTopics[3]!,
  title: "When does a timer actually run?",
  minutes: 12,
  blocks: [
    {
      id: "b01",
      type: "theory",
      markdown: `\`setTimeout(fn, 100)\` does not promise that \`fn\` runs after 100 ms. It promises that \`fn\` will not run **sooner**.

Node.js keeps timers in a min-heap ordered by expiry time. At the start of each loop iteration, the **timers phase** runs every callback whose time has passed. Then the loop moves on to pending callbacks, poll, check and close. A timer that expires while the loop is busy elsewhere waits for the next pass.

Two consequences follow:

- A long synchronous task delays every timer behind it.
- Between two tasks, Node.js drains \`process.nextTick\` callbacks and then promise jobs. A timer never cuts in front of them.`,
    },
    {
      id: "b02",
      type: "code",
      language: "js",
      title: "timers.cjs",
      code: `const start = performance.now();
const since = () => Math.round(performance.now() - start) + " ms";

setTimeout(() => console.log("timer", since()), 10);
setImmediate(() => console.log("immediate", since()));
Promise.resolve().then(() => console.log("promise job", since()));
process.nextTick(() => console.log("nextTick", since()));

// Block the loop for 50 ms.
while (performance.now() - start < 50);
console.log("sync done", since());`,
      explanation:
        "The output is `sync done`, `nextTick`, `promise job`, `timer`, `immediate`, all at about 50 ms. The timer asked for 10 ms and got 50.",
    },
    {
      id: "b03",
      type: "callout",
      kind: "gotcha",
      markdown:
        "**`setTimeout(fn, 0)` is not zero.** Node.js raises any delay below 1 ms to 1 ms. Browsers clamp nested timers to 4 ms after five levels. Do not use a zero timer to order work precisely.",
    },
    {
      id: "b04",
      type: "link",
      title: "The Node.js event loop",
      url: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick",
      note: "The official guide. Read the phases overview, then the section that compares setImmediate() with setTimeout().",
    },
    {
      id: "b05",
      type: "video",
      title: "What the heck is the event loop anyway?",
      url: "https://www.youtube.com/watch?v=8aGhZQkoFbQ",
      note: "Philip Roberts, JSConf EU. 26 minutes. It shows the browser, but the queue model carries over.",
    },
    {
      id: "b06",
      type: "quiz",
      questions: [
        {
          prompt:
            "A script calls `setTimeout(fn, 100)` and then runs a synchronous loop for 250 ms. When does `fn` run?",
          options: [
            "At about 100 ms. The timer interrupts the loop.",
            "At about 250 ms, once the loop returns.",
            "At about 350 ms: 250 for the loop plus 100 for the timer.",
            "Never. A missed timer is dropped.",
          ],
          correct: 1,
          explanation:
            "A callback cannot interrupt running code. The timer expired at 100 ms and runs in the first timers phase after the loop returns.",
        },
        {
          prompt: "Inside an I/O callback, which of these runs first?",
          options: ["`setTimeout(fn, 0)`", "`setImmediate(fn)`", "The order is not defined."],
          correct: 1,
          explanation:
            "After the poll phase the loop enters the check phase, where immediates run, before it returns to timers.",
        },
      ],
    },
    {
      id: "b07",
      type: "exercise",
      prompt:
        "Write `measureLag(intervalMs, report)`. It reports how late each tick of a repeating timer fires, so that you can chart event loop lag. A late tick must not shift every later tick.",
      hints: [
        "Compare `performance.now()` with the time the tick was due, not with the previous tick.",
        "Schedule each tick from its planned time, not from the time the callback ran.",
      ],
      solution: `\`\`\`js
export function measureLag(intervalMs, report) {
  let due = performance.now() + intervalMs;
  let timer = setTimeout(function tick() {
    const now = performance.now();
    report(now - due);
    due += intervalMs;
    timer = setTimeout(tick, Math.max(0, due - now));
  }, intervalMs);
  return () => clearTimeout(timer);
}
\`\`\`

In production, prefer \`perf_hooks.monitorEventLoopDelay()\`. It samples in native code and costs less.`,
    },
  ] satisfies SampleBlock[] as SampleBlock[],
};

export interface SampleQuestion {
  tag: string;
  topic: string;
  prompt: string;
  verdict: Exclude<VerdictState, "pending" | "none">;
  answer?: string;
  comment?: string;
}

export const sampleQuestions: SampleQuestion[] = [
  {
    tag: "Q01",
    topic: "T01",
    verdict: "strong",
    prompt:
      "What is an execution context? What does the engine push onto the call stack when a function is called?",
  },
  {
    tag: "Q02",
    topic: "T02",
    verdict: "strong",
    prompt: "Name the phases of the Node.js event loop in order. What runs in each?",
  },
  {
    tag: "Q03",
    topic: "T02",
    verdict: "partial",
    prompt:
      "Why does `setImmediate` always run before `setTimeout(fn, 0)` inside an I/O callback, but not at the top level?",
  },
  {
    tag: "Q04",
    topic: "T03",
    verdict: "strong",
    prompt:
      "When exactly does the microtask queue drain? Compare `process.nextTick` with a promise job.",
  },
  {
    tag: "Q05",
    topic: "T03",
    verdict: "partial",
    prompt: "How can a chain of promise jobs starve I/O? How would you detect it?",
  },
  {
    tag: "Q06",
    topic: "T04",
    verdict: "strong",
    prompt: "A timer set for 100 ms fires at 340 ms. List the possible causes, most likely first.",
    answer:
      "Most likely the loop was busy: a long synchronous task or a burst of promise jobs, so the timers phase came late. Next, a garbage collection pause. A major collection can take tens of milliseconds. Then CPU starvation: a throttled container or a noisy neighbour. Last, my own code re-armed the timer.",
    comment:
      "Right order, and you named the mechanism each time. To reach level 4, add that timers are checked once per loop iteration, so a slow poll phase delays them too.",
  },
  {
    tag: "Q07",
    topic: "T04",
    verdict: "strong",
    prompt: "How does Node.js store timers, and why does that structure fit the job?",
  },
  {
    tag: "Q08",
    topic: "T05",
    verdict: "partial",
    prompt:
      "What does `await` compile down to? How many ticks does awaiting a native promise take?",
  },
  {
    tag: "Q09",
    topic: "T05",
    verdict: "strong",
    prompt: "Why does an unhandled rejection in an async function not crash at the throw site?",
  },
  {
    tag: "Q10",
    topic: "T06",
    verdict: "weak",
    prompt: "Explain backpressure in a `pipeline` of streams. What does `highWaterMark` control?",
    answer:
      "highWaterMark is the maximum size of a chunk. Backpressure is when the stream is slow.",
    comment:
      "`highWaterMark` is a buffer threshold, not a chunk size. Backpressure is the signal, `write()` returning `false`, that tells the source to pause until `drain`. Read L02 in Streams and backpressure again.",
  },
  {
    tag: "Q11",
    topic: "T08",
    verdict: "strong",
    prompt: "Describe the generational heap in V8. What is promoted, and when?",
  },
  {
    tag: "Q12",
    topic: "T08",
    verdict: "strong",
    prompt: "What makes a scavenge cheap and a mark-compact expensive?",
  },
  {
    tag: "Q13",
    topic: "T10",
    verdict: "partial",
    prompt: "What is a hidden class? Write code that makes a call site megamorphic.",
  },
  {
    tag: "Q14",
    topic: "T06",
    verdict: "weak",
    prompt: "What happens when you ignore the return value of `writable.write()`?",
  },
  {
    tag: "Q15",
    topic: "T01",
    verdict: "strong",
    prompt: "How does a closure keep a variable alive after its function returns?",
  },
];

export const sampleGrillPrompt =
  "Judge my open GrillSession in Startodel. For each answered Grill Question, record a Verdict with a short comment, then update Mastery for the Topics you have evidence for.";

export const sampleReviews = [
  {
    tag: "T05",
    title: "Async functions under the hood",
    track: "Node.js runtime internals",
    level: 2,
    box: 1,
    due: "2 days overdue",
    overdue: true,
    questions: 5,
  },
  {
    tag: "T14",
    title: "MVCC and snapshots",
    track: "PostgreSQL for backend engineers",
    level: 2,
    box: 0,
    due: "1 day overdue",
    overdue: true,
    questions: 4,
  },
  {
    tag: "T03",
    title: "Microtasks and promise jobs",
    track: "Node.js runtime internals",
    level: 3,
    box: 2,
    due: "due today",
    overdue: false,
    questions: 6,
  },
  {
    tag: "T08",
    title: "Garbage collection in V8",
    track: "Node.js runtime internals",
    level: 2,
    box: 2,
    due: "due today",
    overdue: false,
    questions: 0,
  },
];

export const sampleUpcoming = [
  { tag: "T04", title: "Timers and scheduling", box: 1, due: "in 2 days" },
  { tag: "T02", title: "Event loop phases", box: 3, due: "in 3 days" },
  { tag: "T16", title: "B-tree indexes", box: 2, due: "in 6 days" },
  { tag: "T01", title: "Call stack and execution contexts", box: 4, due: "in 21 days" },
];

/** ReviewItems in each Review Box, 0 to 4. */
export const sampleBoxes = [
  { count: 1, due: 1 },
  { count: 2, due: 1 },
  { count: 3, due: 2 },
  { count: 1, due: 0 },
  { count: 2, due: 0 },
];

export const sampleWeek = [
  { day: "Wed", date: 25, count: 4, today: true },
  { day: "Thu", date: 26, count: 0 },
  { day: "Fri", date: 27, count: 1 },
  { day: "Sat", date: 28, count: 1 },
  { day: "Sun", date: 29, count: 0 },
  { day: "Mon", date: 30, count: 0 },
  { day: "Tue", date: 1, count: 1 },
];

/** Topics at each Mastery level, 0 to 4, across all Tracks. */
export const sampleMasteryCounts = [9, 5, 7, 4, 2];

export const sampleTracks = [
  {
    id: "node",
    title: "Node.js runtime internals",
    topics: 12,
    complete: 6,
    levels: [4, 3, 3, 2, 2, 1, 0, 2, 0, 1, 0, 0],
    updated: "today",
  },
  {
    id: "pg",
    title: "PostgreSQL for backend engineers",
    topics: 9,
    complete: 2,
    levels: [3, 2, 1, 1, 0, 0, 0, 0, 0],
    updated: "3 days ago",
  },
  {
    id: "go",
    title: "Go concurrency",
    topics: 6,
    complete: 0,
    levels: [0, 0, 0, 0, 0, 0],
    updated: "last week",
  },
];

export const sampleActivity = [
  {
    kind: "Grill",
    title: "Node.js runtime internals · 15 Questions judged",
    time: "Today, 14:20",
    icon: "grill",
    tone: "copper",
    verdicts: { strong: 9, partial: 4, weak: 2 },
  },
  {
    kind: "Mastery",
    title: "Timers and scheduling raised to level 2",
    time: "Today, 11:02",
    icon: "check",
    tone: "verdigris",
    level: 2,
  },
  {
    kind: "Quiz Attempt",
    title: "When does a timer actually run? · 2 of 2",
    time: "Today, 11:02",
    icon: "quiz",
    tone: "neutral",
  },
  {
    kind: "Lesson",
    title: "Read “When does a timer actually run?”",
    time: "Today, 10:48",
    icon: "lesson",
    tone: "neutral",
  },
  {
    kind: "Review",
    title: "Event loop phases moved to Review Box 3",
    time: "Yesterday",
    icon: "review",
    tone: "neutral",
  },
  {
    kind: "Review",
    title: "MVCC and snapshots returned to Review Box 0",
    time: "22 Nov",
    icon: "review",
    tone: "oxide",
  },
] as const;

export const sampleProfile = {
  name: "Alice Petrova",
  login: "alice",
  bio: "Backend engineer. Node.js, PostgreSQL, a little Go.",
  stack: ["TypeScript", "Node.js", "PostgreSQL", "Kubernetes"],
  grade: "senior",
  joined: "March 2026",
};

export const sampleCode = `type Verdict = "strong" | "partial" | "weak";

// A Topic is complete at Mastery 2 or higher.
export function isComplete(level: number): boolean {
  return level >= 2;
}

const order: string[] = [];
setTimeout(() => order.push("timer"), 0);
await Promise.resolve().then(() => order.push("promise job"));
console.log(order.join(" → ")); // promise job
`;

export const sampleNextPrompt =
  "Use the Startodel MCP server. Call get_guide, then write the first Lesson for the Topic node/streams-backpressure. Include a Quiz and one Exercise.";

export const sampleStackPresets = [
  "TypeScript",
  "Node.js",
  "Go",
  "Rust",
  "Python",
  "PostgreSQL",
  "Redis",
  "Kafka",
  "Kubernetes",
  "React",
  "Vue",
];
export const sampleGoalPresets = [
  "Go deeper in my stack",
  "Prepare for interviews",
  "Move to a new stack",
  "Lead a team",
];
export const sampleGrades = [
  { value: "junior", label: "Junior", hint: "You deliver tasks with guidance." },
  { value: "middle", label: "Middle", hint: "You deliver features on your own." },
  { value: "senior", label: "Senior", hint: "You own systems and their trade-offs." },
  { value: "lead", label: "Lead", hint: "You set direction for a team." },
] as const;

export const sampleMcpUrl = "https://startodel.ru/mcp";
export const sampleToken = "stm_4f1c9a7be2d04c6f8a3b5d1e7c9f2a6b";
export const sampleConfig = JSON.stringify(
  {
    mcpServers: {
      startodel: {
        type: "http",
        url: sampleMcpUrl,
        headers: { Authorization: "Bearer " + sampleToken },
      },
    },
  },
  null,
  2,
);
export const sampleFirstPrompt = "Call get_guide and follow it.";

export const sampleTokens = [
  {
    id: "k1",
    name: "Laptop · editor agent",
    prefix: "stm_4f1c",
    created: "12 Nov 2026",
    lastUsed: "2 minutes ago",
    active: true,
  },
  {
    id: "k2",
    name: "Terminal agent",
    prefix: "stm_9b02",
    created: "3 Oct 2026",
    lastUsed: "Yesterday",
    active: true,
  },
  {
    id: "k3",
    name: "Old workstation",
    prefix: "stm_17ae",
    created: "8 Mar 2026",
    lastUsed: "Never",
    active: false,
  },
];

export const samplePublicTrack = {
  title: "Node.js runtime internals",
  slug: "node-runtime-internals",
  description:
    "From the call stack to production profiling: how Node.js schedules work, manages memory and where latency comes from.",
  owner: { login: "alice", name: "Alice Petrova" },
  forkedFrom: { login: "mkarpov", slug: "node-internals" },
  forkCount: 14,
  topics: 12,
  lessons: 27,
  updated: "Updated 2 days ago",
};

export const sampleForks = [
  {
    login: "dmitry-s",
    name: "Dmitry Sokolov",
    slug: "node-runtime-internals",
    title: "Node.js runtime internals",
    updated: "3 days ago",
    forks: 2,
  },
  {
    login: "lena",
    name: "Elena Orlova",
    slug: "node-internals-for-sre",
    title: "Node.js internals for SRE",
    updated: "last week",
    forks: 0,
  },
  {
    login: "tkhan",
    name: "Timur Khan",
    slug: "node-runtime-internals",
    title: "Node.js runtime internals",
    updated: "2 weeks ago",
    forks: 1,
  },
  {
    login: "ana-m",
    name: "Ana Morales",
    slug: "event-loop-deep-dive",
    title: "Event loop deep dive",
    updated: "last month",
    forks: 0,
  },
];

export const samplePublicTracks = [
  {
    slug: "node-runtime-internals",
    title: "Node.js runtime internals",
    description: samplePublicTrack.description,
    topics: 12,
    lessons: 27,
    forks: 14,
    updated: "2 days ago",
  },
  {
    slug: "postgres-for-backend",
    title: "PostgreSQL for backend engineers",
    description:
      "MVCC, indexes, the planner and what to check before a migration reaches production.",
    topics: 9,
    lessons: 18,
    forks: 6,
    updated: "last week",
  },
  {
    slug: "go-concurrency",
    title: "Go concurrency",
    description:
      "Goroutines, channels and the scheduler, with the failure modes that reach production.",
    topics: 6,
    lessons: 4,
    forks: 0,
    updated: "last month",
  },
];

export const sampleGrills = [
  {
    id: "g3",
    title: "Node.js runtime internals · round 3",
    open: true,
    answered: 7,
    judged: 5,
    total: 15,
    when: "Started today",
    verdicts: { strong: 3, partial: 2, weak: 0 },
  },
  {
    id: "g2",
    title: "Node.js runtime internals · round 2",
    open: false,
    answered: 15,
    judged: 15,
    total: 15,
    when: "18 Nov",
    verdicts: { strong: 9, partial: 4, weak: 2 },
  },
  {
    id: "g1",
    title: "PostgreSQL · MVCC",
    open: false,
    answered: 12,
    judged: 12,
    total: 12,
    when: "9 Nov",
    verdicts: { strong: 5, partial: 5, weak: 2 },
  },
];

export const sampleLegal = {
  title: "Publishing rules",
  version: "2026-11-01",
  updated: "1 November 2026",
  body: `These rules apply to every Public Track. By publishing you confirm that you have read them.

## What you may publish

Publish lawful learning materials. Share copyrighted work only when you hold the necessary rights. Keep other people’s personal data out of titles, sources and Lessons. Spam and advertising are prohibited.

## Who can read a Public Track

Anyone with the link can read a Public Track, including the Lessons of every member Topic. Your Mastery, your reviews and your GrillSessions stay private.

## Forks

Any signed-in learner can create a Fork. A Fork is a one-time copy. Later changes to your Track do not reach it, and unpublishing your Track does not remove it.

## Moderation and reports

The platform moderates published material. The operator may remove content and restrict publishing. To report a problem, [open an issue](https://github.com/startodel/startodel/issues/new) with the Public Track URL and a brief description.

## Changes to these rules

When the rules change, you accept the new version before you publish again. Tracks that are already public stay public.`,
};
