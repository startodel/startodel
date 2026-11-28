import { expect, test } from "vite-plus/test";
import { lineDiff, textLines } from "../app/utils/line-diff";

const marks = { same: " ", removed: "-", added: "+" };
const render = (before: string, after: string) =>
  lineDiff(before, after).map((line) => marks[line.type] + line.text);

test("identical texts have no changed lines", () => {
  expect(render("a\nb\nc", "a\nb\nc")).toEqual([" a", " b", " c"]);
});

test("a replaced line is removed first and added second", () => {
  expect(render("a\nb\nc", "a\nx\nc")).toEqual([" a", "-b", "+x", " c"]);
});

test("every change lists its removed lines before its added lines", () => {
  expect(render("a\nb\nc\nd", "x\na\ny\nz\nd")).toEqual(["+x", " a", "-b", "-c", "+y", "+z", " d"]);
  const types = lineDiff("one\ntwo\nthree\nfour", "two\nsix\nfour\nfive\none").map((l) => l.type);
  for (let i = 1; i < types.length; i++)
    expect([types[i - 1], types[i]]).not.toEqual(["added", "removed"]);
});

test("the unchanged lines are a longest common subsequence", () => {
  const lines = lineDiff("a\nb\nc\na\nb\nb\na", "c\nb\na\nb\na\nc");
  expect(lines.filter((line) => line.type === "same")).toHaveLength(4);
});

test("lines carry their position on the side they belong to", () => {
  expect(lineDiff("a\nb\nc", "a\nc\nd")).toEqual([
    { type: "same", text: "a", before: 0, after: 0 },
    { type: "removed", text: "b", before: 1 },
    { type: "same", text: "c", before: 2, after: 1 },
    { type: "added", text: "d", after: 2 },
  ]);
});

test("each side can be rebuilt from the result", () => {
  const before = "const a = 1;\n\nfunction f() {\n  return a;\n}\n";
  const after = "const a = 2;\n\nfunction g() {\n  return a;\n}\n\nexport { g };\n";
  const lines = lineDiff(before, after);
  expect(lines.filter((l) => l.type !== "added").map((l) => l.text)).toEqual(textLines(before));
  expect(lines.filter((l) => l.type !== "removed").map((l) => l.text)).toEqual(textLines(after));
});

test("an empty side yields only additions or only removals", () => {
  expect(render("", "a\nb")).toEqual(["+a", "+b"]);
  expect(render("a\nb", "")).toEqual(["-a", "-b"]);
  expect(render("", "")).toEqual([]);
});

test("a trailing line break and Windows line endings do not count as changes", () => {
  expect(render("a\r\nb\r\n", "a\nb")).toEqual([" a", " b"]);
  expect(textLines("a\n\n")).toEqual(["a", ""]);
});
