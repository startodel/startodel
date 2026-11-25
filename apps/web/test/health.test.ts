import { afterEach, expect, test, vi } from "vite-plus/test";

import { databaseHealth } from "../server/utils/database-health";

afterEach(() => vi.unstubAllEnvs());

test.each([
  ["missing", undefined],
  ["unreachable", "postgresql:///startodel_test?host=/nonexistent/startodel-test-socket"],
])("health reports the database is down when DATABASE_URL is %s", async (_, url) => {
  vi.stubEnv("DATABASE_URL", url);
  expect(await databaseHealth()).toEqual({ ok: false, db: "down" });
});
