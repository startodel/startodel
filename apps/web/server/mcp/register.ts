import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { forUser } from "@startodel/db";
import { TopicSlug } from "@startodel/core";
import { z } from "zod";

export type UserData = ReturnType<typeof forUser>;
export const id = z.guid();
export const topicRef = z.union([id, TopicSlug]).describe("Topic Slug or ID in your Topic Catalog");
export const lessonLookup = z
  .strictObject({ id: id.optional(), lessonId: id.optional() })
  .refine((ref) => !!ref.id !== !!ref.lessonId, "Supply exactly one id or lessonId");

export function catalogKey({ id, slug }: { id?: string; slug?: string }) {
  return id ?? { slug: slug! };
}

export const title = z.string().regex(/\S/, "Expected nonempty text");
export const empty = z.strictObject({});
export const summary = z.string().nullable().optional();
export const limit = z.int().min(1).max(100);

export async function resolveTopic(data: UserData, ref: string) {
  if (id.safeParse(ref).success) {
    const topic = await data.getTopic(ref);
    if (topic) return topic;
  }
  return data.getTopicBySlug(ref);
}

export function entityUrl(origin: string, collection: "topics" | "lessons" | "grills", id: string) {
  return new URL(`/${collection}/${id}`, origin).href;
}

// These Profile and Track responses have existing clients that compare the Owner field.
const retainsOwner = new Set([
  "get_profile",
  "update_profile",
  "list_tracks",
  "get_track",
  "create_track",
  "update_track",
  "set_track_visibility",
]);
type ToolValue = Record<string, unknown> | unknown[];
function toolResult(name: string, value: ToolValue, isError = false) {
  const text = JSON.stringify(
    value,
    retainsOwner.has(name) ? undefined : (key, field) => (key === "userId" ? undefined : field),
  );
  // Normalize Dates and omitted fields exactly as the legacy JSON text does.
  const json: ToolValue = JSON.parse(text);
  return {
    ...(isError && { isError }),
    content: [{ type: "text" as const, text }],
    structuredContent: Array.isArray(json) ? { items: json } : json,
  };
}

export function registerTools(server: McpServer) {
  return function register<Shape extends z.ZodRawShape>(
    name: string,
    description: string,
    inputSchema: z.ZodObject<Shape, z.core.$strict>,
    run: (args: z.output<typeof inputSchema>) => PromiseLike<ToolValue | undefined>,
  ) {
    server.registerTool<never, typeof inputSchema>(
      name,
      { description, inputSchema },
      async (args) => {
        try {
          const value = await run(args);
          if (value !== undefined) return toolResult(name, value);
          return toolResult(name, { error: "Not found" }, true);
        } catch (error) {
          const message = error instanceof RangeError ? error.message : "Tool operation failed";
          return toolResult(name, { error: message }, true);
        }
      },
    );
  };
}
export type Register = ReturnType<typeof registerTools>;
