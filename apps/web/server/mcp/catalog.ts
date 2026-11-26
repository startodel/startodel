import { LessonBlocks, TopicSlug } from "@startodel/core";
import { z } from "zod";
import {
  entityUrl,
  id,
  resolveTopic,
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
    "Search your Topic Catalog by optional literal slug prefix. Returns Topics with Mastery levels (0 if unassessed).",
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
    z
      .strictObject({ slug: TopicSlug.optional(), id: id.optional() })
      .refine((r) => (r.slug !== undefined) !== (r.id !== undefined), "Supply a slug or an ID"),
    async ({ slug, id }) => {
      const topicId = id ?? (await data.getTopicBySlug(slug!))?.id;
      const details = topicId && (await data.getTopicDetails(topicId));
      if (details)
        return {
          ...details,
          topic: { ...details.topic, url: entityUrl(origin, "topics", details.topic.id) },
        };
    },
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
    "Read a Track with ordered Topics, Mastery, Lesson and read counts, internal edges and suggested Topics whose prerequisites all reached level 2.",
    z.strictObject({ trackId: id }),
    async ({ trackId }) => {
      const graph = await data.getTrackGraph(trackId);
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
      return { ...graph, edges };
    },
  );
  function lessonLink<T extends { id: string }>(row: T) {
    return { ...row, url: entityUrl(origin, "lessons", row.id) };
  }
  const lesson = z.strictObject({ title, summary, blocks: LessonBlocks });
  register(
    "create_lesson",
    "Append a Lesson to a Topic by slug or ID. Supply up to 200 ordered Blocks with unique IDs. Returns the full Lesson.",
    lesson.extend({ topic: topicRef }),
    async ({ topic, ...input }) => {
      const parent = await resolveTopic(data, topic);
      if (!parent) return;
      const row = await data.createLesson({ ...input, topicId: parent.id });
      if (row) return lessonLink(row);
    },
  );
  register(
    "update_lesson",
    "Patch a Lesson by ID. Supplying blocks replaces all Blocks (up to 200). Returns the full updated Lesson.",
    lesson.partial().extend({ lessonId: id }),
    ({ lessonId, ...patch }) => data.updateLesson(lessonId, patch),
  );
  register(
    "get_lesson",
    "Read one full Lesson with ordered Blocks before teaching or editing it.",
    z.strictObject({ lessonId: id }),
    async ({ lessonId }) => {
      const row = await data.getLesson(lessonId);
      if (row) return lessonLink(row);
    },
  );
  register(
    "list_lessons",
    "Find a Topic's Lessons by Topic Slug or ID. Returns ordered summaries with read timestamps.",
    z.strictObject({ topic: topicRef }),
    async ({ topic }) => {
      const parent = await resolveTopic(data, topic);
      if (parent) return (await data.listLessonSummaries(parent.id)).map(lessonLink);
    },
  );
}
