import { z } from "zod";

const reserved = new Set(
  "api auth brand dashboard design en favicon.ico grills health lessons login mcp og onboarding progress reviews robots.txt ru rules settings sitemap.xml terms topics tracks u".split(
    " ",
  ),
);
export const PublicHandle = z
  .string()
  .max(40)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  .refine((handle) => !reserved.has(handle));
const linkUrl = z
  .url({ protocol: /^https$/, hostname: z.regexes.domain })
  .max(2048)
  .refine((value) => {
    if (!URL.canParse(value)) return false;
    const url = new URL(value);
    return value.startsWith("https://") && !/[\s\\]/.test(value) && !url.username && !url.password;
  });
export const ProfileLink = z.strictObject({
  url: linkUrl,
  label: z.string().trim().min(1).max(60).optional(),
  kind: z.enum(["website", "github", "telegram", "youtube"]).optional(),
});
export type ProfileLink = z.infer<typeof ProfileLink>;
export const PublicProfilePatch = z
  .strictObject({
    handle: PublicHandle,
    headline: z.string().trim().max(100).nullable(),
    bio: z.string().trim().max(360).nullable(),
    links: z.array(ProfileLink).max(6),
    publicProfileEnabled: z.boolean(),
    showActivityHeatmap: z.boolean(),
    includePrivateActivity: z.boolean(),
    showLearningProgress: z.boolean(),
    pinnedTrackIds: z
      .array(z.uuid())
      .max(6)
      .refine((ids) => new Set(ids).size === ids.length),
  })
  .partial();
export type PublicProfilePatch = z.infer<typeof PublicProfilePatch>;
