<script setup lang="ts">
import { privateTrackPath } from "../../../shared/locale";
import type { BoardTopic, TopicState } from "./board";
const props = defineProps<{
  details: {
    topic: { title: string; slug: string; summary?: string | null };
    mastery: { level: number };
    lessons: { id: string; title: string; readAt: string | null }[];
    prerequisites: { id: string; title: string }[];
    dependents: { id: string; title: string }[];
  };
  track?: string;
  board?: BoardTopic[];
  selected?: BoardTopic;
  state?: TopicState;
}>();
const parts = computed(() => new Map(props.board?.map((t) => [t.id, t])));
const lessons = computed(() =>
  props.details.lessons.map((l) => ({
    id: l.id,
    title: l.title,
    read: !!l.readAt,
    to: { path: "/lessons/" + l.id, query: { track: props.track } },
  })),
);
</script>
<template>
  <div class="s-split" style="--s-aside: 22rem">
    <section class="s-stack" style="--s-gap: var(--s-5)" aria-live="polite">
      <UiTopicCard
        :title="details.topic.title"
        :level="details.mastery.level"
        :tag="selected?.tag"
        :state="state"
        :lessons="{ read: lessons.filter((l) => l.read).length, total: lessons.length }"
      >
        <p v-if="details.topic.summary">{{ details.topic.summary }}</p>
      </UiTopicCard>
      <template v-if="lessons.length">
        <UiSectionHeading :title="$t('topic.lessons')" :count="lessons.length" />
        <UiLessonList :lessons="lessons" />
      </template>
      <UiEmptyState v-else :title="$t('topic.empty')" icon="lesson" compact />
    </section>
    <aside class="s-stack" style="--s-gap: var(--s-6)">
      <section class="s-stack" style="--s-gap: var(--s-3)">
        <UiSectionHeading :title="$t('topic.path')" :level="3" />
        <dl class="path">
          <div v-for="group in ['prerequisites', 'dependents'] as const" :key="group">
            <dt>
              {{ group === "prerequisites" ? $t("topic.prerequisites") : $t("topic.dependents") }}
            </dt>
            <dd>
              <NuxtLinkLocale
                v-for="topic in details[group]"
                :key="topic.id"
                class="path__topic"
                :to="
                  track && parts.has(topic.id)
                    ? { path: privateTrackPath(track), query: { topic: topic.id } }
                    : '/topics/' + topic.id
                "
              >
                <span v-if="parts.has(topic.id)" class="s-label">{{
                  parts.get(topic.id)?.tag
                }}</span>
                <span>{{ topic.title }}</span>
                <UiMastery
                  v-if="parts.has(topic.id)"
                  :level="parts.get(topic.id)!.level"
                  show="bars"
                  size="sm"
                />
              </NuxtLinkLocale>
              <span v-if="!details[group].length" class="s-muted">{{
                group === "prerequisites" ? $t("topic.entry") : $t("topic.end")
              }}</span>
            </dd>
          </div>
        </dl>
      </section>
      <slot name="sources" />
    </aside>
  </div>
</template>
<style scoped>
.path {
  display: grid;
  gap: var(--s-4);
}
.path dt {
  margin-bottom: var(--s-2);
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.path dd {
  display: grid;
  gap: var(--s-1);
  font-size: var(--s-text-sm);
}
.path__topic {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-2) var(--s-3);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-sm);
  background: var(--s-raised);
  font-weight: 600;
  text-align: left;
  color: var(--s-ink);
  text-decoration: none;
}
.path__topic:hover {
  border-color: var(--s-ink);
}
.path__topic > :only-child {
  grid-column: 1 / -1;
}
</style>
