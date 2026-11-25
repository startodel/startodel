/** The mock screens of the showcase. Each one is built only from design system components. */
export interface ScreenInfo {
  id: string;
  title: string;
  group: "Public" | "Getting started" | "Learning" | "Account";
  /** What the screen shows, in one line. */
  note: string;
  /** The real route this screen stands in for. */
  route: string;
  states?: { id: string; label: string }[];
}
export const screens: ScreenInfo[] = [
  {
    id: "landing",
    title: "Landing",
    group: "Public",
    route: "/login",
    note: "What a signed-out visitor sees: the idea, how it works, sign in with GitHub.",
  },
  {
    id: "public-track",
    title: "Public Track",
    group: "Public",
    route: "/u/:login/:slug",
    note: "A Public Track with its board, Forked From, the Fork action and the list of Public Forks.",
    states: [
      { id: "visitor", label: "Visitor" },
      { id: "owner", label: "Owner" },
      { id: "publish", label: "Publish dialog" },
    ],
  },
  {
    id: "public-profile",
    title: "Public Profile",
    group: "Public",
    route: "/u/:login",
    note: "A learner's login, name and Public Tracks.",
  },
  {
    id: "legal",
    title: "Legal page",
    group: "Public",
    route: "/terms, /rules",
    note: "The layout of the Terms of Use and the Publishing rules.",
  },
  {
    id: "onboarding",
    title: "Onboarding",
    group: "Getting started",
    route: "/onboarding",
    note: "The Onboarding Questionnaire: stack, goals and grade.",
    states: [
      { id: "stack", label: "Stack" },
      { id: "goals", label: "Goals" },
      { id: "grade", label: "Grade" },
      { id: "errors", label: "Errors" },
    ],
  },
  {
    id: "connect",
    title: "Connect an agent",
    group: "Getting started",
    route: "/onboarding/connect",
    note: "The MCP Token, the server URL, the client configuration and the first prompt.",
    states: [
      { id: "new", label: "New token" },
      { id: "waiting", label: "Waiting" },
      { id: "connected", label: "Connected" },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    group: "Learning",
    route: "/",
    note: "The Next Step, the Tracks and what is due.",
    states: [
      { id: "active", label: "Active" },
      { id: "empty", label: "First run" },
      { id: "loading", label: "Loading" },
    ],
  },
  {
    id: "track",
    title: "Track",
    group: "Learning",
    route: "/tracks/:id",
    note: "The Track board as the hero, with the selected Topic beside it.",
  },
  {
    id: "lesson",
    title: "Lesson",
    group: "Learning",
    route: "/lessons/:id",
    note: "A Lesson with all seven Block types.",
    states: [
      { id: "reading", label: "Reading" },
      { id: "answered", label: "Quiz judged" },
    ],
  },
  {
    id: "grill",
    title: "Grill",
    group: "Learning",
    route: "/grills/:id",
    note: "A GrillSession on the bench: answer, wait for the Verdict, read the judgment, see the summary.",
    states: [
      { id: "answer", label: "Answering" },
      { id: "waiting", label: "Awaiting verdict" },
      { id: "judged", label: "Judged" },
      { id: "summary", label: "Summary" },
      { id: "sessions", label: "All sessions" },
    ],
  },
  {
    id: "reviews",
    title: "Reviews",
    group: "Learning",
    route: "/reviews",
    note: "Due ReviewItems, the Review Boxes and a Practice Quiz.",
    states: [
      { id: "due", label: "Due" },
      { id: "practice", label: "Practice Quiz" },
      { id: "result", label: "Result" },
      { id: "clear", label: "Up to date" },
    ],
  },
  {
    id: "progress",
    title: "Progress",
    group: "Learning",
    route: "/progress",
    note: "Mastery across every Track and the latest Activity.",
  },
  {
    id: "settings",
    title: "Settings",
    group: "Account",
    route: "/settings",
    note: "Profile, MCP Tokens, language and theme.",
    states: [
      { id: "tokens", label: "Tokens" },
      { id: "created", label: "Token created" },
      { id: "revoke", label: "Revoke dialog" },
    ],
  },
];
