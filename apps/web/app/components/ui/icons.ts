// Schematic-style glyphs on a 16px grid, drawn with a 1.5px stroke. Markup is static and trusted.
const dot = (x: number, y: number, r = 1.5) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
const path = (d: string) => `<path d="${d}"/>`;
const solid = (d: string) => `<path d="${d}" fill="currentColor" stroke="none"/>`;

export const icons = {
  pin: path("M6 2h5l-1 4 2 3H4l2-3zM8 9v5"),
  fork:
    path("M4.5 5.5v1.2c0 1 .8 1.8 1.8 1.8h3.4c1 0 1.8-.8 1.8-1.8V5.5M8 8.5v2.5") +
    dot(4.5, 4) +
    dot(11.5, 4) +
    dot(8, 12.5),
  "zoom-in": path("M10.5 10.5 14 14M5 7h4M7 5v4") + `<circle cx="7" cy="7" r="4.5"/>`,
  "zoom-out": path("M10.5 10.5 14 14M5 7h4") + `<circle cx="7" cy="7" r="4.5"/>`,
  fit: path("M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"),
  list:
    path("M5.5 4h8M5.5 8h8M5.5 12h8") + dot(2.5, 4, 0.75) + dot(2.5, 8, 0.75) + dot(2.5, 12, 0.75),
  scale: path("M8 2.5v11M4 13.5h8M3 5h10M3 5 1.5 9h3zM13 5l-1.5 4h3z"),
  dashboard: path("M2.5 2.5H7v5H2.5zM9.5 2.5h4v3h-4zM9.5 8h4v5.5h-4zM2.5 10H7v3.5H2.5z"),
  track: path("M4.5 8H7l2-4h2M7 8l2 4.5h2") + dot(3, 8) + dot(12.5, 4) + dot(12.5, 12.5),
  grill: path("M9 1.5 3.5 9H8l-1 5.5L12.5 7H8z"),
  review: path("M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3"),
  progress: path("M3 13v-2M6.5 13V9M10 13V6M13.5 13V3"),
  settings: path("M2.5 5H8M12 5h1.5M2.5 11H4M8 11h5.5") + dot(10, 5) + dot(6, 11),
  copy: path("M5.5 5.5h7v8h-7zM10.5 3.5v-1h-7v8h1"),
  check: path("M3 8.5l3.2 3.2L13 4.5"),
  x: path("M4 4l8 8M12 4l-8 8"),
  plus: path("M8 3v10M3 8h10"),
  "chevron-right": path("M6 3.5 10.5 8 6 12.5"),
  "chevron-left": path("M10 3.5 5.5 8l4.5 4.5"),
  "chevron-down": path("M3.5 6 8 10.5 12.5 6"),
  "chevron-up": path("M3.5 10 8 5.5l4.5 4.5"),
  "arrow-right": path("M2.5 8h10.5M9 4l4 4-4 4"),
  "arrow-left": path("M13.5 8H3M7 4 3 8l4 4"),
  external: path("M6.5 3.5h-3v9h9v-3M9 2.5h4.5V7M13.5 2.5l-6 6"),
  sun:
    dot(8, 8, 2.75) +
    path(
      "M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1",
    ),
  moon: path("M13 9.5A5.5 5.5 0 0 1 6.5 3 5.5 5.5 0 1 0 13 9.5z"),
  auto: path("M2.5 3h11v7.5h-11zM5.5 13.5h5M8 10.5v3"),
  menu: path("M2.5 4.5h11M2.5 8h11M2.5 11.5h11"),
  play: solid("M5.5 3.2v9.6L13 8z"),
  lock: path("M4 7.5h8v6H4zM5.5 7.5V5a2.5 2.5 0 0 1 5 0v2.5"),
  key: dot(5, 11, 2.5) + path("M6.8 9.2l6.7-6.7M11 5l2 2"),
  link: path("M6.5 9.5l3-3M7 4.5l1-1a2.8 2.8 0 0 1 4 4l-1 1M9 11.5l-1 1a2.8 2.8 0 0 1-4-4l1-1"),
  diff: path("M8 2.5v7M4.5 6h7M4.5 12.5h7"),
  diagram: path("M2.5 2.5h4.5V6H2.5zM9 10h4.5v3.5H9zM7 4.25h1.75l2.5 2.5V10"),
  image: path("M2.5 3h11v10h-11zM2.5 11.5 6 8l2.5 2.5 2-2 3 3") + dot(10.5, 5.75, 1),
  archive: path("M3.5 2.5h9v11h-9zM8 2.5V4M8 5.5V7M6.75 8.75h2.5v2.5h-2.5z"),
  upload: path("M8 10.5v-8M4.5 6 8 2.5 11.5 6M2.5 10.5v3h11v-3"),
  download: path("M8 2.5v8M4.5 7 8 10.5 11.5 7M2.5 10.5v3h11v-3"),
  lesson: path(
    "M2.5 3.5c2-.8 4-.8 5.5.5v9c-1.5-1.3-3.5-1.3-5.5-.5zM13.5 3.5c-2-.8-4-.8-5.5.5v9c1.5-1.3 3.5-1.3 5.5-.5z",
  ),
  theory: path("M3 4h10M3 8h10M3 12h6"),
  code: path("M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5"),
  gotcha: path("M8 2.5 14 13H2zM8 6.5v3M8 11.2v.1"),
  production: path("M8 1.8l5.4 3.1v6.2L8 14.2l-5.4-3.1V4.9zM8 8v6.2M2.6 4.9 8 8l5.4-3.1"),
  tip: path("M5.5 9.5a4 4 0 1 1 5 0c-.5.5-.8 1-.8 2H6.3c0-1-.3-1.5-.8-2zM6.5 13.8h3"),
  quiz: path("M2.5 4l1.2 1.2L6 3M8.5 4.5h5M2.5 10l1.2 1.2L6 9M8.5 10.5h5"),
  exercise: path("M3 13l.6-3 6.9-7L13 5.5l-7 7zM9 4.5 11.5 7"),
  video: path("M2.5 3.5h11v9h-11z") + solid("M6.8 5.8v4.4L10.4 8z"),
  clock: dot(8, 8, 5.75) + path("M8 5v3l2 1.5"),
  github: solid(
    "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z",
  ),
  user: dot(8, 5.5, 2.5) + path("M3 13.5c.6-2.5 2.6-4 5-4s4.4 1.5 5 4"),
  logout: path("M6.5 2.5h-4v11h4M10 5l3 3-3 3M13 8H6"),
  eye: path("M1.5 8S3.9 3.5 8 3.5 14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8z") + dot(8, 8, 2),
  "eye-off":
    path("M1.5 8S3.9 3.5 8 3.5 14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8zM2.5 2.5l11 11") +
    dot(8, 8, 2),
  info: dot(8, 8, 6) + path("M8 7.2v4M8 4.8v.1"),
  alert: dot(8, 8, 6) + path("M8 4.5v4M8 11v.1"),
  sort: path("M5 3v10M2.5 10.5 5 13l2.5-2.5M11 13V3M8.5 5.5 11 3l2.5 2.5"),
  "sort-up": path("M8 13V3M4 7l4-4 4 4"),
  "sort-down": path("M8 3v10M4 9l4 4 4-4"),
  search: dot(7, 7, 4.5) + path("M10.5 10.5 14 14"),
  plug: path("M5.5 2v3.5M10.5 2v3.5M3.5 5.5h9V8a4.5 4.5 0 0 1-9 0zM8 12.5V15"),
  box: path("M2.5 5.5h11v8h-11zM2.5 5.5l1.5-3h8l1.5 3M6 8.5h4"),
  ready: dot(8, 8, 5.75) + dot(8, 8, 1.75),
  trash: path("M3 4.5h10M6 4.5v-2h4v2M4.5 4.5l.5 9h6l.5-9"),
  more: dot(3.5, 8, 0.9) + dot(8, 8, 0.9) + dot(12.5, 8, 0.9),
  terminal: path("M2.5 3h11v10h-11zM5 6.5 7 8l-2 1.5M8.5 10H11"),
  rail: path("M2.5 3h11v10h-11zM6 3v10"),
  globe: dot(8, 8, 6) + path("M2 8h12M8 2c2.2 2 2.2 10 0 12M8 2c-2.2 2-2.2 10 0 12"),
  goal: path("M4 14V2.5M4 3h8l-2 3 2 3H4"),
  file: path("M4 2h5.5l3 3v9H4zM9.5 2v3h3"),
  pad: dot(8, 8, 3.25),
  "pad-on": `<circle cx="8" cy="8" r="4" fill="currentColor" stroke="none"/>`,
  comment: path("M2.5 3h11v8H7.5l-3 2.5V11h-2z"),
  reply: path("M6.5 4 2.5 8l4 4M2.5 8h7a4 4 0 0 1 4 4v.5"),
  unclear: dot(8, 8, 6) + path("M6.2 6.5a1.8 1.8 0 1 1 2.7 1.6c-.6.3-.9.7-.9 1.3M8 11.4v.1"),
  "link-off": path(
    "M7 4.5l1-1a2.8 2.8 0 0 1 4 4l-1 1M9 11.5l-1 1a2.8 2.8 0 0 1-4-4l1-1M2.5 2.5l11 11",
  ),
  "lock-pad":
    path("M1.5 7.5h7v6h-7zM3 7.5V5.5a2 2 0 0 1 4 0v2M8.5 10.5h1.75") + dot(12.25, 10.5, 2),
  steady: path("M3.5 8h9"),
} as const;

export type IconName = keyof typeof icons;
export const iconNames = Object.keys(icons) as IconName[];
