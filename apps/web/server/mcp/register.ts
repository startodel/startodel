import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { forUser } from "@startodel/db";
import { TopicSlug } from "@startodel/core";
import { z } from "zod";

export type UserData = ReturnType<typeof forUser>;
export const id = z.guid();
export const topicRef = z.union([id, TopicSlug]).describe("Topic Slug or ID in your Topic Catalog");
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

export function registerTools(server: McpServer) {
  return function register<Shape extends z.ZodRawShape>(
    name: string,
    description: string,
    inputSchema: z.ZodObject<Shape, z.core.$strict>,
    run: (args: z.output<typeof inputSchema>) => PromiseLike<unknown>,
  ) {
    server.registerTool<never, typeof inputSchema>(
      name,
      { description, inputSchema },
      async (args) => {
        try {
          const value = await run(args);
          if (value !== undefined)
            return { content: [{ type: "text", text: JSON.stringify(value) }] };
          return {
            isError: true,
            content: [{ type: "text", text: JSON.stringify({ error: "Not found" }) }],
          };
        } catch (error) {
          const message = error instanceof RangeError ? error.message : "Tool operation failed";
          return {
            isError: true,
            content: [{ type: "text", text: JSON.stringify({ error: message }) }],
          };
        }
      },
    );
  };
}
export type Register = ReturnType<typeof registerTools>;
