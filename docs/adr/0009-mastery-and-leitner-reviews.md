# 9. Mastery and Leitner review scheduling

## Status

Accepted

## Context

Reading a Lesson, demonstrating understanding and needing another review are different observations. The same Topic can occur in several Tracks.

## Decision

Record when a Lesson is read. Store Mastery and optional evidence per Owner and Topic. Use levels 0 (don't know), 1 (read), 2 (apply), 3 (explain) and 4 (internals). A Topic without an assessment starts at level 0 in the Track Graph and candidate list.

Keep one ReviewItem per Owner and Topic. Start in Review Box 0. A strong result advances one box up to 4, a partial result stays in the current box and a weak result returns to 0. Schedule the next review from the time of the result using the interval of the **resulting** box.

| Review Box     | 0   | 1   | 2   | 3   | 4   |
| -------------- | --- | --- | --- | --- | --- |
| Days until due | 1   | 3   | 7   | 16  | 35  |

## Consequences

The pure scheduler works in elapsed 24-hour days and needs only the previous box, Verdict and current time. The data layer serializes results for the same Topic, including simultaneous first reviews. Mastery changes through explicit assessment.
