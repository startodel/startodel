import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { forUser } from "@startodel/db";
import { z } from "zod";

function jsonResult(value: unknown) {
  if (value === undefined) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: JSON.stringify({ error: "Not found" }) }],
    };
  }
  return { content: [{ type: "text" as const, text: JSON.stringify(value) }] };
}

export function createToolServer(data: ReturnType<typeof forUser>) {
  const server = new McpServer({ name: "Startodel", version: "1.0.0" });
  const empty = z.strictObject({});
  const id = z.guid();
  const title = z.string().regex(/\S/, "Expected a nonempty title");
  server.registerTool(
    "get_profile",
    {
      description:
        "Read your Profile before planning a Track. Returns the Profile with its current goals.",
      inputSchema: empty,
    },
    async () => jsonResult(await data.getProfile()),
  );
  server.registerTool(
    "update_profile",
    {
      description:
        "Replace your Profile's goals when your learning priorities change. Returns the updated Profile.",
      inputSchema: z.strictObject({ goals: z.array(z.string()) }),
    },
    async ({ goals }) => jsonResult(await data.updateProfile(goals)),
  );
  server.registerTool(
    "list_tracks",
    {
      description:
        "List your Tracks when choosing what to study. Returns an array of Tracks with their IDs and titles.",
      inputSchema: empty,
    },
    async () => jsonResult(await data.listTracks()),
  );
  server.registerTool(
    "get_track",
    {
      description:
        "Read one of your Tracks using an ID from list_tracks. Returns the Track or a not found error.",
      inputSchema: z.strictObject({ id }),
    },
    async ({ id }) => jsonResult(await data.getTrack(id)),
  );
  server.registerTool(
    "create_track",
    {
      description:
        "Start a new Track when you choose a learning direction. Returns the created Track with its ID.",
      inputSchema: z.strictObject({ title }),
    },
    async ({ title }) => jsonResult(await data.createTrack(title)),
  );
  server.registerTool(
    "update_track",
    {
      description:
        "Rename one of your Tracks when its focus changes. Returns the updated Track or a not found error.",
      inputSchema: z.strictObject({ id, title }),
    },
    async ({ id, title }) => jsonResult(await data.updateTrack(id, title)),
  );
  return server;
}
