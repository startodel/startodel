import { expect, test } from "vite-plus/test";
import * as core from "@startodel/core";

test("the public core package exposes only types", () => {
  expect(Object.keys(core)).toEqual([]);
});
