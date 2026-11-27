import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ProfilePatch, TrackLanguage, TrackSlug, TrackSources } from "@startodel/core";
import { z } from "zod";
import { privateTrackPath } from "../../shared/locale";
import { empty, id, registerTools, summary, title, type UserData } from "./register";
import { registerCatalog } from "./catalog";
import { registerPractice } from "./practice";
import { guide, instructions, sections } from "./guide";

export function createToolServer(data: UserData, origin: string) {
  const server = new McpServer({ name: "Startodel", version: "1.0.0" }, { instructions });
  const register = registerTools(server);
  register(
    "get_profile",
    "Read your Profile and Onboarding Questionnaire before planning a Track. Includes your GitHub login and preferred UI language (ru, en or null). Use it with what you already know to choose the starting Topic, depth, pace, prerequisites, project examples and learning language. Teach in the requested technology.",
    empty,
    () => data.getProfileWithLogin(),
  );
  register(
    "update_profile",
    "Save confirmed questionnaire answers. Set preferredLanguage to ru or en, or null to clear it. Supplied lists replace their contents. Set markOnboarded when complete. Returns the updated Profile.",
    ProfilePatch.omit({ onboardedAt: true }).extend({ markOnboarded: z.boolean().optional() }),
    ({ markOnboarded, ...patch }) =>
      data.updateProfile({ ...patch, ...(markOnboarded ? { onboardedAt: new Date() } : {}) }),
  );
  type Track = NonNullable<Awaited<ReturnType<UserData["getTrack"]>>>;
  function trackLinks(track: Track, login?: string) {
    return {
      ...track,
      url: new URL(privateTrackPath(track.slug), origin).href,
      ...(track.public &&
        login && {
          publicUrl: new URL(`/u/${encodeURIComponent(login)}/${track.slug}`, origin).href,
        }),
    };
  }
  register(
    "list_tracks",
    "List your Tracks, including IDs, content language and sources, to choose what to study.",
    empty,
    async () => {
      const tracks = await data.listTracks();
      const login = tracks.some((t) => t.public) ? await data.getPublicLogin() : undefined;
      return tracks.map((t) => trackLinks(t, login));
    },
  );
  register(
    "get_track",
    "Read one of your Tracks by exactly one UUID id or Track slug. Returns its content language, canonical url and, when published at your login, publicUrl.",
    z
      .strictObject({ id: id.optional(), slug: TrackSlug.optional() })
      .refine(
        (ref) => (ref.id !== undefined) !== (ref.slug !== undefined),
        "Supply exactly one Track id or slug",
      ),
    async ({ id, slug }) => {
      const track = id ? await data.getTrack(id) : await data.getTrackBySlug(slug!);
      if (track) return trackLinks(track, track.public ? await data.getPublicLogin() : undefined);
    },
  );
  const track = z.strictObject({
    title,
    slug: TrackSlug.optional(),
    language: TrackLanguage.optional(),
    description: summary,
    sources: TrackSources.optional(),
  });
  register(
    "create_track",
    "Create a Track for a learning goal. Set language explicitly when you know the content language (lowercase tag such as pt-br). Describe the learning outcome and scope in one or two sentences. Put versioned references in sources (one GitHub repo and up to 20 documentation links). Returns the Track.",
    track,
    async (input) => trackLinks(await data.createTrack(input)),
  );
  register(
    "update_track",
    "Revise a Track by ID. Set language when correcting the content language. Keep the description to one or two sentences on the learning outcome and scope. Put versioned references in sources. Supplied sources replace previous sources. Returns the updated Track.",
    track.partial().extend({ id }),
    async ({ id, ...patch }) => {
      const track = await data.updateTrack(id, patch);
      if (track) return trackLinks(track, track.public ? await data.getPublicLogin() : undefined);
    },
  );
  register(
    "set_track_visibility",
    "Never publish or unpublish unless the user explicitly asked in this conversation. Publishing requires current Terms Acceptance in the Startodel app.",
    z.strictObject({ trackId: id, public: z.boolean() }),
    async ({ trackId, public: visible }) => {
      try {
        return await data.setTrackVisibility(trackId, visible);
      } catch (error) {
        if (error instanceof RangeError) {
          const track = await data.getTrack(trackId);
          if (!track) return;
          throw new RangeError(
            `${error.message} Ask them to open ${trackLinks(track).url} and publish there once.`,
          );
        }
        throw error;
      }
    },
  );
  registerCatalog(register, data, origin);
  registerPractice(register, data, origin);
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
