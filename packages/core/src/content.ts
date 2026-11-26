import { z } from "zod";

export const TopicSlug = z
  .string()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/);
export type TopicSlug = z.infer<typeof TopicSlug>;

const httpUrl = z.url({ protocol: /^https?$/ }).max(4096);
const repo = httpUrl
  .pipe(z.string().regex(/^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+\/?$/))
  .refine((value) => new URL(value).pathname.split("/").filter(Boolean).length === 2);
export const TrackSources = z.strictObject({
  repo: repo.optional(),
  docs: z.array(httpUrl).max(20).optional(),
});
export type TrackSources = z.infer<typeof TrackSources>;

export const ProfileQuestionnaire = z.strictObject({
  stack: z.array(z.string()),
  experience: z.enum(["junior", "middle", "senior", "lead"]).nullable(),
  yearsOfExperience: z.int().min(0).max(60).nullable(),
  goals: z.array(z.string()),
  notes: z.string().nullable(),
  onboardedAt: z.date().nullable(),
});
export type ProfileQuestionnaire = z.infer<typeof ProfileQuestionnaire>;

export const PreferredLanguage = z.enum(["ru", "en"]);
export type PreferredLanguage = z.infer<typeof PreferredLanguage>;
export const ProfilePatch = ProfileQuestionnaire.extend({
  preferredLanguage: PreferredLanguage.nullable(),
}).partial();
export type ProfilePatch = z.infer<typeof ProfilePatch>;

const id = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/);
const markdown = z.string().min(1).max(50_000);
const title = z.string().min(1).max(500);
const videoUrl = httpUrl.pipe(
  z.string().refine((value) => {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return /^\/[\w-]+\/?$/.test(url.pathname);
    if (!["youtube.com", "www.youtube.com"].includes(url.hostname)) return false;
    if (url.pathname === "/watch") return /^[\w-]+$/.test(url.searchParams.get("v") ?? "");
    return /^\/shorts\/[\w-]+\/?$/.test(url.pathname);
  }, "Expected a YouTube video URL"),
);

const maxQuizQuestions = 10;
export const QuizAnswers = z.array(z.int().nonnegative()).min(1).max(maxQuizQuestions);

const question = z
  .strictObject({
    prompt: markdown,
    options: z.array(z.string().min(1).max(5000)).min(2).max(6),
    correctIndex: z.int().nonnegative(),
    explanation: markdown.optional(),
  })
  .refine((q) => q.correctIndex < q.options.length, {
    path: ["correctIndex"],
    message: "Expected an option index",
  });

export const Block = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("theory"), id, markdown }),
  z.strictObject({
    type: z.literal("code"),
    id,
    language: z.string().min(1).max(100),
    code: markdown,
    explanation: markdown.optional(),
  }),
  z.strictObject({
    type: z.literal("callout"),
    id,
    variant: z.enum(["gotcha", "production", "tip"]),
    markdown,
  }),
  z.strictObject({ type: z.literal("link"), id, url: httpUrl, title, note: markdown.optional() }),
  z.strictObject({ type: z.literal("video"), id, url: videoUrl, title, note: markdown.optional() }),
  z.strictObject({
    type: z.literal("quiz"),
    id,
    questions: z.array(question).min(1).max(maxQuizQuestions),
  }),
  z.strictObject({
    type: z.literal("exercise"),
    id,
    prompt: markdown,
    solution: markdown,
    hints: z.array(markdown).max(20).optional(),
  }),
]);
export type Block = z.infer<typeof Block>;
export const LessonBlocks = z
  .array(Block)
  .max(200)
  .refine(
    (blocks) => new Set(blocks.map((b) => b.id)).size === blocks.length,
    "Block ids must be unique within a Lesson",
  );
export type LessonBlocks = z.infer<typeof LessonBlocks>;

export const TrackSlug = z
  .string()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
