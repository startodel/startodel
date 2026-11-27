import { LessonBlocks, TopicLookup, TopicSlug } from "@startodel/core";
import { z } from "zod";
import { lessonWarnings } from "./lesson-warnings";
import { privateTrackPath } from "../../shared/locale";
import {
  catalogKey,
  entityUrl,
  id,
  lessonLookup,
  resolveTopic,
  resolveTrack,
  trackRef,
  summary,
  title,
  topicRef,
  type Register,
  type UserData,
} from "./register";

export function registerCatalog(register: Register, data: UserData, origin: string) {
  const topicInput = z.strictObject({ slug: TopicSlug, title, summary });
  const edge = z
    .strictObject({ from: TopicSlug, to: TopicSlug })
    .refine((e) => e.from !== e.to, "Expected distinct endpoints");
  register(
    "upsert_topics",
    "Create or revise up to 100 Topics, once per slug. Returns an object mapping each slug to its Topic ID. Omit summary to keep it, or supply null or an empty string to clear it.",
    z.strictObject({
      topics: z
        .array(topicInput)
        .min(1)
        .max(100)
        .refine(
          (rows) => new Set(rows.map((t) => t.slug)).size === rows.length,
          "Expected unique slugs",
        ),
    }),
    async ({ topics }) =>
      Object.fromEntries((await data.upsertTopics(topics)).map((t) => [t.slug, t.id])),
  );
  register(
    "list_topics",
    "Search your Topic Catalog by optional literal slug prefix. Returns Topics with lessonCount and Mastery levels (0 if unassessed).",
    z.strictObject({
      prefix: z
        .string()
        .max(120)
        .regex(/^[a-z0-9/-]*$/)
        .optional(),
    }),
    async ({ prefix }) =>
      (await data.listTopicsWithMastery(prefix)).map((topic) => ({
        ...topic,
        url: entityUrl(origin, "topics", topic.id),
      })),
  );
  register(
    "get_topic",
    "Inspect a Topic by exactly one slug or ID. Returns its Mastery, Lesson summaries, prerequisites and dependents.",
    TopicLookup,
    async (ref) => {
      const details = await data.getTopicDetails(catalogKey(ref));
      if (details)
        return {
          ...details,
          lessons: details.lessons.map(lessonLink),
          topic: { ...details.topic, url: entityUrl(origin, "topics", details.topic.id) },
        };
    },
  );
  register(
    "update_topic",
    "Revise the title or summary of an existing Topic across its Tracks. Identify it by exactly one id or slug. Omit summary to preserve it or pass null to clear it.",
    TopicLookup.safeExtend({ title: title.optional(), summary }),
    ({ id, slug, ...patch }) => data.updateTopic(catalogKey({ id, slug }), patch),
  );
  register(
    "delete_topic",
    "Permanently delete a Topic from your Topic Catalog and every Track by exactly one id or slug. Removes its memberships, prerequisite edges, Lessons, Lesson Progress, Quiz Attempts, Mastery, ReviewItem and linked Grill Questions. To remove only a membership, use detach_topic_from_track.",
    TopicLookup,
    (ref) => data.deleteTopic(catalogKey(ref)),
  );
  register(
    "add_edges",
    "Add up to 200 prerequisite-to-dependent pairs by slug. Existing edges are retained. Returns the number of supplied pairs after the whole batch succeeds.",
    z.strictObject({ edges: z.array(edge).min(1).max(200) }),
    ({ edges }) => data.addEdges(edges),
  );
  register(
    "remove_edge",
    "Remove a prerequisite relationship by its two slugs. Returns the removed TopicEdge.",
    edge,
    async ({ from, to }) => {
      const [a, b] = await Promise.all([data.getTopicBySlug(from), data.getTopicBySlug(to)]);
      if (a && b) return data.removeEdge(a.id, b.id);
    },
  );
  register(
    "attach_topics_to_track",
    "Put the ordered unique slugs first in the Track and retain other members in order. Returns memberships with Topic id, slug, title and zero-based position. Safe to repeat.",
    z.strictObject({
      trackId: id,
      slugs: z
        .array(TopicSlug)
        .min(1)
        .refine((s) => new Set(s).size === s.length, "Expected unique slugs"),
    }),
    ({ trackId, slugs }) => data.attachTopics(trackId, slugs),
  );
  register(
    "detach_topic_from_track",
    "Remove one membership by Track ID and Topic Slug. Returns the detached membership and preserves the Topic and its Lessons.",
    z.strictObject({ trackId: id, slug: TopicSlug }),
    async ({ trackId, slug }) => {
      const topic = await data.getTopicBySlug(slug);
      if (topic) return data.detachTopicFromTrack(trackId, topic.id);
    },
  );
  register(
    "get_track_graph",
    "Read a Track by track (slug or UUID) or trackId (UUID). Returns its canonical track.url, ordered Topics, Mastery, Lesson and read counts, internal edges and suggested Topics whose prerequisites all reached level 2.",
    z
      .strictObject({ trackId: id.optional(), track: trackRef.optional() })
      .refine((ref) => !!ref.trackId !== !!ref.track, "Supply exactly one trackId or track"),
    async ({ trackId, track }) => {
      const graph = track
        ? await resolveTrack(track, (key) => data.getTrackGraph(key))
        : await data.getTrackGraph(trackId!);
      if (!graph) return;
      const topics = new Map(graph.topics.map((t) => [t.id, t]));
      const edges = graph.edges.map((edge) => {
        const from = topics.get(edge.fromTopicId)!;
        const to = topics.get(edge.toTopicId)!;
        return {
          ...edge,
          fromSlug: from.slug,
          toSlug: to.slug,
          fromTitle: from.title,
          toTitle: to.title,
        };
      });
      return {
        ...graph,
        track: { ...graph.track, url: new URL(privateTrackPath(graph.track.slug), origin).href },
        topics: graph.topics.map((t) => ({ ...t, url: entityUrl(origin, "topics", t.id) })),
        edges,
      };
    },
  );
  function lessonLink<T extends { id: string }>(row: T) {
    return { ...row, url: entityUrl(origin, "lessons", row.id) };
  }
  function writtenLesson(row: NonNullable<Awaited<ReturnType<UserData["getLesson"]>>>) {
    const warnings = lessonWarnings(row);
    return { ...lessonLink(row), ...(warnings.length > 0 && { warnings }) };
  }
  const lessonParent = z
    .strictObject({ topic: topicRef.optional(), ...TopicLookup.shape })
    .refine(
      (ref) => [ref.topic, ref.id, ref.slug].filter(Boolean).length === 1,
      "Supply exactly one topic, id or slug",
    );
  function parentTopic({ topic, id, slug }: z.infer<typeof lessonParent>) {
    if (topic) return resolveTopic(data, topic);
    return data.getTopic(catalogKey({ id, slug }));
  }
  const lesson = z.strictObject({ title, summary, blocks: LessonBlocks });
  const lessonWriting = [
    "The schema accepts up to 200 ordered Blocks with unique IDs. Choose the depth and number of Blocks the Topic needs. Set no writing target for Lesson length or Block count.",
    "Use get_profile and what you already know to set depth, pace and prerequisite review. Teach the requested foundations with examples from the learner’s project or domain. Leave out another framework’s code, terminology and side-by-side comparisons unless the learner explicitly asks to compare in this conversation.",
    "Open with 5–10 lines of code or a concrete scenario before asking for a prediction in a quiz. Put an unscored reflection in a theory Block. Save the answer and its step-by-step explanation for a later theory Block.",
    "Teach one idea per theory Block, typically 60–100 words in one or two short paragraphs. Avoid one-line stubs. Include a substantive Callout. Reserve Callouts for a tip, gotcha, production caveat or takeaway. Name the non-obvious condition and, where relevant, how to detect or address it. Never put prediction questions, Quiz prompts or Exercise prompts in a Callout.",
    "Define jargon on first use. Cite dated or versioned primary sources with labelled links and keep background reading in Track Sources. Use short, direct sentences like a colleague at a whiteboard. Cut filler.",
    "Prefer explicit starterCode and language for a coding Exercise. Otherwise its first prompt fence supplies the starter and its language is inferred.",
    "For the sticky Lesson contents sidebar, set a short, descriptive title on major theory, callout and exercise Blocks. Use a filename for code when it fits. These titles are optional (max 120 characters). Without one, the sidebar uses a phrase from the body, or for code, its explanation or first line. A Quiz entry shows the question count and ignores its optional title. Link and video Blocks require a title.",
  ].join(" ");
  register(
    "create_lesson",
    `Append a Lesson to a Topic. Supply topic (slug or UUID), id (Topic UUID) or slug. Returns the full Lesson with its url and any Markdown warnings. ${lessonWriting}`,
    lessonParent.safeExtend(lesson.shape),
    async ({ topic, id, slug, ...input }) => {
      const parent = await parentTopic({ topic, id, slug });
      if (!parent) return;
      const row = await data.createLesson({ ...input, topicId: parent.id });
      if (row) return writtenLesson(row);
    },
  );
  register(
    "update_lesson",
    `Patch a Lesson by lessonId or id. Supplying blocks replaces all Blocks. Preserve IDs across edits. Returns the full updated Lesson with its url and any Markdown warnings. ${lessonWriting}`,
    lessonLookup.safeExtend(lesson.partial().shape),
    async ({ lessonId, id, ...patch }) => {
      const row = await data.updateLesson(lessonId ?? id!, patch);
      if (row) return writtenLesson(row);
    },
  );
  register(
    "get_lesson",
    "Read one full Lesson by lessonId or id with ordered Blocks before teaching or editing it.",
    lessonLookup,
    async ({ lessonId, id }) => {
      const row = await data.getLesson(lessonId ?? id!);
      if (row) return lessonLink(row);
    },
  );
  register(
    "list_lessons",
    "Find a Topic's Lessons. Supply topic (slug or UUID), id (Topic UUID) or slug. Returns ordered summaries with read timestamps.",
    lessonParent,
    async (ref) => {
      const parent = await parentTopic(ref);
      if (parent) return (await data.listLessonSummaries(parent.id)).map(lessonLink);
    },
  );
}
