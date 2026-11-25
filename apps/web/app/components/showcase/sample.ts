import type { NavItem, NavTrack, NavUser } from "../ui/nav";

/** Sample data for the showcase. Nothing here is read from or written to the database. */
// A hash on the current page, so that a sample link keeps the locale of the showcase.
const here = (hash: string) => ({ hash });

export const sampleUser: NavUser = { name: "Alice Petrova", login: "alice" };

export const sampleNav: NavItem[] = [
  { id: "dashboard", label: "Dashboard", short: "Home", icon: "dashboard", to: here("#shell") },
  { id: "reviews", label: "Reviews", icon: "review", to: here("#shell"), count: 4 },
  { id: "grills", label: "Grills", icon: "grill", to: here("#shell") },
  { id: "progress", label: "Progress", icon: "progress", to: here("#shell") },
  { id: "settings", label: "Settings", icon: "settings", to: here("#shell") },
];

export const sampleNavTracks: NavTrack[] = [
  { id: "ts", title: "TypeScript internals", to: here("#shell"), percent: 58 },
  { id: "pg", title: "PostgreSQL for backend engineers", to: here("#shell"), percent: 21 },
  { id: "go", title: "Go concurrency", to: here("#shell"), percent: 0 },
];

export const sampleCode = `type Verdict = "strong" | "partial" | "weak";

// A Topic is complete at Mastery 2 or higher.
export function isComplete(level: number): boolean {
  return level >= 2;
}

const order = [];
setTimeout(() => order.push("timer"), 0);
await Promise.resolve().then(() => order.push("microtask"));
console.log(order.join(" → ")); // microtask → timer
`;

export const sampleTopics = [
  {
    id: "T01",
    title: "Structural typing",
    track: "TypeScript internals",
    level: 4,
    lessons: 3,
    due: "in 35 days",
  },
  {
    id: "T02",
    title: "Type inference",
    track: "TypeScript internals",
    level: 3,
    lessons: 4,
    due: "in 12 days",
  },
  {
    id: "T03",
    title: "Control flow narrowing",
    track: "TypeScript internals",
    level: 2,
    lessons: 2,
    due: "today",
  },
  { id: "T04", title: "Variance", track: "TypeScript internals", level: 1, lessons: 2, due: null },
  {
    id: "T05",
    title: "Conditional types",
    track: "TypeScript internals",
    level: 0,
    lessons: 0,
    due: null,
  },
];
