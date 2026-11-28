<script setup lang="ts">
import { NuxtLinkLocale } from "#components";
import type { SyllabusTopic } from "./access";
/**
 * The syllabus of a gated Track as a plain list: Topics in order, each with its Lessons. A
 * visitor sees which Lessons are locked and which are open as a preview. A learner with access
 * sees what they have read.
 */
const props = defineProps<{ topics: SyllabusTopic[] }>();
const { t } = useI18n();
const countArgs = useCountArgs();
const indexTag = useIndexTag();
const id = useId();
const lessons = computed(() => props.topics.flatMap((topic) => topic.lessons));
const counts = computed(() => {
  const all = lessons.value;
  const parts = [
    t("count.topics", countArgs(props.topics.length)),
    t("count.lessons", countArgs(all.length)),
  ];
  const previews = all.filter((lesson) => lesson.preview).length;
  const tracked = all.some((lesson) => lesson.read !== undefined);
  if (all.some((lesson) => lesson.locked) && previews)
    parts.push(t("access.previews", countArgs(previews)));
  else if (tracked)
    parts.push(t("access.readCount", countArgs(all.filter((lesson) => lesson.read).length)));
  return parts;
});
</script>
<template>
  <section class="s-syllabus" :aria-labelledby="id">
    <header class="s-syllabus__head">
      <UiSectionHeading :id="id" :title="t('access.syllabus')" />
      <p class="s-syllabus__counts">{{ counts.join(" · ") }}</p>
    </header>
    <ol class="s-syllabus__topics">
      <li v-for="(topic, i) in topics" :key="topic.id" class="s-syllabus__topic">
        <h3 class="s-syllabus__title">
          <span class="s-syllabus__tag">{{ indexTag("topic", i + 1) }}</span>{{ topic.title }}
        </h3>
        <ol class="s-syllabus__lessons">
          <li v-for="(lesson, j) in topic.lessons" :key="lesson.id">
            <component
              :is="lesson.to && !lesson.locked ? NuxtLinkLocale : 'div'"
              :to="lesson.locked ? undefined : lesson.to"
              class="s-syllabus__row"
              :class="{ 'is-locked': lesson.locked }"
            >
              <span class="s-syllabus__tag">{{ indexTag("lesson", j + 1) }}</span>
              <span class="s-syllabus__lesson">{{ lesson.title }}</span>
              <span class="s-syllabus__state">
                <template v-if="lesson.locked"
                  ><UiIcon name="lock" :size="14" /><span class="s-sr">{{
                    t("access.locked")
                  }}</span></template
                >
                <UiBadge v-else-if="lesson.preview" variant="outline" icon="pad">{{
                  t("access.preview")
                }}</UiBadge>
                <template v-if="!lesson.locked && lesson.read !== undefined"
                  ><UiIcon
                    v-if="lesson.read"
                    name="check"
                    :size="14"
                    class="s-syllabus__read"
                  /><span class="s-sr">{{
                    lesson.read ? t("access.read") : t("access.unread")
                  }}</span></template
                >
              </span>
            </component>
          </li>
        </ol>
      </li>
    </ol>
  </section>
</template>
<style scoped>
.s-syllabus {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-4);
}
.s-syllabus__head {
  display: grid;
  gap: var(--s-2);
}
.s-syllabus__counts,
.s-syllabus__tag {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  color: var(--s-ink-3);
}
.s-syllabus__counts {
  text-transform: uppercase;
}
.s-syllabus__topics,
.s-syllabus__lessons {
  list-style: none;
}
.s-syllabus__topics {
  display: grid;
  gap: var(--s-5);
}
.s-syllabus__topic {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}
.s-syllabus__title {
  display: grid;
  grid-template-columns: 2.25rem minmax(0, 1fr);
  align-items: baseline;
  padding-bottom: var(--s-2);
  border-bottom: 1px solid var(--s-line-strong);
  font-size: var(--s-text-md);
  font-weight: 600;
  line-height: 1.3;
  color: var(--s-ink);
}
.s-syllabus__title .s-syllabus__tag {
  color: var(--s-ink);
}
.s-syllabus__lessons li + li {
  border-top: 1px solid var(--s-line);
}
.s-syllabus__row {
  display: grid;
  grid-template-columns: 2.25rem minmax(0, 1fr) auto;
  align-items: center;
  min-height: 2.5rem;
  padding: var(--s-2) 0;
  font-size: var(--s-text-sm);
  line-height: 1.4;
  color: var(--s-ink);
  text-decoration: none;
}
.s-syllabus__row.is-locked {
  color: var(--s-ink-2);
}
a.s-syllabus__row:hover .s-syllabus__lesson {
  text-decoration: underline;
  text-decoration-color: var(--s-copper-fill);
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;
}
.s-syllabus__state {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  min-width: 1rem;
  margin-left: var(--s-3);
  color: var(--s-ink-3);
}
.s-syllabus__state .s-syllabus__read {
  color: var(--s-verdigris);
}
</style>
