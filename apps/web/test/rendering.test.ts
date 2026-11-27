import { EditorState } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { classHighlighter, highlightTree } from "@lezer/highlight";
import { editorLanguage } from "../app/utils/exercise-editor";
import { publicBlock } from "@startodel/core";
import { expect, test } from "vite-plus/test";
import { practiceQuizProps } from "../app/utils/practice-quiz";
import { renderExercisePrompt, renderMarkdown } from "../app/utils/markdown";
import { httpUrl, trackSourceLink, youtubeEmbed } from "../app/utils/links";

test("Lesson Markdown escapes HTML and admits only HTTP(S) links", () => {
  const html = renderMarkdown(
    "<b>example</b> [bad](javascript:alert) [relative](/here) https://example.org/path",
    "Image:",
  );
  expect(html).toContain("&lt;b&gt;example&lt;/b&gt;");
  expect(html).not.toContain('href="javascript:');
  expect(html).not.toContain('href="/here"');
  expect(html).toContain('href="https://example.org/path"');
  expect(html).toContain('rel="noopener noreferrer"');
  expect(html).toContain('target="_blank"');
  for (const url of [
    "data:text/html,hello",
    "//example.org",
    "mailto:a@example.org",
    "javascript:alert",
  ])
    expect(httpUrl(url)).toBeUndefined();
});
test("an Exercise lifts its first fenced starter into the editor and keeps the surrounding Markdown", () => {
  const prompt = [
    "Edit the [handler][docs].",
    "~~~~tsx",
    "const view = <button>Save</button>;",
    "~~~~",
    "Expected output:",
    "```text",
    "Saved",
    "```",
    "[docs]: https://example.org/",
  ].join("\r\n");
  const result = renderExercisePrompt(prompt, "Image:");
  expect(result.language).toBe("tsx");
  expect(result.code).toBe("const view = <button>Save</button>;");
  expect(result.before).toContain('href="https://example.org/"');
  expect(result.before).not.toContain("<pre");
  expect(result.after).toContain("Expected output:");
  expect(result.after).toContain('<code class="language-text">Saved');
});

test("structured Exercise fields override the fenced starter and language independently", () => {
  const source = "Read this example.\n\n```py\nprint(1)\n```";
  const task = (fields: { starterCode?: string; language?: string }) =>
    renderExercisePrompt(source, "Image:", fields);
  expect(task({ starterCode: "select 1", language: "sql" })).toMatchObject({
    code: "select 1",
    language: "sql",
    before: expect.stringContaining("print(1)"),
  });
  expect(task({ starterCode: "" })).toMatchObject({ code: "", language: "python" });
  expect(task({ language: "ts" })).toMatchObject({ code: "print(1)", language: "typescript" });
});

test("an Exercise without a fence starts with an empty JavaScript editor", () => {
  expect(renderExercisePrompt("Try `answer()`.", "Image:")).toEqual({
    before: "<p>Try <code>answer()</code>.</p>\n",
    after: "",
    code: "",
    language: "javascript",
  });
});

test("an Exercise keeps a nested starter's list intact and unknown languages editable as text", () => {
  const result = renderExercisePrompt(
    "- Edit this:\n\n  ```rust\n  fn main() {}\n  ```\n\nThen explain.",
    "Image:",
  );
  expect(result.before).toContain("</li>\n</ul>");
  expect(result.before).not.toContain("<pre");
  expect(result.after).toContain("Then explain.");
  expect(result.code).toBe("fn main() {}");
  expect(result.language).toBe("text");
});

test("an unlabelled JSX starter and a TypeScript fence containing JSX select the JSX grammars", () => {
  const view = "return <Counter />;";
  for (const [info, language] of [
    ["", "jsx"],
    ["TS", "tsx"],
  ]) {
    expect(renderExercisePrompt("```" + info + "\n" + view + "\n```", "Image:").language).toBe(
      language,
    );
  }
});

test("the editor highlights its supported fence languages and opens other fences as plain text", async () => {
  const examples = {
    js: "const x = 1;",
    ts: "let x: number = 1;",
    jsx: "<Counter />",
    tsx: "const x: View = <Counter />;",
    html: "<b>count</b>",
    css: "b { color: red; }",
    py: "def count(): return 1",
    sql: "SELECT 1;",
    json: '{"count": 1}',
  };
  for (const [info, code] of Object.entries(examples)) {
    const prompt = renderExercisePrompt("```" + info + "\n" + code + "\n```", "Image:");
    const state = EditorState.create({
      doc: prompt.code,
      extensions: await editorLanguage(prompt.language),
    });
    const highlights: string[] = [];
    highlightTree(syntaxTree(state), classHighlighter, (from, to) =>
      highlights.push(state.sliceDoc(from, to)),
    );
    expect(highlights.length, info).toBeGreaterThan(0);
  }
  for (const info of ["go", "rust", "bash", "unknown"]) {
    const prompt = renderExercisePrompt("```" + info + "\nexample\n```", "Image:");
    expect(prompt.language).toBe("text");
    expect(await editorLanguage(prompt.language)).toEqual([]);
  }
});

