import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { expect, test } from "vite-plus/test";

test("web server modules never import raw database schema tables", () => {
  const server = fileURLToPath(new URL("../server/", import.meta.url));
  const violations: string[] = [];
  for (const entry of readdirSync(server, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !/\.[cm]?[jt]s$/.test(entry.name)) continue;
    const path = join(entry.parentPath, entry.name);
    const { importedFiles } = ts.preProcessFile(readFileSync(path, "utf8"), true, true);
    for (const { fileName } of importedFiles) {
      if (/(?:^@startodel\/db\/|(?:^|\/)packages\/db\/).*\bschema\b/.test(fileName)) {
        violations.push(`${relative(server, path)} imports ${fileName}`);
      }
    }
  }
  expect(violations).toEqual([]);
});
