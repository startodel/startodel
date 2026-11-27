<script setup lang="ts">
import { NuxtLinkLocale } from "#components";
import type { PublicAuthor, TrackLanguage, TrackSources } from "@startodel/core";
import type { BoardEdge } from "./board";
import type { publicTrackTopics } from "../../utils/public-track";

const props = defineProps<{
  title: string;
  slug: string;
  language: TrackLanguage;
  description: ReturnType<typeof splitTrackDescription>;
  author: PublicAuthor;
  profileTo?: string;
  publicUrl: string;
  topics: ReturnType<typeof publicTrackTopics>;
  edges: BoardEdge[];
  sources: TrackSources;
  forkCount: number;
  dates: string;
}>();
const countArgs = useCountArgs();
const lessonCount = computed(() =>
  props.topics.reduce((sum, topic) => sum + topic.lessons.length, 0),
);
const selected = ref<string>();
const preview = computed(() => props.topics.find((topic) => topic.id === selected.value));
const { state: copyState, copy } = useCopy();
</script>
<template>
  <article class="s-page public">
    <header class="public__head">
      <p class="public__owner">
        <UiAvatar :name="author.name || author.login" :src="author.avatarUrl" :size="24" />
        <NuxtLinkLocale v-if="profileTo" class="public__login" :to="profileTo"
          >@{{ author.login }}</NuxtLinkLocale
        >
        <span v-else>@{{ author.login }}</span>
        <span>/ {{ slug }}</span>
      </p>
      <h1 class="s-title">{{ title }}</h1>
      <p v-if="description.lead" class="public__lead">{{ description.lead }}</p>
      <div class="s-cluster public__stats">
        <slot name="forked-from" />
        <UiTrackLanguageBadge :language="language" />
        <UiBadge icon="track">{{ $t("count.topics", countArgs(topics.length)) }}</UiBadge>
        <UiBadge icon="lesson">{{ $t("count.lessons", countArgs(lessonCount)) }}</UiBadge>
        <UiBadge icon="fork">{{ $t("count.forks", countArgs(forkCount)) }}</UiBadge>
        <span class="s-muted">{{ dates }}</span>
      </div>
      <div class="s-cluster public__actions">
        <slot name="actions" />
        <UiButton icon="link" @click="copy(publicUrl)">{{ $t("visibility.copy") }}</UiButton>
        <slot name="action-detail" />
        <span role="status">{{
          copyState === "copied" ? $t("common.copied") : copyState === "failed" ? publicUrl : ""
        }}</span>
      </div>
      <slot name="notice" />
    </header>

    <figure v-if="topics.length" class="public__board">
      <UiTrackMap
        v-model:selected="selected"
        class="s-grid"
        :topics="topics"
        :edges="edges"
        :label="$t('track.graph')"
        :flow="false"
        outline
        interactive
      />
      <figcaption class="public__caption">
        <span class="s-label">{{ $t("track.graph") }} · {{ $t("public.inspect") }}</span>
        <div v-if="preview" class="public__preview" aria-live="polite">
          <a :href="'#topic-' + preview.id" class="s-link"
            >{{ preview.tag }} · {{ preview.title }}</a
          >
          <span v-if="preview.summary">{{ preview.summary }}</span>
        </div>
      </figcaption>
    </figure>

    <section v-if="description.overview" class="public__section">
      <UiSectionHeading :title="$t('public.about')" />
      <UiProse :markdown="description.overview" />
    </section>
    <section class="public__section" :aria-label="$t('public.syllabus')">
      <UiSectionHeading :title="$t('public.syllabus')" :count="$n(topics.length)" />
      <ol v-if="topics.length" class="public__syllabus">
        <li
          v-for="topic in topics"
          :id="'topic-' + topic.id"
          :key="topic.id"
          class="public__topic"
          :class="{ 'is-selected': selected === topic.id }"
        >
          <h3 class="public__title">
            <span class="s-label">{{ topic.tag }}</span> {{ topic.title }}
          </h3>
          <p v-if="topic.summary" class="public__summary">{{ topic.summary }}</p>
          <div v-if="topic.prerequisites.length" class="s-cluster public__requires">
            <span class="s-label">{{ $t("topic.prerequisites") }}</span>
            <a
              v-for="prerequisite in topic.prerequisites"
              :key="prerequisite.id"
              class="s-link"
              :href="'#topic-' + prerequisite.id"
              >{{ prerequisite.tag }} · {{ prerequisite.title }}</a
            >
          </div>
          <UiLessonList v-if="topic.lessons.length" :lessons="topic.lessons" />
          <p v-else class="s-muted">{{ $t("topic.empty") }}</p>
        </li>
      </ol>
      <UiEmptyState v-else :title="$t('track.empty')" icon="track" compact />
    </section>

    <UiTrackSources :sources="sources" />
    <footer class="s-columns public__footer">
      <section class="s-stack">
        <UiSectionHeading :title="$t('public.author')" />
        <component :is="profileTo ? NuxtLinkLocale : 'div'" :to="profileTo" class="public__author">
          <UiAvatar :name="author.name || author.login" :src="author.avatarUrl" :size="44" />
          <span class="public__identity">
            <strong v-if="author.name">{{ author.name }}</strong>
            <span class="s-muted">@{{ author.login }}</span>
          </span>
          <UiIcon v-if="profileTo" name="arrow-right" :size="16" />
        </component>
      </section>
      <section id="forks" class="s-stack"><slot name="forks" /></section>
    </footer>
  </article>
