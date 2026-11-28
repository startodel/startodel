<script setup lang="ts">
import type { GrillSession } from "@startodel/core";
import type { LinkTarget } from "./nav";

defineProps<{ to: LinkTarget; title: string; createdAt: string; status: GrillSession["status"] }>();
const displayDate = useDisplayDate("short");
const id = useId();
</script>
<template>
  <li class="s-grill-row">
    <NuxtLinkLocale
      class="s-grill-row__link"
      :to="to"
      :aria-labelledby="id + '-title'"
      :aria-describedby="id + '-date ' + id + '-status'"
    >
      <div class="s-grill-row__main">
        <time :id="id + '-date'" class="s-grill-row__date" :datetime="createdAt">{{
          displayDate(createdAt)
        }}</time>
        <h2 :id="id + '-title'" class="s-grill-row__title">{{ title }}</h2>
      </div>
      <UiBadge
        :id="id + '-status'"
        :icon="status === 'finished' ? 'check' : 'grill'"
        variant="outline"
        >{{ status === "finished" ? $t("grill.finished") : $t("grill.open") }}</UiBadge
      >
    </NuxtLinkLocale>
  </li>
</template>
<style scoped>
.s-grill-row {
  list-style: none;
}
.s-grill-row__link {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--s-4);
  padding: var(--s-4);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-raised);
  color: var(--s-ink);
  text-decoration: none;
}
.s-grill-row__link:hover {
  border-color: var(--s-ink);
  box-shadow: var(--s-shadow-2);
}
.s-grill-row__main {
  display: grid;
  gap: var(--s-1);
}
.s-grill-row__date {
  color: var(--s-ink-2);
  font-size: var(--s-text-sm);
}
.s-grill-row__title {
  font-size: var(--s-text-lg);
  font-weight: 600;
  line-height: 1.25;
  overflow-wrap: anywhere;
}
</style>
