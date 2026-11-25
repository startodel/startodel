# Design concept: Signal

Startodel looks like an instrument for reading a circuit board. This document explains the idea, then the rules that follow from it. The tokens, components and sample screens live in the design showcase at `/design`. [ADR 0017](../adr/0017-design-system.md) records the technical decisions.

## The idea

**Knowledge is a board. You bring it online.**

The domain already has the shape of a circuit. A Track Graph is a set of Topics joined by TopicEdges. The external agent draws that graph before the learner studies anything. Printed circuit boards call their copper paths _tracks_, and the product is named after a track. The concept takes that coincidence literally.

| Domain                  | On the board                                           |
| ----------------------- | ------------------------------------------------------ |
| Track                   | A board                                                |
| Topic                   | A part on the board, with a designator such as `T07`   |
| TopicEdge               | A trace from the prerequisite to the Topic it unlocks  |
| Mastery 0 to 4          | Signal strength: four bars, a numeral and a name       |
| A Topic at Mastery 2    | A live part. Its outgoing traces turn copper           |
| A Topic you cannot open | A part with no signal on one of its inputs             |
| GrillSession            | A bench test: probe each point, wait, read the result  |
| Verdict                 | A pad that is full, half or hollow                     |
| ReviewItem              | A part that is due for a check before its signal fades |

The external agent designs the board. The learner makes it work. The interface never pretends to be the agent: it has no chat bubbles, no sparkles and no generated illustrations. It is the bench where the work is read.

## Why this concept

The audience is experienced developers. They read dashboards, diffs and diagrams all day. They distrust decoration and notice craft. Three requirements follow.

1. **The graph must be the hero.** The Track Graph is what makes Startodel different from a list of courses. A metaphor that makes the graph meaningful is worth more than one that decorates the pages around it.
2. **Progress must be legible at a glance and without colour.** Mastery has five levels and a Verdict has three. About one man in twelve has a colour vision deficiency, so neither scale can depend on hue.
3. **Reading must be comfortable for a long time.** A Lesson is long-form text with code. It needs a real reading typeface and a calm page.

A board answers all three. Traces explain prerequisites without a legend. Signal bars are a shape every developer already reads on a phone. A schematic is quiet by nature, so the long-form text can take the attention.

## Principles

1. **Signal over decoration.** Copper appears only where something is live: the primary action, progress, a completed Topic, the current place. A screen with no copper has nothing waiting for the learner.
2. **Three voices.** Mono speaks for the system. Sans runs the controls. A serif carries everything the learner studies or writes.
3. **Shape before colour.** Every state has a shape and a word. Colour repeats them.
4. **Cut, not moulded.** Hairlines, tight corners and hard edges. Nothing blurs, glows or floats without a reason.
5. **One primary action per view.** It is the only filled copper control on the screen, and it matches the Next Step.

## Colour: copper on ink

The palette is a set of metals on a board.

- **Board.** Light theme: warm drafting paper. Dark theme: the green-black of a solder mask. Neither is pure white or pure black.
- **Ink.** Three steps of text. All three pass WCAG AA on every board layer.
- **Copper.** The single accent. It marks action and signal.
- **Patina.** Semantic colours named after what metals become: verdigris for strong and success, brass for partial and caution, oxide for weak and danger, steel for information and production notes.

Dark is the bench at night and light is the drawing in daylight. Both themes come from one set of `light-dark()` declarations, so they cannot drift apart. `apps/web/test/design-tokens.test.ts` checks the contrast of every documented pair in both themes.

The palette avoids purple, gradients and translucent panels on purpose. Those are the marks of a generic product page, and they would compete with the one colour that carries meaning here.

## Typography: three voices

All three families are open source, cover Latin and Cyrillic, and are served from the site.

| Voice    | Typeface                | Used for                                                                    |
| -------- | ----------------------- | --------------------------------------------------------------------------- |
| System   | Martian Mono, condensed | Page titles, labels, designators, readouts and code                         |
| Controls | Onest                   | Buttons, forms, navigation, tables and short interface text                 |
| Reading  | Literata                | Lesson text, Track and Lesson titles, Grill Questions and the answers given |

