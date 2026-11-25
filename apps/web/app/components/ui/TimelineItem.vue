<script setup lang="ts">
import type { IconName } from "./icons";
withDefaults(
  defineProps<{
    kind: string;
    title: string;
    time?: string;
    datetime?: string;
    icon?: IconName;
    tone?: "neutral" | "copper" | "verdigris" | "brass" | "oxide";
  }>(),
  { tone: "neutral" },
);
</script>
<template>
  <li class="s-timeline-item" :class="'s-timeline-item--' + tone">
    <span class="s-timeline-item__pad" aria-hidden="true"
      ><UiIcon v-if="icon" :name="icon" :size="12"
    /></span>
    <div class="s-timeline-item__body">
      <p class="s-timeline-item__head">
        <span class="s-timeline-item__kind">{{ kind }}</span>
        <time v-if="time" class="s-timeline-item__time" :datetime="datetime">{{ time }}</time>
      </p>
      <p class="s-timeline-item__title">{{ title }}</p>
      <div v-if="$slots.default" class="s-timeline-item__detail"><slot /></div>
    </div>
  </li>
</template>
<style scoped>
.s-timeline-item {
  --_ink: var(--s-ink-3);
  position: relative;
  display: grid;
  grid-template-columns: 1.5rem 1fr;
  gap: var(--s-3);
  padding-bottom: var(--s-5);
}
.s-timeline-item--copper {
  --_ink: var(--s-copper);
}
.s-timeline-item--verdigris {
  --_ink: var(--s-verdigris);
}
.s-timeline-item--brass {
  --_ink: var(--s-brass);
}
.s-timeline-item--oxide {
  --_ink: var(--s-oxide);
}
.s-timeline-item::before {
  content: "";
  position: absolute;
  left: calc(0.75rem - 0.5px);
  top: 1.5rem;
  bottom: 0;
  width: 1px;
  background: var(--s-line-strong);
}
.s-timeline-item:last-child {
  padding-bottom: 0;
}
.s-timeline-item:last-child::before {
  display: none;
}
.s-timeline-item__pad {
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border: 1px solid var(--_ink);
  border-radius: 50%;
  background: var(--s-bg);
  color: var(--_ink);
}
.s-timeline-item__pad:empty {
  width: 0.5625rem;
  height: 0.5625rem;
  margin: 0.46875rem;
}
.s-timeline-item__body {
  min-width: 0;
  display: grid;
  gap: 0.125rem;
}
.s-timeline-item__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s-3);
  min-height: 1.5rem;
  font: 500 var(--s-text-2xs) / 1.5rem var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.s-timeline-item__kind {
  color: var(--_ink);
}
.s-timeline-item__time {
  color: var(--s-ink-3);
  white-space: nowrap;
}
.s-timeline-item__title {
  font-weight: 600;
  overflow-wrap: anywhere;
}
.s-timeline-item__detail {
  color: var(--s-ink-2);
  font-size: var(--s-text-sm);
}
</style>
