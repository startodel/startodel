import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ProfileQuestionnaire, TrackSlug, TrackSources } from "@startodel/core";
import { z } from "zod";
import { empty, id, registerTools, summary, title, type UserData } from "./register";
import { registerCatalog } from "./catalog";
import { registerPractice } from "./practice";
import { guide, instructions, sections } from "./guide";

export function createToolServer(data: UserData, origin: string) {
  const server = new McpServer({ name: "Startodel", version: "1.0.0" }, { instructions });
  const register = registerTools(server);
  register(
    "get_profile",
    "Read your Profile and Onboarding Questionnaire before planning a Track.",
    empty,
    () => data.getProfile(),
  );
  register(
    "update_profile",
    "Save confirmed questionnaire answers. Supplied lists replace their contents. Set markOnboarded when complete. Returns the updated Profile.",
    ProfileQuestionnaire.omit({ onboardedAt: true })
      .partial()
      .extend({ markOnboarded: z.boolean().optional() }),
    ({ markOnboarded, ...patch }) =>
      data.updateProfile({ ...patch, ...(markOnboarded ? { onboardedAt: new Date() } : {}) }),
  );
  register(
    "list_tracks",
    "List your Tracks, including IDs and sources, to choose what to study.",
    empty,
    () => data.listTracks(),
  );
  register(
    "get_track",
    "Read the details and sources of one Track by ID.",
    z.strictObject({ id }),
    ({ id }) => data.getTrack(id),
  );
  const track = z.strictObject({
    title,
    slug: TrackSlug.optional(),
    description: summary,
    sources: TrackSources.optional(),
  });
  register(
    "create_track",
    "Create a Track for a learning goal. Optionally supply a description and sources (one GitHub repo and up to 20 documentation links). Returns the Track.",
    track,
    (input) => data.createTrack(input),
  );
  register(
    "update_track",
    "Revise a Track by ID. Supplied sources replace previous sources. Returns the updated Track.",
    track.partial().extend({ id }),
    ({ id, ...patch }) => data.updateTrack(id, patch),
  );
  register(
    "set_track_visibility",
    "Never publish or unpublish unless the user explicitly asked in this conversation. Publishing requires current Terms Acceptance in the Startodel app.",
    z.strictObject({ trackId: id, public: z.boolean() }),
    async ({ trackId, public: visible }) => {
      try {
        return await data.setTrackVisibility(trackId, visible);
      } catch (error) {
        if (error instanceof RangeError)
          throw new RangeError(
            error.message +
              " Ask them to open " +
              origin +
              "/tracks/" +
              trackId +
              " and publish there once.",
          );
        throw error;
      }
    },
  );
  registerCatalog(register, data);
  registerPractice(register, data);
  register(
    "get_guide",
    "Call first and after completing a learning step. Returns your current counts, recommended next steps and relevant guide sections.",
    empty,
    () => guide(data),
  );
  for (const section of sections) {
    server.registerResource(
      section.id,
      section.uri,
      { title: section.title, mimeType: "text/markdown" },
      async (uri) => ({
        contents: [{ uri: uri.href, mimeType: "text/markdown", text: section.body }],
      }),
    );
  }
  return server;
}