</template>
<style scoped>
.public {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-8);
  padding-block: var(--s-8) var(--s-16);
  overflow-wrap: anywhere;
}
.public__head,
.public__preview {
  display: grid;
  gap: var(--s-3);
}
.public__owner,
.public__author,
.public__title {
  display: flex;
  align-items: center;
  gap: var(--s-3);
}
.public__owner {
  flex-wrap: wrap;
  gap: var(--s-2);
  color: var(--s-ink-3);
  font: 500 var(--s-text-sm) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
}
.public__login,
.public__author {
  color: var(--s-ink);
  text-decoration: none;
}
.public__login:hover,
a.public__author:hover strong {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
.public__lead {
  max-width: var(--s-read-measure);
  font-size: var(--s-text-lg);
  color: var(--s-ink-2);
}
.public__stats,
.public__actions,
.public__requires {
  font-size: var(--s-text-sm);
}
.public__actions {
  padding-top: var(--s-3);
  border-top: 1px solid var(--s-line);
}
.public__board {
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-md);
  background: var(--s-sunken);
  overflow: hidden;
}
.public__caption {
  padding: var(--s-3) var(--s-4);
  border-top: 1px solid var(--s-line);
  background: var(--s-surface);
}
.public__preview {
  gap: var(--s-1);
  margin-top: var(--s-2);
  font-size: var(--s-text-sm);
}
.public__section,
.public__topic {
  display: grid;
  gap: var(--s-4);
  align-content: start;
}
@container s-main (min-width: 52rem) {
  .public__section {
    grid-template-columns: minmax(10rem, 1fr) minmax(0, 3fr);
    align-items: start;
    gap: var(--s-8);
  }
}
.public__topic {
  gap: var(--s-3);
  padding: var(--s-5) var(--s-4);
  border-top: 1px solid var(--s-line);
  scroll-margin-block-start: var(--s-6);
}
.public__topic:is(.is-selected, :target) {
  box-shadow: inset 3px 0 var(--s-copper);
}
.public__title {
  align-items: baseline;
  font-size: var(--s-text-xl);
  line-height: 1.25;
}
.public__title .s-label {
  color: var(--s-copper);
}
.public__summary {
  max-width: var(--s-read-measure);
  color: var(--s-ink-2);
}
.public__footer {
  --s-gap: var(--s-8);
  border-top: 1px solid var(--s-line-strong);
  padding-top: var(--s-6);
}
.public__author {
  width: fit-content;
}
.public__identity {
  display: grid;
}
</style>
