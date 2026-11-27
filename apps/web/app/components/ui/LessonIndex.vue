<script setup lang="ts">
import type { IconName } from "./icons";
/** The parts list of a Lesson: every Block with its designator, linked to its place on the page. */
const props = defineProps<{
  blocks: { id: string; icon: IconName; title: string; done?: boolean }[];
  /** The id of the Block in view. */
  current?: string;
  label?: string;
}>();
const visible = ref<string>();
onMounted(() => {
  if (props.current !== undefined) return;
  const observer = new IntersectionObserver(
    (entries) => {
      const active = entries.find((entry) => entry.isIntersecting);
      if (active) visible.value = active.target.id;
    },
    { rootMargin: "-20% 0px -65% 0px" },
  );
  watch(
    () => props.blocks.map((b) => b.id),
    (ids) => {
      observer.disconnect();
      for (const id of ids) {
        const block = document.getElementById(id);
        if (block) observer.observe(block);
      }
    },
    { immediate: true, flush: "post" },
  );
  onBeforeUnmount(() => observer.disconnect());
});
const active = computed(() => props.current ?? visible.value ?? props.blocks[0]?.id);
</script>
<template>
  <nav class="s-index" :aria-label="label ?? $t('lesson.contents')">
    <p class="s-index__label">{{ label ?? $t("lesson.contents") }}</p>
    <ol class="s-index__list">
      <li v-for="(b, i) in blocks" :key="b.id">
        <a
          class="s-index__item"
          :class="{ 'is-current': active === b.id, 'is-done': b.done }"
          :href="'#' + b.id"
          :aria-current="active === b.id ? 'location' : undefined"
        >
          <span class="s-index__ref">{{ "B" + String(i + 1).padStart(2, "0") }}</span>
          <UiIcon :name="b.icon" :size="12" class="s-index__icon" />
          <span class="s-index__title">{{ b.title }}</span>
          <UiIcon v-if="b.done" name="check" :size="12" class="s-index__done" />
        </a>
      </li>
    </ol>
  </nav>
</template>
<style scoped>
.s-index {
  display: grid;
  gap: var(--s-3);
  min-width: 0;
}
.s-index__label {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-index__list {
  display: grid;
  list-style: none;
  border-left: 1px solid var(--s-line);
}
.s-index__item {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--s-2);
  margin-left: -1px;
  padding: 0.375rem var(--s-2) 0.375rem var(--s-3);
  border-left: 2px solid transparent;
  color: var(--s-ink-2);
  font-size: var(--s-text-sm);
  text-decoration: none;
}
.s-index__item:hover {
  color: var(--s-ink);
  background: var(--s-surface);
}
.s-index__item.is-current {
  border-left-color: var(--s-copper-fill);
  color: var(--s-ink);
  font-weight: 600;
}
.s-index__ref {
  font: 500 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.06em;
  color: var(--s-ink-3);
}
.s-index__icon {
  color: var(--s-ink-3);
}
.is-current .s-index__icon {
  color: var(--s-copper);
}
.s-index__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.s-index__done {
  color: var(--s-verdigris);
}
</style>
