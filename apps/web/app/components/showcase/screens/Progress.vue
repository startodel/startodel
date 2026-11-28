<script setup lang="ts">
import type { ProgressData } from "../../../utils/progress-data";
import { screenPath } from "../sample";
const { t, locale } = useI18n();
const today = useState("progress-day", () => new Date().toISOString().slice(0, 10));
const date = (days: number) => new Date(Date.parse(today.value) + days * 86400000).toISOString();
const data = computed<ProgressData>(() => {
  const tracks = [
    {
      id: "runtime",
      title: t("progressSample.runtime"),
      topics: [
        { title: t("progressSample.stack"), level: 4 },
        { title: t("progressSample.eventLoop"), level: 3 },
        { title: t("progressSample.microtasks"), level: 2 },
        { title: t("progressSample.timers"), level: 1 },
        { title: t("progressSample.streams"), level: 0 },
        { title: t("progressSample.memory"), level: 3 },
        { title: t("progressSample.garbage"), level: 2 },
        { title: t("progressSample.workers"), level: 1 },
        { title: t("progressSample.profiling"), level: 0 },
      ],
    },
    {
      id: "database",
      title: t("progressSample.database"),
      topics: [
        { title: t("progressSample.relations"), level: 3 },
        { title: t("progressSample.keys"), level: 2 },
        { title: t("progressSample.joins"), level: 2 },
        { title: t("progressSample.indexes"), level: 1 },
        { title: t("progressSample.plans"), level: 1 },
        { title: t("progressSample.transactions"), level: 0 },
        { title: t("progressSample.isolation"), level: 0 },
        { title: t("progressSample.locks"), level: 1 },
        { title: t("progressSample.vacuum"), level: 0 },
      ],
    },
    {
      id: "concurrency",
      title: t("progressSample.concurrency"),
      topics: [
        { title: t("progressSample.goroutines"), level: 4 },
        { title: t("progressSample.channels"), level: 3 },
        { title: t("progressSample.buffers"), level: 2 },
        { title: t("progressSample.select"), level: 2 },
        { title: t("progressSample.mutex"), level: 2 },
        { title: t("progressSample.contexts"), level: 1 },
        { title: t("progressSample.races"), level: 0 },
        { title: t("progressSample.pools"), level: 0 },
        { title: t("progressSample.timeouts"), level: 0 },
      ],
    },
  ];
  const perTopic = tracks
    .flatMap((track) => track.topics)
    .map((topic, i) => ({
      ...topic,
      id: String(i + 1),
      ordinal: i + 1,
      lessons: 1,
      read: Number(topic.level > 0),
      nextReview: topic.level > 1 ? date(i % 7) : null,
      to: screenPath("track"),
    }));
  const masteryDistribution = [0, 0, 0, 0, 0];
  for (const topic of perTopic) masteryDistribution[topic.level]!++;
  return {
    perTopic,
    masteryDistribution,
    perTrack: tracks.map((track, i) => ({
      trackId: track.id,
      title: track.title,
      language: locale.value,
      levels: track.topics.map((topic) => topic.level),
      completed: track.topics.filter((topic) => topic.level >= 2).length,
      updatedAt: date(-i),
      to: screenPath("track"),
    })),
    grill: { answers: 42, strong: 29, partial: 9, weak: 4 },
    reviews: { scheduled: 7, onTime: 6 },
    recentVerdicts: { strong: 29, partial: 9, weak: 4 },
    activity: [
      {
        id: "judgment",
        kind: "Grill verdict",
        title: t("progressSample.eventLoop"),
        detail: "strong",
        at: date(0),
      },
      {
        id: "review",
        kind: "Review result",
        title: t("progressSample.channels"),
        detail: "partial",
        at: date(-1),
      },
      {
        id: "lesson",
        kind: "Lesson read",
        title: t("progressSample.keys"),
        detail: null,
        at: date(-2),
      },
    ],
  };
});
const navTracks = computed(() =>
  data.value.perTrack.map((track) => ({
    id: track.trackId,
    title: track.title,
    language: track.language,
    to: track.to,
    percent: Math.round((100 * track.completed) / track.levels.length),
  })),
);
</script>
<template>
  <ShowcaseApp current="progress" :crumbs="[{ label: $t('nav.progress') }]" :tracks="navTracks">
    <UiProgressOverview :data="data" />
  </ShowcaseApp>
</template>
