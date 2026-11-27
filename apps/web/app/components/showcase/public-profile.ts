import { sampleProfile, samplePublicTracks } from "./sample";

export const specimenTracks = samplePublicTracks.map((track, i) => ({
  ...track,
  topicCount: track.topics,
  forkCount: track.forks,
  pinOrder: i === 0 ? 1 : null,
  updatedAt: "2026-10-22",
  id: "00000000-0000-4000-8000-00000000000" + i,
}));
export const specimenSettings = {
  handle: sampleProfile.login,
  bio: sampleProfile.bio,
  headline: "Backend engineer",
  links: [{ url: "https://example.org/notes", label: "Field notes" }],
  publicProfileEnabled: true,
  showActivityHeatmap: true,
  includePrivateActivity: false,
  showLearningProgress: true,
  tracks: specimenTracks,
};
const days = Array.from({ length: 100 }, (_, i) => ({
  date: new Date(Date.UTC(2026, 10, 1) - i * (1 + (i % 3)) * 86400000).toISOString().slice(0, 10),
  count: 1 + (i % 9),
})).filter((d, i, all) => all.findIndex((v) => v.date === d.date) === i);
export const specimenProfile = {
  ...specimenSettings,
  name: sampleProfile.name,
  login: sampleProfile.login,
  avatarUrl: null,
  heatmap: { through: "2026-11-01", days, total: days.reduce((sum, d) => sum + d.count, 0) },
  learningProgress: [
    { title: specimenTracks[0]!.title, slug: specimenTracks[0]!.slug, counts: [2, 4, 3, 2, 1] },
  ],
};
