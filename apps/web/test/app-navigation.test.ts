import { describe, expect, test } from "vite-plus/test";
import { appNavigation } from "../app/components/ui/nav";

const items = [
  { id: "dashboard", to: "/dashboard", label: "Dashboard" },
  { id: "progress", to: "/progress", label: "Progress" },
  { id: "reviews", to: "/reviews", label: "Reviews" },
  { id: "grills", to: "/grills", label: "Grills" },
  { id: "settings", to: "/settings", label: "Settings" },
];
const tracks = [{ id: "queues", title: "Message queues" }];

describe.each([
  ["en", ""],
  ["ru", "/ru"],
])("%s app navigation", (_locale, prefix) => {
  test.each([
    ["/dashboard", "dashboard", "Dashboard"],
    ["/progress", "progress", "Progress"],
    ["/reviews", "reviews", "Reviews"],
    ["/grills", "grills", "Grills"],
    ["/settings", "settings", "Settings"],
    ["/reviews/redelivery/practice", "reviews", "Reviews"],
  ])("%s selects the %s section", (path, current, label) => {
    expect(appNavigation(prefix + path, items, tracks)).toEqual({
      current,
      currentTrack: undefined,
      crumbs: [{ label }],
    });
  });

  test("a Grill session links back to the Grills list", () => {
    expect(appNavigation(prefix + "/grills/recall", items, tracks)).toEqual({
      current: "grills",
      currentTrack: undefined,
      crumbs: [{ label: "Grills", to: "/grills" }],
    });
  });

  test("a Track selects its rail entry and uses its catalog title", () => {
    expect(appNavigation(prefix + "/tracks/queues", items, tracks)).toEqual({
      current: undefined,
      currentTrack: "queues",
      crumbs: [{ label: "Dashboard", to: "/dashboard" }, { label: "Message queues" }],
    });
  });

  test.each(["/", "/topics/redelivery", "/lessons/guarantees", "/reviews-archive"])(
    "%s clears the selection and breadcrumbs",
    (path) => {
      expect(appNavigation(prefix + path, items, tracks)).toEqual({
        current: undefined,
        currentTrack: undefined,
        crumbs: [],
      });
    },
  );
});

test("a legacy English dashboard URL still selects the dashboard", () => {
  expect(appNavigation("/en/dashboard", items, tracks)).toEqual({
    current: "dashboard",
    currentTrack: undefined,
    crumbs: [{ label: "Dashboard" }],
  });
});
