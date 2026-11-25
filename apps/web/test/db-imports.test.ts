import * as database from "@startodel/db";
import * as tables from "@startodel/db/schema";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { expect, test } from "vite-plus/test";

test("HTTP handlers and MCP Tools access the database only through its public entry point", () => {
  const server = fileURLToPath(new URL("../server/", import.meta.url));
  const violations: string[] = [];
  for (const entry of readdirSync(server, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !/\.[cm]?[jt]s$/.test(entry.name)) continue;
    const path = join(entry.parentPath, entry.name);
    const { importedFiles } = ts.preProcessFile(readFileSync(path, "utf8"), true, true);
    const route = relative(server, path);
    const isPublic = route.startsWith("api/public/") || route === "routes/sitemap.xml.get.ts";
    for (const { fileName } of importedFiles) {
      if (
        isPublic &&
        !["nuxt/server", "@startodel/core"].includes(fileName) &&
        !/^(?:\.\.\/)+(?:lib\/public-reader|utils\/input|shared\/locale)$/.test(fileName)
      ) {
        violations.push(route + " imports " + fileName);
      }
      if (
        route.startsWith("api/") &&
        !isPublic &&
        (fileName.startsWith("@startodel/db") || /\/lib\/(?:pool|public-reader)$/.test(fileName))
      ) {
        violations.push(route + " imports " + fileName);
      }
      if (/(?:^@startodel\/db\/|(?:^|\/)packages\/db\/)/.test(fileName)) {
        violations.push(`${relative(server, path)} imports ${fileName}`);
      }
    }
  }
  expect(violations).toEqual([]);
});

test("the public database entry point exposes no raw schema tables, including MCP Tokens", () => {
  const exports = new Set<unknown>(Object.values(database));
  expect(Object.entries(tables).filter(([, table]) => exports.has(table))).toEqual([]);
});
