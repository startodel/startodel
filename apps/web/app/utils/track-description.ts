const sentences = new Intl.Segmenter("en", { granularity: "sentence" });
const leadLimit = 200;

/** Keep the opening pitch short while preserving Markdown blocks in the overview. */
export function splitTrackDescription(description?: string | null) {
  const text = description?.trim().replace(/\r\n?/g, "\n") ?? "";
  const blockEnd = text.search(/\n[ \t]*(?:\n|(?:[-*+]|\d+[.)])\s)/);
  const firstBlock = blockEnd < 0 ? text : text.slice(0, blockEnd);
  let lead = "";
  let count = 0;
  for (const { index, segment } of sentences.segment(firstBlock)) {
    const end = index + segment.trimEnd().length;
    if (end > leadLimit) break;
    lead = firstBlock.slice(0, end);
    if (++count === 2) break;
  }
  if (!lead && firstBlock) {
    // Preserve an overlong first sentence intact for readers below the graph.
    const excerpt = firstBlock.slice(0, leadLimit).replace(/\s+\S*$/, "");
    return { lead: excerpt + "…", overview: text };
  }
  return {
    lead: lead.replace(/^(?:[-*+]|\d+[.)])\s+/, ""),
    overview: text.slice(lead.length).trim(),
  };
}
