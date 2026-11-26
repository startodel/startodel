<script setup lang="ts">
const props = defineProps<{
  details: {
    topic: { title: string; slug: string; summary?: string | null };
    mastery: { level: number };
    lessons: { id: string; title: string; readAt: string | null }[];
    prerequisites: { id: string; title: string }[];
    dependents: { id: string; title: string }[];
  };
  track?: string;
}>();
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
  <section class="s-stack" aria-live="polite">
    <UiTopicCard
      :title="details.topic.title"
      :slug="details.topic.slug"
      :level="details.mastery.level"
      :lessons="{ read: lessons.filter((l) => l.read).length, total: lessons.length }"
    >
      <p v-if="details.topic.summary">{{ details.topic.summary }}</p>
    </UiTopicCard>
    <template v-if="lessons.length">
      <UiSectionHeading :title="$t('topic.lessons')" :count="lessons.length" />
      <UiLessonList :lessons="lessons" />
    </template>
    <UiEmptyState v-else :title="$t('topic.empty')" icon="lesson" compact />
    <template v-for="group in ['prerequisites', 'dependents'] as const" :key="group">
      <section v-if="details[group].length" class="s-stack">
        <UiSectionHeading
          :title="group === 'prerequisites' ? $t('topic.prerequisites') : $t('topic.dependents')"
        />
        <ul>
          <li v-for="topic in details[group]" :key="topic.id">{{ topic.title }}</li>
        </ul>
      </section>
    </template>
  </section>
</template>
