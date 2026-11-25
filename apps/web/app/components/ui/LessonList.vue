<script setup lang="ts">
import type { LinkTarget } from "./nav";
import { NuxtLinkLocale } from "#components";
/** The Lessons of a Topic in order. A read Lesson carries a tick. */
defineProps<{
  lessons: {
    id: string;
    title: string;
    to?: LinkTarget;
    /** Left out on public pages, where there is no Lesson Progress. */
    read?: boolean;
    blocks?: number;
    minutes?: number;
  }[];
  label?: string;
}>();
const countArgs = useCountArgs();
</script>
<template>
  <ol class="s-lessons" :aria-label="label ?? $t('topic.lessons')">
    <li v-for="(l, i) in lessons" :key="l.id">
      <component
        :is="l.to ? NuxtLinkLocale : 'div'"
        :to="l.to"
        class="s-lessons__row"
        :class="{ 'is-read': l.read }"
      >
        <span class="s-lessons__tag">{{ "L" + String(i + 1).padStart(2, "0") }}</span>
        <span class="s-lessons__title">{{ l.title }}</span>
        <span class="s-lessons__facts">
          <span v-if="l.blocks">{{ $t("count.blocks", countArgs(l.blocks)) }}</span>
          <span v-if="l.minutes">{{ $t("lesson.minutes", { n: l.minutes }) }}</span>
        </span>
        <span v-if="l.read !== undefined" class="s-lessons__state">
          <UiIcon v-if="l.read" name="check" :size="14" /><span class="s-sr">{{
            l.read ? $t("topic.read") : $t("lesson.unread")
          }}</span>
        </span>
        <UiIcon v-if="l.to" name="chevron-right" :size="14" class="s-lessons__go" />
      </component>
    </li>
  </ol>
</template>
<style scoped>
.s-lessons {
  list-style: none;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-raised);
  overflow: hidden;
}
.s-lessons li + li {
  border-top: 1px solid var(--s-line);
}
.s-lessons__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto 1rem auto;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  color: var(--s-ink);
  text-decoration: none;
}
a.s-lessons__row:hover {
  background: var(--s-surface);
}
.s-lessons__tag,
.s-lessons__facts {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.06em;
  color: var(--s-ink-3);
}
.s-lessons__title {
  font-weight: 600;
  line-height: 1.3;
}
.s-lessons__facts {
  display: flex;
  gap: var(--s-3);
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.s-lessons__state {
  display: grid;
  color: var(--s-verdigris);
}
.s-lessons__go {
  color: var(--s-ink-3);
}
@container (max-width: 30rem) {
  .s-lessons__facts {
    display: none;
  }
}
</style>