test("Track Source labels show host and path while the link keeps its query and fragment", () => {
  const href = "https://www.react.dev/blog/react-v19/?lang=en#changes";
  expect(trackSourceLink(href)).toEqual({ label: "react.dev/blog/react-v19", href });
  expect(trackSourceLink("http://docs.example:8080/")).toEqual({
    label: "docs.example:8080",
    href: "http://docs.example:8080/",
  });
  for (const invalid of ["not a URL", "/relative", "ftp://docs.example/file"])
    expect(trackSourceLink(invalid)).toBeUndefined();
});

test("Video Blocks embed only exact YouTube video IDs on the privacy-enhanced host", () => {
  for (const url of [
    "https://youtu.be/8aGhZQkoFbQ",
    "https://youtube.com/shorts/8aGhZQkoFbQ",
    "https://www.youtube.com/watch?v=8aGhZQkoFbQ&t=20",
  ])
    expect(youtubeEmbed(url)).toBe("https://www.youtube-nocookie.com/embed/8aGhZQkoFbQ");
  for (const url of [
    "https://youtube.com.example/watch?v=8aGhZQkoFbQ",
    "https://youtu.be/short",
    "https://youtu.be/8aGhZQkoFbQ/extra",
    "https://youtube.com/watch?v=8aGhZQkoFbQx",
    "ftp://youtu.be/8aGhZQkoFbQ",
  ])
    expect(youtubeEmbed(url)).toBeUndefined();
});
test("Markdown images show escaped alt text as a safe outbound link", () => {
  const html = renderMarkdown(
    "![<diagram>](https://example.org/p.png) ![x](data:image/png;base64,AA) ![x](javascript:alert)",
    "Изображение:",
  );
  expect(html).toContain('href="https://example.org/p.png"');
  expect(html).toContain("Изображение: &lt;diagram&gt;");
  expect(html).toContain('rel="noopener noreferrer"');
  expect(html).toContain('target="_blank"');
  expect(html).not.toMatch(/<img|href="(?:javascript|data):/i);
});

test("Practice Quiz props expose only prompts and options, even for an enriched GET payload", () => {
  const questions = [
    {
      lessonId: "b",
      blockId: "quiz",
      index: 0,
      prompt: "Second Lesson",
      options: ["x", "y"],
      correctIndex: 0,
      explanation: "private",
    },
    {
      lessonId: "a",
      blockId: "quiz",
      index: 1,
      prompt: "Second question",
      options: ["x", "y"],
      correctIndex: 1,
      explanation: "private",
    },
    {
      lessonId: "a",
      blockId: "quiz",
      index: 0,
      prompt: "First question",
      options: ["x", "y"],
      correctIndex: 1,
      explanation: "private",
    },
  ];
  const before = practiceQuizProps(questions);
  expect(before).toEqual({
    questions: [
      { prompt: "Second Lesson", options: ["x", "y"] },
      { prompt: "Second question", options: ["x", "y"] },
      { prompt: "First question", options: ["x", "y"] },
    ],
    result: undefined,
  });
  const submitted = practiceQuizProps(questions, [
    { lessonId: "a", blockId: "quiz", perQuestion: [true, false] },
    { lessonId: "b", blockId: "quiz", perQuestion: [true] },
  ]);
  expect(submitted.result?.perQuestion).toEqual([true, false, true]);
});

test("the Lesson Block projection drops keys, explanations and solutions from enriched Blocks", () => {
  const quiz = {
    id: "q",
    type: "quiz" as const,
    questions: [{ prompt: "Choose", options: ["a", "b"], correctIndex: 1, explanation: "private" }],
  };
  const exercise = {
    id: "e",
    type: "exercise" as const,
    prompt: "Build",
    hints: ["Start here"],
    solution: "private",
  };
  expect(publicBlock(quiz)).toEqual({
    id: "q",
    type: "quiz",
    questions: [{ prompt: "Choose", options: ["a", "b"] }],
  });
  expect(publicBlock(exercise)).toEqual({
    id: "e",
    type: "exercise",
    prompt: "Build",
    hints: ["Start here"],
  });
});
