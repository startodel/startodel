# 10. GrillSessions and agent-judged answers

## Status

Accepted

## Context

The learner can answer in the UI or through an MCP client. Their external agent needs the same question history in either case.

## Decision

Persist GrillSessions and their ordered Grill Questions, optionally associated with a Track and Topic respectively. Record the Answer Source, answer time, Verdict, feedback and judgment time. The external agent chooses questions and judges free text. The server stores these judgments without running a language model.

Default the target size to 15. For a Track, consider its member Topics. Otherwise consider the Owner's whole Topic Catalog. Return due ReviewItems first, oldest due first, then remaining Topics by ascending Mastery, with each Topic appearing once.

## Consequences

Deleting a Track detaches its GrillSessions so its question history remains available to the Owner. Finishing a GrillSession closes question entry and answer submission. The external agent can judge an existing answer later. A weak or partial Verdict for a Topic creates or refreshes its ReviewItem in the same transaction as the judgment.
