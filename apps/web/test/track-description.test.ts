import { expect, test } from "vite-plus/test";
import { splitTrackDescription } from "../app/utils/track-description";

test("a short pitch belongs entirely in the hero", () => {
  const pitch = "Understand the event loop. Trace a timer through Node.js.";
  expect(splitTrackDescription("  " + pitch + "  ")).toEqual({ lead: pitch, overview: "" });
});

test("the rest of a paragraph stays in the overview after two sentences", () => {
  expect(splitTrackDescription("Как работает Node.js? Проверим! Затем запустим таймер.")).toEqual({
    lead: "Как работает Node.js? Проверим!",
    overview: "Затем запустим таймер.",
  });
});

test("the first paragraph ends the pitch and keeps overview Markdown intact", () => {
  const overview = "Follow one callback.\n\n- Register it\n- Inspect the queue";
  expect(splitTrackDescription("Study timers.\r\n\r\n" + overview)).toEqual({
    lead: "Study timers.",
    overview,
  });
  expect(splitTrackDescription("Study timers.\n- Register it\n- Inspect the queue")).toEqual({
    lead: "Study timers.",
    overview: "- Register it\n- Inspect the queue",
  });
});

test("an unusually long opening sentence gets an excerpt and stays readable in full", () => {
  const description = "Follow the callback through " + "every queue ".repeat(30) + "until it runs.";
  const { lead, overview } = splitTrackDescription(description);
  expect(lead.length).toBeLessThanOrEqual(201);
  expect(lead).toMatch(/…$/);
  expect(description.startsWith(lead.slice(0, -1))).toBe(true);
  expect(overview).toBe(description);
});

test.each([undefined, null, " \n "])("missing or blank descriptions have no overview", (text) => {
  expect(splitTrackDescription(text)).toEqual({ lead: "", overview: "" });
});