Martian Mono at 75% width gives headlines the look of silkscreen lettering on a board while staying compact. The same family at 87.5% width sets code, so the brand voice and the code voice are related. Literata was designed for long reading on screens and has optical sizes, so a Lesson title and a paragraph each get the right cut. Onest stays out of the way.

The split also tells the learner who is speaking. Mono text is the system reporting a fact. Serif text is content written for the learner, or by them.

## Mastery and Verdict

**Mastery** is drawn as four ascending bars with a numeral and the level name, for example `▂▄▆_ 3 explain`. Level 0 shows four outlined bars, so "no evidence" still has a shape. The bars use one copper ramp. Nothing depends on telling two hues apart.

**Verdict** is drawn as a pad with a word: a full pad for strong, a half pad for partial and a hollow pad for weak. Two more states cover a Grill Question before judgment: a dashed ring for an answer awaiting its Verdict and a small dot for no answer.

## The Track board

The board is the hero of the product and of the landing page.

- A Topic is a part: a plate with its designator, title and Mastery bars.
- A TopicEdge is a trace. It runs horizontally and vertically with 45-degree corners, as on a real board, and ends in a pad at each part.
- A trace is live when its source Topic is complete, which the domain defines as Mastery 2 or higher. Live traces are solid copper. Other traces are dashed tin.
- A Topic is ready when every incoming trace is live. Ready parts carry a copper outline. Blocked parts are dimmed and show a lock.
- The dot grid appears behind the board and behind empty states only. Everywhere else the ground is plain.

On a narrow container the same data is shown as a list in topological order, because a wide graph on a phone is a poor way to choose what to study.

## Navigation

- **Rail.** Wide containers get a left rail with the five places of the product, then the learner's Tracks with their progress. The rail collapses to icons to give the board more room.
- **Tab bar.** Narrow containers get a bottom bar with the same five places, within reach of a thumb.
- **Top bar.** A mono breadcrumb path shows where the learner is. Page actions sit on the right.

The current place is marked by a short copper trace that enters the item from the edge of the rail.

## Lesson reading

A Lesson is a single column at a measure of about 68 characters, set in Literata at 18px. Each Block carries a small mono designator in the margin, `B01` to `B07`, with its kind. The margin also makes a quiet index of the Lesson.

- A Theory Block is plain prose.
- A Code Block is set in the mono voice on a sunken plate, highlighted with the same metals as the interface.
- A Callout Block has an icon, a word and a coloured edge: brass for a gotcha, steel for a production note and verdigris for a tip.
- A Link Block and a Video Block are plates that state where they lead before the learner follows them. A video loads only when asked.
- A Quiz offers options as keycaps numbered from 1, so it can be answered from the keyboard.
- An Exercise keeps its hints and solution closed until the learner asks for them.

## Grill flow

A GrillSession is a bench test with three states, and the interface names each one.

1. **Answering.** One Grill Question at a time, in the reading voice. A strip of pads shows the whole session and the current position.
2. **Awaiting verdicts.** Answers are sent. The pads turn to dashed rings. The page shows the prompt to give the external agent and says plainly that it is waiting.
3. **Judged.** Each pad takes its Verdict shape. The summary counts strong, partial and weak answers and shows which Topics moved.

## Motifs

- **Trace rule.** A hairline that ends in a pad. It is used for section headings.
- **Pads.** A ring is pending. A filled dot is done.
- **Designators.** `T04`, `L02`, `B05` and `Q07` in the mono voice. They make any item easy to cite to the external agent.
- **Radii.** 2, 4, 6 and 10px. Nothing is pill-shaped except a pad.
- **Shadows.** Hard-edged in the light theme. The dark theme relies on outlines.
- **Motion.** 120, 200 and 320ms with one easing curve. Current flows along live traces. Everything stops when the system asks for reduced motion.

## Brand

The mark is a trace in the shape of an S. It leaves a filled pad, the start, and arrives at an open via, the next thing to learn. The wordmark is `startodel` in Martian Mono, condensed and lower-case. The favicon is the mark in copper on an ink tile. The Open Graph image places the wordmark beside a fragment of a board.

Brand files are in `apps/web/public/brand/`. The Open Graph template is at `/design/og`.

## What the design avoids

- Purple, gradients and glass panels.
- Emoji used as icons.
- Rounded "friendly" shapes and illustrations of people.
- Any chat-style presentation of the external agent.
- Colour as the only carrier of a state.
