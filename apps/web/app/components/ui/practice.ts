/** One test of a sandboxed run, as the test runner shows it. */
export interface TestCase {
  id: string;
  name: string;
  /** Left out while the test has not run. */
  result?: "passed" | "failed";
  durationMs?: number;
  expected?: string;
  received?: string;
  /** What the assertion or the thrown error said. */
  message?: string;
}
