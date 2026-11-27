import { expect, test } from "vite-plus/test";
import { lessonWarnings } from "../server/mcp/lesson-warnings";

const theory = (markdown: string) =>
  lessonWarnings({ blocks: [{ type: "theory", id: "intro", markdown }] });

test("tags and backticks inside code, escaped tags and autolinks are clean", () => {
  for (const source of [
    "Use `<App />` and `</div>`.",
    "Write `` `nested` <div> `` here.",
    "```tsx\nconst view = `<App />`;\n```",
    "> ~~~~html\n> <div>```</div>\n> ~~~~",
    "\\<App /> and &lt;div&gt; and \\`literal\\`",
    "See <https://example.org> or email <person@example.org>.",
    "Use `foo`+`bar` or `foo` and `bar`.",
  ])
    expect(theory(source), source).toEqual([]);
});

test("warnings locate raw tags and malformed backticks in authored prose", () => {
  for (const source of ["Try <App />.", "Open <div", "Close </section>."]) {
    expect(theory(source)).toEqual([expect.stringMatching(/intro.*tag/i)]);
  }
  for (const source of ["Use `print(`value`)`.", "Use `const name = `world``.", "Call `open()."]) {
    expect(theory(source)).toEqual([expect.stringMatching(/intro.*backtick/i)]);
  }
});

test("checks Quiz and Exercise Markdown and leaves literal code alone", () => {
  const warnings = lessonWarnings({
    blocks: [
      {
        type: "quiz",
        id: "q",
        questions: [
          {
            prompt: "Use <App />?",
            options: ["<div", "ok"],
            correctIndex: 0,
            explanation: "See </main>.",
          },
        ],
      },
      {
        type: "exercise",
        id: "edit",
        prompt: "Edit <App />",
        hints: ["Try <div>"],
        solution: "Return <main />",
        starterCode: "<aside />",
      },
      { type: "code", id: "sample", language: "html", code: "<aside />" },
    ],
  });
  expect(warnings).toHaveLength(6);
  for (const field of ["prompt", "options", "explanation", "hints", "solution"]) {
    expect(warnings.some((warning) => warning.includes(field))).toBe(true);
  }
});
