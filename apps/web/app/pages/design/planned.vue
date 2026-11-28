<script setup lang="ts">
import {
  ShowcasePlannedAccess,
  ShowcasePlannedAgent,
  ShowcasePlannedAnalytics,
  ShowcasePlannedCodePractice,
  ShowcasePlannedFeedback,
  ShowcasePlannedLeaderboard,
  ShowcasePlannedLessonBlocks,
  ShowcasePlannedMedia,
  ShowcasePlannedProposals,
  ShowcasePlannedVersions,
} from "#components";
definePageMeta({ middleware: "design" });
useHead({ title: "Design planned components" });
const issues = "https://github.com/startodel/startodel/issues/";
const sections = [
  {
    id: "lesson-blocks",
    title: "Lesson blocks",
    issue: 82,
    lead: "A before-and-after comparison and a diagram, in the visual language of the Code Block.",
    view: ShowcasePlannedLessonBlocks,
  },
  {
    id: "code-practice",
    title: "Code practice",
    issue: 52,
    lead: "An Exercise with an editor, a saved attempt and a test runner that reports each test.",
    view: ShowcasePlannedCodePractice,
  },
  {
    id: "media",
    title: "Media and files",
    issue: 54,
    lead: "Attachments, uploads and the storage quota of an Owner.",
    view: ShowcasePlannedMedia,
  },
  {
    id: "agent",
    title: "Connected agent",
    issue: 48,
    lead: "Which client is connected, and how well it follows the way Startodel teaches.",
    view: ShowcasePlannedAgent,
  },
  {
    id: "feedback",
    title: "Block comments",
    issue: 58,
    lead: "A learner comments on a Block. The author reads the open comments in one inbox.",
    view: ShowcasePlannedFeedback,
  },
  {
    id: "proposals",
    title: "Change proposals",
    issue: 58,
    lead: "An edit made in a Fork, offered back to the source Track as a Block-level difference.",
    view: ShowcasePlannedProposals,
  },
  {
    id: "versions",
    title: "Versions and export",
    issue: 56,
    lead: "Published versions of a Track with their notes, and a portable export and import.",
    view: ShowcasePlannedVersions,
  },
  {
    id: "access",
    title: "Gated access",
    issue: 53,
    lead: "A public syllabus with locked Lessons, a request for access and the author's grants.",
    view: ShowcasePlannedAccess,
  },
  {
    id: "analytics",
    title: "Author analytics",
    issue: 59,
    lead: "How many learners started, where they stall and how Mastery is distributed.",
    view: ShowcasePlannedAnalytics,
  },
  {
    id: "leaderboard",
    title: "Points and leaderboard",
    issue: 37,
    lead: "Points for learning activity and a ranking among public learners.",
    view: ShowcasePlannedLeaderboard,
  },
];
</script>
<template>
  <ShowcaseDocs :sections="sections">
    <header class="intro">
      <p class="s-label intro__kicker">Startodel design system · Planned</p>
      <h1 class="s-title">Planned components</h1>
      <p class="intro__lead">
        Interface for features on the roadmap. Each component is real and themed, renders sample
        data and calls no API. A feature is built by wiring these components to its data.
      </p>
    </header>
    <ShowcaseSection
      v-for="(s, i) in sections"
      :id="s.id"
      :key="s.id"
      :title="s.title"
      :index="i + 1"
    >
      <template #lead
        >{{ s.lead }}
        <a class="s-link" :href="issues + s.issue" target="_blank" rel="noopener"
          >Issue #{{ s.issue }}</a
        ></template
      >
      <component :is="s.view" />
    </ShowcaseSection>
  </ShowcaseDocs>
</template>
<style scoped>
.intro {
  display: grid;
  gap: var(--s-3);
  margin-bottom: var(--s-12);
}
.intro__kicker {
  color: var(--s-copper);
}
.intro__lead {
  max-width: 44rem;
  font-size: var(--s-text-lg);
  color: var(--s-ink-2);
}
</style>
