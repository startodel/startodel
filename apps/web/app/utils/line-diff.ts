export interface DiffLine {
  type: "same" | "removed" | "added";
  text: string;
  /** The line's index in the before text, from 0. An added line has none. */
  before?: number;
  /** The line's index in the after text, from 0. A removed line has none. */
  after?: number;
}

/** A trailing line break ends the last line and does not start an empty one. */
export function textLines(text: string) {
  const normal = text.replace(/\r\n?/g, "\n").replace(/\n$/, "");
  return normal ? normal.split("\n") : [];
}

/**
 * Compare two texts line by line, keeping their longest common subsequence of lines.
 * Within one change the removed lines come first and the added lines follow.
 */
export function lineDiff(before: string, after: string): DiffLine[] {
  const a = textLines(before);
  const b = textLines(after);
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;
  let tail = 0;
  while (
    tail < a.length - head &&
    tail < b.length - head &&
    a[a.length - 1 - tail] === b[b.length - 1 - tail]
  )
    tail++;
  const rows = a.length - head - tail;
  const columns = b.length - head - tail;
  // common[i][j] is the length of the longest common subsequence of a[head + i..] and b[head + j..].
  const common = Array.from({ length: rows + 1 }, () => new Uint32Array(columns + 1));
  for (let i = rows - 1; i >= 0; i--)
    for (let j = columns - 1; j >= 0; j--)
      common[i]![j] =
        a[head + i] === b[head + j]
          ? common[i + 1]![j + 1]! + 1
          : Math.max(common[i + 1]![j]!, common[i]![j + 1]!);

  const result: DiffLine[] = [];
  const same = (i: number, j: number) =>
    result.push({ type: "same", text: a[i]!, before: i, after: j });
  for (let i = 0; i < head; i++) same(i, i);
  let removed: DiffLine[] = [];
  let added: DiffLine[] = [];
  const flush = () => {
    result.push(...removed, ...added);
    removed = [];
    added = [];
  };
  let i = 0;
  let j = 0;
  while (i < rows || j < columns) {
    if (i < rows && j < columns && a[head + i] === b[head + j]) {
      flush();
      same(head + i++, head + j++);
    } else if (j === columns || (i < rows && common[i + 1]![j]! >= common[i]![j + 1]!)) {
      removed.push({ type: "removed", text: a[head + i]!, before: head + i++ });
    } else {
      added.push({ type: "added", text: b[head + j]!, after: head + j++ });
    }
  }
  flush();
  for (let k = tail; k > 0; k--) same(a.length - k, b.length - k);
  return result;
}
